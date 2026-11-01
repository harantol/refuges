import { TYPE_LABELS, DEFAULT_TYPE_ICONS } from "../types";

const ICONS_BASE = "https://www.refuges.info/images/icones/";

// Légende des icônes de types de points, en petit dans l'entête
export default function TypeLegend() {
  return (
    <div id="type-legend" aria-label="Légende des icônes">
      {Object.entries(TYPE_LABELS).map(([id, label]) => (
        <span key={id} className="legend-item" title={label}>
          <img src={`${ICONS_BASE}${DEFAULT_TYPE_ICONS[id]}.png`} alt="" />
          {label}
        </span>
      ))}
    </div>
  );
}
