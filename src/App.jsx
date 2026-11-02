import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import MapView from "./components/MapView";
import MapControls from "./components/MapControls";
import MapStatus from "./components/MapStatus";
import Sidebar from "./components/Sidebar";
import { TYPE_LABELS } from "./types";
import { fetchZone, fetchMassifPoints, fetchPointsByIds, fetchFiche, fetchMassifs, fetchAllPoints, fetchAllPointsDetail } from "./api";
import { IGN_HAS_KEY } from "./basemaps";
import { auth, favorisCloud } from "./cloud";

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
  // chargement en cours -> spinner sur la carte (jamais de texte dans l'entête, ça le fait grandir)
  const loading = /chargement|en cours|recherche dans/i.test(status);

  // les messages info/erreur (toast sur la carte) s'effacent tout seuls au bout de 5 s
  useEffect(() => {
    if (!status || loading) return;
    const t = setTimeout(() => setStatus(""), 5000);
    return () => clearTimeout(t);
  }, [status, loading]);
  const [massifs, setMassifs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [fiche, setFiche] = useState(null);
  const [ficheLoading, setFicheLoading] = useState(false);
  const [tab, setTab] = useState("liste");
  const [filterText, setFilterText] = useState("");
  const [uncheckedTypes, setUncheckedTypes] = useState(() => new Set());
  const [focus, setFocus] = useState(null);
  const [basemap, setBasemap] = useState("topo"); // OpenTopoMap par défaut
  const [hillshade, setHillshade] = useState(false);
  const [mapMenu, setMapMenu] = useState(null); // "basemap" | "filters" | null (menu flottant mobile)
  const toggleMapMenu = useCallback((m) => setMapMenu((prev) => (prev === m ? null : m)), []);
  const [userPos, setUserPos] = useState(null);
  const [favorites, setFavorites] = useState(loadFavorites);
  const [favOverride, setFavOverride] = useState(null); // ids de favoris venus de l'URL (#favoris=1,2,3)
  const [user, setUser] = useState(null); // compte cloud (Supabase) ou null
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const userRef = useRef(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const [recentDays, setRecentDays] = useState(0);
  const [massifQuery, setMassifQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchCount, setSearchCount] = useState(null);
  const [searching, setSearching] = useState(false);
  const allPointsRef = useRef(null);
  const allDetailRef = useRef(null);
  const searchTokenRef = useRef(0);
  const fetchToken = useRef(0);
  const ficheRequestRef = useRef(null);
  const ficheTokenRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchMassifs({ signal: controller.signal })
      .then((d) =>
        setMassifs(
          (d.features || [])
            .map((f) => ({ id: f.id, nom: f.properties?.nom || f.properties?.name }))
            .filter((m) => m.nom)
            .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
        )
      )
      .catch((e) => {
        if (!controller.signal.aborted) {
          setStatus("Impossible de charger la liste des massifs : " + e.message);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (mode.type === "favoris") return; // géré par l'effet dédié ci-dessous
    const token = ++fetchToken.current;
    const controller = new AbortController();
    let promise;
    if (mode.type === "zone") {
      if (!bbox) return;
      setStatus("Chargement de la zone visible…");
      promise = fetchZone(bbox, recentDays, { signal: controller.signal });
    } else {
      setStatus("Chargement du massif…");
      promise = fetchMassifPoints(mode.id, recentDays, { signal: controller.signal });
    }
    promise
      .then((data) => {
        if (token !== fetchToken.current) return;
        setFeatures(data.features || []);
        setTotal(data.size ?? (data.features || []).length);
        setStatus("");
      })
      .catch((e) => {
        if (token !== fetchToken.current || controller.signal.aborted) return;
        setStatus("Erreur de chargement : " + e.message);
      });
    return () => controller.abort();
  }, [mode, bbox, recentDays]);

  useEffect(() => {
    if (mode.type !== "favoris") return;
    const token = ++fetchToken.current;
    const ids = favOverride ?? [...favorites]; // favOverride = ids venus de l'URL (#favoris=1,2,3)
    if (ids.length === 0) {
      setFeatures([]);
      setTotal(0);
      setStatus("Aucun favori — cliquez sur ☆ dans la liste ou la fiche");
      return;
    }
    const controller = new AbortController();
    setStatus("Chargement des favoris…");
    fetchPointsByIds(ids, { signal: controller.signal })
      .then((data) => {
        if (token !== fetchToken.current) return;
        setFeatures(data.features || []);
        setTotal(data.features?.length ?? 0);
        setStatus("");
      })
      .catch((e) => {
        if (token === fetchToken.current && !controller.signal.aborted) {
          setStatus("Erreur de chargement des favoris : " + e.message);
        }
      });
    return () => controller.abort();
  }, [mode, favorites, favOverride]);

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
      cached = sessionStorage.getItem("refuges-all-v2");
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
      sessionStorage.setItem("refuges-all-v2", JSON.stringify(allPointsRef.current));
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

  // Filtre équipements (info_comp, tri-état Oui/Non/Inconnu).
  // Les valeurs peuvent contenir du HTML (<b>Inconnu</b>) ou du bbcode ([b]Inconnu[/b]).
  const matchEquip = (feature, equipEntries) => {
    const ic = feature.properties?.info_comp || {};
    return equipEntries.every(([key, val]) => {
      const v = String(ic[key]?.valeur ?? "")
        .replace(/<[^>]+>/g, "")
        .replace(/\[[^\]]+\]/g, "")
        .trim()
        .toLowerCase();
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
      const token = ++searchTokenRef.current;
      setSearching(true);
      setStatus("Recherche dans toute la base…");
      try {
        const all = await loadAllPoints();
        if (token !== searchTokenRef.current) return;
        const equipEntries = Object.entries(params.equip || {}).filter(
          ([, v]) => v === "oui" || v === "non"
        );
        const keyFilterActive = params.requiresKey != null;
        let res = applyBaseFilters(all, params);

        if (equipEntries.length > 0 || keyFilterActive) {
          // info_comp et etat.id n'existent qu'en detail=complet. On charge la base
          // complète détaillée (~20 Mo, une seule fois en mémoire) pour filtrer sans perte.
          setStatus("Chargement de la base détaillée (~20 Mo, une fois pour toutes)…");
          const allDetail = await loadAllDetail();
          if (token !== searchTokenRef.current) return;
          res = applyBaseFilters(allDetail, params).filter((f) => {
            const requiresKey = f.properties?.etat?.id === "cle_a_recuperer";
            return (
              (!keyFilterActive || requiresKey === params.requiresKey) &&
              matchEquip(f, equipEntries)
            );
          });
        }

        if (token !== searchTokenRef.current) return;
        res = res.slice(0, 500);
        setSearchResults(res);
        setSearchCount(res.length);
        setStatus(`${res.length} résultat(s)`);
        setTab("liste"); // afficher les résultats dans la liste
      } catch (e) {
        if (token === searchTokenRef.current) setStatus("Erreur de recherche : " + e.message);
      } finally {
        if (token === searchTokenRef.current) setSearching(false);
      }
    },
    [loadAllPoints, loadAllDetail]
  );

  const clearSearch = useCallback(() => {
    searchTokenRef.current += 1;
    setSearching(false);
    setSearchResults(null);
    setSearchCount(null);
    setStatus("");
  }, []);

  // En mode favoris, on n'affiche jamais les résultats de recherche (bug : ils polluaient la liste)
  // Interrupteur "zone" : si activé, on ne garde que les points dans la bbox visible
  const [zoneOnly, setZoneOnly] = useState(false);
  const displayedFeatures = useMemo(() => {
    let list = mode.type === "favoris" || !searchResults ? visibleFeatures : searchResults;
    if (zoneOnly && bbox) {
      const [w, s, e, n] = bbox.split(",").map(Number);
      list = list.filter((f) => {
        const [lng, lat] = f.geometry.coordinates;
        return lng >= w && lng <= e && lat >= s && lat <= n;
      });
    }
    return list;
  }, [mode.type, searchResults, visibleFeatures, zoneOnly, bbox]);

  // Panneau du bas replié par défaut sur mobile, déplié au clic sur un onglet
  const [panelOpen, setPanelOpen] = useState(false);

  // Ref des features affichées (pour récupérer type.id/icone des fiches detail=fiche)
  const displayedRef = useRef([]);
  useEffect(() => {
    displayedRef.current = displayedFeatures;
    window.__features = displayedFeatures; // debug/tests
  }, [displayedFeatures]);

  const toggleType = useCallback((id, checked) => {
    setUncheckedTypes((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectPoint = useCallback((id) => {
    ficheRequestRef.current?.abort();
    const controller = new AbortController();
    ficheRequestRef.current = controller;
    const token = ++ficheTokenRef.current;
    setSelectedId(id);
    setTab("fiche");
    setPanelOpen(true); // sur mobile, déplier le panneau pour voir la fiche
    setFiche(null);
    setFicheLoading(true);
    try {
      history.replaceState(null, "", "#point=" + id); // l'URL reflète la fiche ouverte (partageable)
    } catch {
      /* history indisponible */
    }
    fetchFiche(id, { signal: controller.signal })
      .then((data) => {
        if (token !== ficheTokenRef.current) return;
        const f = data.features?.[0] || null;
        // En detail=fiche, type perd son id/icone : on les récupère de la feature d'origine
        if (f && !f.properties?.type?.id) {
          const orig = displayedRef.current.find((x) => x.id === id);
          if (orig?.properties?.type) {
            f.properties.type = {
              ...f.properties.type,
              id: orig.properties.type.id,
              icone: orig.properties.type.icone,
            };
          }
        }
        setFiche(f);
        const c = f?.geometry?.coordinates;
        if (c) setFocus([c[1], c[0]]);
      })
      .catch((e) => {
        if (token === ficheTokenRef.current && !controller.signal.aborted) {
          setFiche({ error: e.message });
        }
      })
      .finally(() => {
        if (token === ficheTokenRef.current) setFicheLoading(false);
      });
  }, []);

  useEffect(() => () => ficheRequestRef.current?.abort(), []);

  const closeMenus = useCallback(() => {
    setMapMenu(null);
    setPanelOpen(false);
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

  const changeBasemap = useCallback((b) => {
    setBasemap(b);
    if (b === "ign") {
      setStatus("IGN Top 25 : clé partagée ign_scan_ws utilisée par défaut — collez votre clé perso ci-dessus pour un quota dédié.");
    }
  }, []);

  // Enregistre la clé IGN dans localStorage puis recharge (basemaps.js la relit au chargement)
  const saveIgnKey = useCallback((key) => {
    try {
      localStorage.setItem("ign-api-key", key);
    } catch {
      /* stockage indisponible */
    }
    setStatus("Clé IGN enregistrée, rechargement…");
    try {
      location.reload();
    } catch {
      /* jsdom */
    }
  }, []);

  const onNavigate = useCallback((b) => setBbox(b), []);

  const toggleFavorite = useCallback(
    (id) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        const willFav = !next.has(id);
        if (willFav) next.add(id);
        else next.delete(id);
        try {
          localStorage.setItem(FAVORIS_KEY, JSON.stringify([...next]));
        } catch {
          /* stockage indisponible */
        }
        // synchro cloud si connecté (erreur rendue visible dans le statut)
        if (userRef.current) {
          const u = userRef.current;
          const op = willFav ? favorisCloud.add(u.id, id) : favorisCloud.remove(u.id, id);
          op.catch((e) => setStatus(`Erreur synchro cloud : ${e.message}`));
        }
        return next;
      });
    },
    []
  );

  // Synchro cloud des favoris : merge local + cloud, pousse les locaux manquants
  const syncFavoris = useCallback(async (u) => {
    const ids = await favorisCloud.list(u.id);
    const local = loadFavorites();
    const merged = new Set([...local, ...ids]);
    const missing = [...local].filter((id) => !ids.includes(id));
    await Promise.all(
      missing.map((id) =>
        favorisCloud.add(u.id, id).catch((e) => {
          throw new Error(`ajout favori ${id}: ${e.message}`);
        })
      )
    );
    setFavorites(merged);
    try {
      localStorage.setItem(FAVORIS_KEY, JSON.stringify([...merged]));
    } catch {
      /* stockage indisponible */
    }
    return merged.size;
  }, []);

  // Restauration de la session au chargement
  useEffect(() => {
    (async () => {
      let u;
      try {
        u = await auth.me();
      } catch (e) {
        setStatus("Impossible de restaurer la session : " + e.message);
        return;
      }
      if (!u) return;
      setUser(u);
      try {
        const n = await syncFavoris(u);
        setStatus(`Connecté : ${u.email} — ${n} favori(s) synchronisé(s)`);
      } catch (e) {
        setStatus("Connecté, synchro des favoris échouée : " + e.message);
      }
    })();
  }, [syncFavoris]);

  const handleLogin = useCallback(
    async (email, password) => {
      setAuthBusy(true);
      setAuthError("");
      try {
        const u = await auth.login(email, password);
        setUser(u);
        const n = await syncFavoris(u);
        setStatus(`Connecté : ${u.email} — ${n} favori(s) synchronisé(s)`);
        setAccountOpen(false);
      } catch (e) {
        setAuthError(e.message);
        throw e;
      } finally {
        setAuthBusy(false);
      }
    },
    [syncFavoris]
  );

  const handleSignup = useCallback(
    async (email, password) => {
      setAuthBusy(true);
      setAuthError("");
      try {
        await auth.signup(email, password);
        try {
          await handleLogin(email, password); // connexion directe si l'email n'a pas à être confirmé
        } catch (e) {
          // Supabase avec "Confirm email" activé : compte créé mais login refusé tant que non confirmé
          if (/confirm/i.test(e.message)) {
            setStatus("Compte créé ✓ — confirmez votre adresse email (lien reçu par mail), puis connectez-vous.");
            setAccountOpen(false);
            return;
          }
          throw e;
        }
      } catch (e) {
        setAuthError(e.message);
        throw e;
      } finally {
        setAuthBusy(false);
      }
    },
    [handleLogin]
  );

  const handleLogout = useCallback(async () => {
    await auth.logout();
    setUser(null);
    setStatus("Déconnecté — les favoris restent en local");
  }, []);

  const changeTab = useCallback(
    (t) => {
      if (t === "favoris") {
        setMode({ type: "favoris" });
        // quitter une recherche active en allant aux favoris
        searchTokenRef.current += 1;
        setSearching(false);
        setSearchResults(null);
        setSearchCount(null);
      } else if (tab === "favoris" && t === "liste") {
        setMode({ type: "zone" });
      }
      // clic sur un onglet -> déplie le panneau ; reclic sur l'onglet actif -> replie
      if (t === tab) setPanelOpen((o) => !o);
      else setPanelOpen(true);
      setTab(t);
    },
    [tab]
  );

  // Lecture du hash au démarrage : #point=<id> | #favoris | #favoris=1,2,3
  useEffect(() => {
    const h = window.location.hash.replace(/^#/, "");
    if (!h) return;
    if (h.startsWith("point=")) {
      const id = Number(h.slice(6));
      if (Number.isFinite(id) && id > 0) selectPoint(id);
    } else if (h === "favoris") {
      changeTab("favoris");
    } else if (h.startsWith("favoris=")) {
      const ids = h
        .slice(8)
        .split(",")
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length > 0) {
        setFavOverride(ids); // affichés sans toucher au localStorage du destinataire
        setMode({ type: "favoris" });
        setTab("favoris");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyText = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Lien copié dans le presse-papiers ✓");
    } catch {
      setStatus("Lien : " + text);
    }
  }, []);

  const sharePoint = useCallback(
    (id) => {
      copyText(`${window.location.origin}${window.location.pathname}#point=${id}`);
    },
    [copyText]
  );

  const shareFavorites = useCallback(() => {
    const ids = [...favorites];
    copyText(
      `${window.location.origin}${window.location.pathname}#favoris${ids.length ? "=" + ids.join(",") : ""}`
    );
  }, [favorites, copyText]);

  return (
    <>
      {accountOpen && <div className="backdrop" onClick={() => setAccountOpen(false)} />}
      <Header
        massifs={massifs}
        massifQuery={massifQuery}
        onMassifQueryChange={onMassifQueryChange}
        onZoneClick={onZoneClick}
        zoneActive={mode.type === "zone"}
        user={user}
        accountOpen={accountOpen}
        onAccountToggle={() => setAccountOpen((v) => !v)}
        authBusy={authBusy}
        authError={authError}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onLogout={handleLogout}
      />
      <main>
        <div id="map-area">
          <MapView features={displayedFeatures} onSelect={selectPoint} onNavigate={onNavigate} onCloseMenus={closeMenus} focus={focus} basemap={basemap} userPos={userPos} hillshade={hillshade} fitToFeatures={mode.type === "massif"} />
          <MapStatus loading={loading} status={status} />
          <MapControls
            basemap={basemap}
            onBasemapChange={changeBasemap}
            hillshade={hillshade}
            onHillshadeChange={setHillshade}
            zoneOnly={zoneOnly}
            onZoneOnlyToggle={() => setZoneOnly((v) => !v)}
            onLocate={locate}
            located={userPos != null}
            menu={mapMenu}
            onMenuToggle={toggleMapMenu}
            allTypes={allTypes}
            typeCounts={typeCounts}
            uncheckedTypes={uncheckedTypes}
            onToggleType={toggleType}
            recentDays={recentDays}
            onRecentChange={setRecentDays}
            onIgnKeySave={saveIgnKey}
          />
        </div>
        <Sidebar
          tab={tab}
          onTabChange={changeTab}
          panelOpen={panelOpen}
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
          onSharePoint={sharePoint}
          onShareFavorites={shareFavorites}
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
