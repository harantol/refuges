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
            return (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={!uncheckedTypes.has(id)}
                  onChange={(e) => onToggle(id, e.target.checked)}
                />
                {label}
                {n != null && <span className="type-count">{n}</span>}
              </label>
            );
          })}
      </div>
    </details>
  );
}
