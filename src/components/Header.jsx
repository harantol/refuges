import TypeFilters from "./TypeFilters";
import IgnKeyForm from "./IgnKeyForm";
import { BASEMAPS } from "../basemaps";

export default function Header({
  massifs,
  massifQuery,
  onMassifQueryChange,
  onZoneClick,
  zoneActive,
  basemap,
  onBasemapChange,
  hillshade,
  onHillshadeChange,
  onLocate,
  located,
  recentDays,
  onRecentChange,
  status,
  allTypes,
  typeCounts,
  uncheckedTypes,
  onToggleType,
  onIgnKeySave,
}) {
  return (
    <header id="topbar">
      <h1>⛺ Explorateur Refuges.info</h1>
      <div className="controls">
        <input
          id="massif-search"
          type="search"
          list="massifs-list"
          placeholder="Rechercher un massif…"
          value={massifQuery}
          onChange={(e) => onMassifQueryChange(e.target.value)}
          title="Rechercher par massif (autocomplétion)"
        />
        <datalist id="massifs-list">
          {massifs.map((m) => (
            <option key={m.id} value={m.nom} />
          ))}
        </datalist>
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
        <label
          id="hillshade-toggle"
          title="Afficher les pentes IGN montagne (couche officielle, sans clé) par-dessus la carte"
        >
          <input
            type="checkbox"
            checked={hillshade}
            onChange={(e) => onHillshadeChange(e.target.checked)}
          />
          Pentes
        </label>
        {basemap === "ign" && <IgnKeyForm onIgnKeySave={onIgnKeySave} />}
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
      <TypeFilters allTypes={allTypes} typeCounts={typeCounts} uncheckedTypes={uncheckedTypes} onToggle={onToggleType} />
    </header>
  );
}
