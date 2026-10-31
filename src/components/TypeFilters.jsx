export default function TypeFilters({ allTypes, uncheckedTypes, onToggle }) {
  if (allTypes.size === 0) return null;
  return (
    <div id="type-filters" aria-label="Filtrer par type de point">
      {[...allTypes.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([id, label]) => (
          <label key={id}>
            <input
              type="checkbox"
              checked={!uncheckedTypes.has(id)}
              onChange={(e) => onToggle(id, e.target.checked)}
            />
            {label}
          </label>
        ))}
    </div>
  );
}
