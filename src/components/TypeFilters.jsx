import { DEFAULT_TYPE_ICONS } from "../types";

const ICONS_BASE = "https://www.refuges.info/images/icones/";

// Filtres par type, avec l'icône refuges.info de chaque type à côté de son intitulé
export default function TypeFilters({ allTypes, typeCounts, uncheckedTypes, onToggle }) {
  if (allTypes.size === 0) return null;
  const counts = typeCounts || new Map();

  return (
    <details id="type-filters-wrap" open>
      <summary>Filtres par type ({allTypes.size})</summary>
      <div id="type-filters" aria-label="Filtrer par type de point">
        {[...allTypes.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([id, label]) => {
            const n = counts.get(id);
            const icon = DEFAULT_TYPE_ICONS[id];
            return (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={!uncheckedTypes.has(id)}
                  onChange={(e) => onToggle(id, e.target.checked)}
                />
                {icon && <img className="type-icon" src={`${ICONS_BASE}${icon}.png`} alt="" />}
                {label}
                {n != null && <span className="type-count">{n}</span>}
              </label>
            );
          })}
      </div>
    </details>
  );
}
