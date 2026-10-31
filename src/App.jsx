import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";
import { fetchZone, fetchMassifPoints, fetchPointsByIds, fetchFiche, fetchMassifs } from "./api";

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
      promise = fetchZone(bbox);
    } else {
      setStatus("Chargement du massif…");
      promise = fetchMassifPoints(mode.id);
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
  }, [mode, bbox]);

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

  const allTypes = useMemo(() => {
    const m = new Map();
    for (const f of features) {
      const t = f.properties?.type;
      if (t && t.id != null && !m.has(t.id)) m.set(t.id, t.valeur);
    }
    return m;
  }, [features]);

  const visibleFeatures = useMemo(() => {
    if (uncheckedTypes.size === 0) return features;
    return features.filter((f) => !uncheckedTypes.has(f.properties?.type?.id));
  }, [features, uncheckedTypes]);

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

  const onMassifChange = useCallback((id) => {
    if (id) setMode({ type: "massif", id });
  }, []);

  const onZoneClick = useCallback(() => setMode({ type: "zone" }), []);

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
        massifId={mode.type === "massif" ? mode.id : ""}
        onMassifChange={onMassifChange}
        onZoneClick={onZoneClick}
        zoneActive={mode.type === "zone"}
        basemap={basemap}
        onBasemapChange={setBasemap}
        onLocate={locate}
        located={userPos != null}
        status={status}
        allTypes={allTypes}
        uncheckedTypes={uncheckedTypes}
        onToggleType={toggleType}
      />
      <main>
        <MapView features={visibleFeatures} onSelect={selectPoint} onNavigate={onNavigate} focus={focus} basemap={basemap} userPos={userPos} />
        <Sidebar
          tab={tab}
          onTabChange={changeTab}
          count={visibleFeatures.length}
          total={total}
          filterText={filterText}
          onFilterChange={setFilterText}
          features={visibleFeatures}
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
