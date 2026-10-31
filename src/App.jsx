import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";
import { TYPE_LABELS } from "./types";
import { fetchZone, fetchMassifPoints, fetchPointsByIds, fetchFiche, fetchMassifs, fetchAllPoints, fetchAllPointsDetail, fetchPointsDetail } from "./api";

const FAVORIS_KEY = "refuges-favoris";

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAVORIS_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export default function App() {
  const [mode, setMode] = useState({ type: "zone" }); // {type:'zone'} | {type:'massif', id:string} | {type:'favoris'}
  const [bbox, setBbox] = useState(null);
  const [features, setFeatures] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("Chargement…");
  const [massifs, setMassifs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [fiche, setFiche] = useState(null);
  const [ficheLoading, setFicheLoading] = useState(false);
  const [tab, setTab] = useState("liste");
  const [filterText, setFilterText] = useState("");
  const [uncheckedTypes, setUncheckedTypes] = useState(() => new Set());
  const [focus, setFocus] = useState(null);
  const [basemap, setBasemap] = useState("osm");
  const [userPos, setUserPos] = useState(null);
  const [favorites, setFavorites] = useState(loadFavorites);
  const [recentDays, setRecentDays] = useState(0);
  const [massifQuery, setMassifQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchCount, setSearchCount] = useState(null);
  const [searching, setSearching] = useState(false);
  const allPointsRef = useRef(null);
  const allDetailRef = useRef(null);
  const fetchToken = useRef(0);

  useEffect(() => {
    fetchMassifs()
      .then((d) =>
        setMassifs(
          (d.features || [])
            .map((f) => ({ id: f.id, nom: f.properties?.nom || f.properties?.name }))
            .filter((m) => m.nom)
            .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
        )
      )
      .catch(() => setStatus("Impossible de charger la liste des massifs"));
  }, []);

  useEffect(() => {
    if (mode.type === "favoris") return; // géré par l'effet dédié ci-dessous
    const token = ++fetchToken.current;
    let promise;
    if (mode.type === "zone") {
      if (!bbox) return;
      setStatus("Chargement de la zone visible…");
      promise = fetchZone(bbox, recentDays);
    } else {
      setStatus("Chargement du massif…");
      promise = fetchMassifPoints(mode.id, recentDays);
    }
    promise
      .then((data) => {
        if (token !== fetchToken.current) return;
        setFeatures(data.features || []);
        setTotal(data.size ?? (data.features || []).length);
        setStatus("");
      })
      .catch((e) => {
        if (token !== fetchToken.current) return;
        setStatus("Erreur de chargement : " + e.message);
      });
  }, [mode, bbox, recentDays]);

  useEffect(() => {
    if (mode.type !== "favoris") return;
    const token = ++fetchToken.current;
    if (favorites.size === 0) {
      setFeatures([]);
      setTotal(0);
      setStatus("Aucun favori — cliquez sur ☆ dans la liste ou la fiche");
      return;
    }
    setStatus("Chargement des favoris…");
    fetchPointsByIds([...favorites])
      .then((data) => {
        if (token !== fetchToken.current) return;
        setFeatures(data.features || []);
        setTotal(data.features?.length ?? 0);
        setStatus("");
      })
      .catch((e) => {
        if (token === fetchToken.current) setStatus("Erreur de chargement : " + e.message);
      });
  }, [mode, favorites]);

  // Liste des types TOUJOURS exhaustive : les types connus de l'API (TYPE_LABELS),
  // complétés par les labels réellement rencontrés (ids exotiques éventuels).
  // Ne dépend PAS de la zone visible : le filtre ne change plus selon le zoom.
  const allTypes = useMemo(() => {
    const m = new Map();
    for (const [id, label] of Object.entries(TYPE_LABELS)) m.set(Number(id), label);
    for (const f of features) {
      const t = f.properties?.type;
      if (t && t.id != null && !m.has(t.id)) m.set(t.id, t.valeur);
    }
    return m;
  }, [features]);

  // Nombre de points de chaque type dans la zone courante (pour l'affichage)
  const typeCounts = useMemo(() => {
    const c = new Map();
    for (const f of features) {
      const id = f.properties?.type?.id;
      if (id != null) c.set(id, (c.get(id) || 0) + 1);
    }
    return c;
  }, [features]);

  const visibleFeatures = useMemo(() => {
    if (uncheckedTypes.size === 0) return features;
    return features.filter((f) => !uncheckedTypes.has(f.properties?.type?.id));
  }, [features, uncheckedTypes]);

  // Base complète mise en cache (mémoire + sessionStorage)
  const loadAllPoints = useCallback(async () => {
    if (allPointsRef.current) return allPointsRef.current;
    let cached = null;
    try {
      cached = sessionStorage.getItem("refuges-all");
    } catch {
      /* sessionStorage indisponible */
    }
    if (cached) {
      allPointsRef.current = JSON.parse(cached);
      return allPointsRef.current;
    }
    const data = await fetchAllPoints();
    allPointsRef.current = data.features || [];
    try {
      sessionStorage.setItem("refuges-all", JSON.stringify(allPointsRef.current));
    } catch {
      /* quota dépassé, on garde en mémoire seulement */
    }
    return allPointsRef.current;
  }, []);

  // Filtres de base (présents dans le détail "simple")
  const applyBaseFilters = (list, params) => {
    const needle = (params.q || "").toLowerCase();
    let res = list;
    if (needle) res = res.filter((f) => (f.properties?.nom || "").toLowerCase().includes(needle));
    if (params.types) res = res.filter((f) => params.types.has(f.properties?.type?.id));
    if (params.altMin != null)
      res = res.filter((f) => (f.properties?.coord?.alt ?? -Infinity) >= params.altMin);
    if (params.altMax != null)
      res = res.filter((f) => (f.properties?.coord?.alt ?? Infinity) <= params.altMax);
    if (params.placesMin != null)
      res = res.filter((f) => (f.properties?.places?.valeur ?? -1) >= params.placesMin);
    if (params.etat)
      res = res.filter((f) =>
        (f.properties?.etat?.valeur || "").toLowerCase().includes(params.etat)
      );
    return res;
  };

  // Filtre équipements (info_comp, tri-état Oui/Non/Inconnu)
  const matchEquip = (feature, equipEntries) => {
    const ic = feature.properties?.info_comp || {};
    return equipEntries.every(([key, val]) => {
      const v = String(ic[key]?.valeur ?? "").replace(/<[^>]+>/g, "").trim().toLowerCase();
      return val === "oui" ? v === "oui" : v === "non";
    });
  };

  // Base complète en détail complet (~20 Mo), chargée une seule fois en mémoire
  const loadAllDetail = useCallback(async () => {
    if (allDetailRef.current) return allDetailRef.current;
    const data = await fetchAllPointsDetail();
    allDetailRef.current = data.features || [];
    return allDetailRef.current;
  }, []);

  // Recherche détaillée multi-critères dans toute la base
  const runSearch = useCallback(
    async (params) => {
      setSearching(true);
      setStatus("Recherche dans toute la base…");
      try {
        const all = await loadAllPoints();
        const equipEntries = Object.entries(params.equip || {}).filter(
          ([, v]) => v === "oui" || v === "non"
        );
        let res = applyBaseFilters(all, params);

        if (equipEntries.length > 0) {
          if (res.length <= 800) {
            // Peu de candidats : on charge le détail complet par paquets de 100 ids
            setStatus(`Chargement des détails de ${res.length} candidat(s)…`);
            const details = new Map();
            for (let i = 0; i < res.length; i += 100) {
              const data = await fetchPointsDetail(res.slice(i, i + 100).map((f) => f.id));
              (data.features || []).forEach((f) => details.set(f.id, f));
            }
            res = res.filter((f) => {
              const d = details.get(f.id);
              return d ? matchEquip(d, equipEntries) : false;
            });
          } else {
            // Beaucoup de candidats : on charge la base complète détaillée (~20 Mo,
            // une seule fois en mémoire) et on filtre tout dessus, sinon des points
            // pertinents seraient arbitrairement écartés.
            setStatus("Chargement de la base détaillée (~20 Mo, une fois pour toutes)…");
            const allDetail = await loadAllDetail();
            res = applyBaseFilters(allDetail, params).filter((f) => matchEquip(f, equipEntries));
          }
        }

        res = res.slice(0, 500);
        setSearchResults(res);
        setSearchCount(res.length);
        setStatus(`${res.length} résultat(s)`);
        setTab("liste"); // afficher les résultats dans la liste
      } catch (e) {
        setStatus("Erreur de recherche : " + e.message);
      } finally {
        setSearching(false);
      }
    },
    [loadAllPoints, loadAllDetail]
  );

  const clearSearch = useCallback(() => {
    setSearchResults(null);
    setSearchCount(null);
    setStatus("");
  }, []);

  const displayedFeatures = searchResults ?? visibleFeatures;

  const toggleType = useCallback((id, checked) => {
    setUncheckedTypes((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectPoint = useCallback((id) => {
    setSelectedId(id);
    setTab("fiche");
    setFiche(null);
    setFicheLoading(true);
    fetchFiche(id)
      .then((data) => {
        const f = data.features?.[0] || null;
        setFiche(f);
        const c = f?.geometry?.coordinates;
        if (c) setFocus([c[1], c[0]]);
      })
      .catch((e) => setFiche({ error: e.message }))
      .finally(() => setFicheLoading(false));
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("Géolocalisation non disponible sur ce navigateur");
      return;
    }
    setStatus("Localisation en cours…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setFocus(p);
        setMode({ type: "zone" });
        setStatus("Position trouvée");
      },
      (err) => setStatus("Géolocalisation indisponible : " + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const onMassifQueryChange = useCallback(
    (q) => {
      setMassifQuery(q);
      const m = massifs.find((mm) => mm.nom.toLowerCase() === q.trim().toLowerCase());
      if (m) setMode({ type: "massif", id: String(m.id) });
    },
    [massifs]
  );

  const onZoneClick = useCallback(() => {
    setMode({ type: "zone" });
    setMassifQuery("");
  }, []);

  const onNavigate = useCallback((b) => setBbox(b), []);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(FAVORIS_KEY, JSON.stringify([...next]));
      } catch {
        /* stockage indisponible */
      }
      return next;
    });
  }, []);

  const changeTab = useCallback(
    (t) => {
      setTab((prev) => {
        if (t === "favoris") setMode({ type: "favoris" });
        else if (prev === "favoris" && t === "liste") setMode({ type: "zone" });
        return t;
      });
    },
    []
  );

  return (
    <>
      <Header
        massifs={massifs}
        massifQuery={massifQuery}
        onMassifQueryChange={onMassifQueryChange}
        onZoneClick={onZoneClick}
        zoneActive={mode.type === "zone"}
        basemap={basemap}
        onBasemapChange={setBasemap}
        onLocate={locate}
        located={userPos != null}
        recentDays={recentDays}
        onRecentChange={setRecentDays}
        status={status}
        allTypes={allTypes}
        typeCounts={typeCounts}
        uncheckedTypes={uncheckedTypes}
        onToggleType={toggleType}
      />
      <main>
        <MapView features={displayedFeatures} onSelect={selectPoint} onNavigate={onNavigate} focus={focus} basemap={basemap} userPos={userPos} />
        <Sidebar
          tab={tab}
          onTabChange={changeTab}
          count={displayedFeatures.length}
          total={total}
          filterText={filterText}
          onFilterChange={setFilterText}
          features={displayedFeatures}
          onSearch={runSearch}
          onClearSearch={clearSearch}
          searching={searching}
          searchCount={searchCount}
          searchActive={searchResults != null}
          selectedId={selectedId}
          onSelect={selectPoint}
          fiche={fiche}
          ficheLoading={ficheLoading}
          userPos={userPos}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      </main>
      <footer id="credits">
        Données <a href="https://www.refuges.info" target="_blank" rel="noopener">refuges.info</a> (CC BY-SA 2.0) &middot; Carte &copy;{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> (ODbL)
      </footer>
    </>
  );
}
