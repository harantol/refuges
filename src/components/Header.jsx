import TypeFilters from "./TypeFilters";

export default function Header({
  massifs,
  massifId,
  onMassifChange,
  onZoneClick,
  zoneActive,
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
        <span id="status">{status}</span>
      </div>
      <TypeFilters allTypes={allTypes} uncheckedTypes={uncheckedTypes} onToggle={onToggleType} />
    </header>
  );
}
