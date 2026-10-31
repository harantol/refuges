import { pointColor } from "../types";

export default function PointList({ features, filterText, onFilterChange, selectedId, onSelect }) {
  const q = filterText.trim().toLowerCase();
  const items = features.filter((f) => !q || (f.properties?.nom || "").toLowerCase().includes(q));

  return (
    <>
      <input
        type="search"
        id="filter-text"
        placeholder="Filtrer par nom..."
        value={filterText}
        onChange={(e) => onFilterChange(e.target.value)}
      />
      <ul id="point-list">
        {items.map((f) => {
          const p = f.properties || {};
          const places = p.places?.valeur != null ? ` · ${p.places.valeur} pl.` : "";
          const etat = p.etat?.valeur ? ` · ${p.etat.valeur}` : "";
          const alt = p.coord?.alt ? ` · ${p.coord.alt} m` : "";
          return (
            <li
              key={f.id}
              data-id={f.id}
              className={f.id === selectedId ? "selected" : ""}
              onClick={() => onSelect(f.id)}
            >
              <span className="dot" style={{ background: pointColor(f) }}></span>
              <span>
                <span className="name">{p.nom || "(sans nom)"}</span>
                <br />
                <span className="meta">
                  {p.type?.valeur || ""}
                  {places}
                  {etat}
                  {alt}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
