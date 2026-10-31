import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";
import { fetchZone, fetchMassifPoints, fetchFiche, fetchMassifs } from "./api";

export default function App() {
  const [mode, setMode] = useState({ type: "zone" }); // {type:'zone'} | {type:'massif', id:string}
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

  const onMassifChange = useCallback((id) => {
    if (id) setMode({ type: "massif", id });
  }, []);

  const onZoneClick = useCallback(() => setMode({ type: "zone" }), []);

  const onNavigate = useCallback((b) => setBbox(b), []);

  return (
    <>
      <Header
        massifs={massifs}
        massifId={mode.type === "massif" ? mode.id : ""}
        onMassifChange={onMassifChange}
        onZoneClick={onZoneClick}
        zoneActive={mode.type === "zone"}
        status={status}
        allTypes={allTypes}
        uncheckedTypes={uncheckedTypes}
        onToggleType={toggleType}
      />
      <main>
        <MapView features={visibleFeatures} onSelect={selectPoint} onNavigate={onNavigate} focus={focus} />
        <Sidebar
          tab={tab}
          onTabChange={setTab}
          count={visibleFeatures.length}
          total={total}
          filterText={filterText}
          onFilterChange={setFilterText}
          features={visibleFeatures}
          selectedId={selectedId}
          onSelect={selectPoint}
          fiche={fiche}
          ficheLoading={ficheLoading}
        />
      </main>
      <footer id="credits">
        Données <a href="https://www.refuges.info" target="_blank" rel="noopener">refuges.info</a> (CC BY-SA 2.0) &middot; Carte &copy;{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> (ODbL)
      </footer>
    </>
  );
}
