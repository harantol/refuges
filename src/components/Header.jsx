import TypeFilters from "./TypeFilters";
import { BASEMAPS } from "../basemaps";

export default function Header({
  massifs,
  massifId,
  onMassifChange,
  onZoneClick,
  zoneActive,
  basemap,
  onBasemapChange,
  onLocate,
  located,
  recentDays,
  onRecentChange,
  status,
  allTypes,
  uncheckedTypes,
  onToggleType,
}) {
  return (
    <header id="topbar">
      <h1>⛺ Explorateur Refuges.info</h1>
      <div className="controls">
        <select
          id="massif-select"
          value={massifId}
          onChange={(e) => onMassifChange(e.target.value)}
          title="Rechercher par massif"
        >
          <option value="">-- Rechercher par massif --</option>
          {massifs.map((m) => (
            <option key={m.id} value={m.id}>{m.nom}</option>
          ))}
        </select>
        <button id="btn-zone" className={zoneActive ? "active" : ""} onClick={onZoneClick} title="Revenir à la zone visible sur la carte">
          Zone visible
        </button>
        <select
          id="basemap-select"
          value={basemap}
          onChange={(e) => onBasemapChange(e.target.value)}
          title="Fond de carte"
        >
          {Object.entries(BASEMAPS).map(([key, b]) => (
            <option key={key} value={key}>{b.label}</option>
          ))}
        </select>
        <button
          id="btn-locate"
          className={located ? "active" : ""}
          onClick={onLocate}
          title="Centrer la carte sur ma position et charger les refuges proches"
        >
          📍 Autour de moi
        </button>
        <select
          id="recent-select"
          value={recentDays}
          onChange={(e) => onRecentChange(Number(e.target.value))}
          title="Ne garder que les points modifiés récemment (paramètre depuis de l'API)"
        >
          <option value={0}>Toutes les dates</option>
          <option value={7}>Modifié depuis 7 j</option>
          <option value={30}>Modifié depuis 30 j</option>
          <option value={90}>Modifié depuis 90 j</option>
          <option value={365}>Modifié depuis 1 an</option>
        </select>
        <span id="status">{status}</span>
      </div>
      <TypeFilters allTypes={allTypes} uncheckedTypes={uncheckedTypes} onToggle={onToggleType} />
    </header>
  );
}
