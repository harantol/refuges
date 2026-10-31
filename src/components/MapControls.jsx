import TypeFilters from "./TypeFilters";
import IgnKeyForm from "./IgnKeyForm";
import { BASEMAPS } from "../basemaps";

// Boutons flottants sur la carte (visibles uniquement sur mobile, cf. CSS) :
// style "Google Maps" — la barre d'outils n'encombre plus l'entête.
export default function MapControls({
  basemap,
  onBasemapChange,
  hillshade,
  onHillshadeChange,
  zoneOnly,
  onZoneOnlyToggle,
  onLocate,
  located,
  menu,
  onMenuToggle,
  allTypes,
  typeCounts,
  uncheckedTypes,
  onToggleType,
  recentDays,
  onRecentChange,
  onIgnKeySave,
}) {
  return (
    <div id="map-controls">
      <button
        className={menu === "basemap" ? "active" : ""}
        title="Fond de carte"
        aria-label="Fond de carte"
        onClick={() => onMenuToggle("basemap")}
      >
        🗺️
      </button>
      <button
        className={zoneOnly ? "active" : ""}
        title="Interrupteur : limiter l'affichage à la zone visible sur la carte"
        aria-label="Limiter à la zone visible"
        aria-pressed={zoneOnly}
        onClick={onZoneOnlyToggle}
      >
        🔍
      </button>
      <button
        className={located ? "active" : ""}
        title="Autour de moi (ma position)"
        aria-label="Autour de moi"
        onClick={onLocate}
      >
        🎯
      </button>
      <button
        className={menu === "filters" ? "active" : ""}
        title="Filtres (types, date)"
        aria-label="Filtres"
        onClick={() => onMenuToggle("filters")}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
             strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 5h18l-7 8v5.5l-4 2V13L3 5z" />
        </svg>
      </button>


      {menu === "basemap" && (
        <div className="map-menu" role="dialog" aria-label="Choix du fond de carte">
          <p className="map-menu-title">Fond de carte</p>
          {Object.entries(BASEMAPS).map(([key, b]) => (
            <label key={key}>
              <input
                type="radio"
                name="basemap"
                checked={basemap === key}
                onChange={() => onBasemapChange(key)}
              />
              {b.label}
            </label>
          ))}
          <label className="map-menu-pentes">
            <input
              type="checkbox"
              checked={hillshade}
              onChange={(e) => onHillshadeChange(e.target.checked)}
            />
            ⛰️ Pentes (IGN)
          </label>
          {basemap === "ign" && <IgnKeyForm onIgnKeySave={onIgnKeySave} />}
        </div>
      )}

      {menu === "filters" && (
        <div className="map-menu" role="dialog" aria-label="Filtres">
          <p className="map-menu-title">Filtres</p>
          <TypeFilters
            allTypes={allTypes}
            typeCounts={typeCounts}
            uncheckedTypes={uncheckedTypes}
            onToggle={onToggleType}
          />
          <label className="map-menu-recent">
            Modifié depuis
            <select value={recentDays} onChange={(e) => onRecentChange(Number(e.target.value))}>
              <option value={0}>Toutes les dates</option>
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
              <option value={365}>1 an</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
