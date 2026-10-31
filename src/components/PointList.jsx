import { pointColor } from "../types";
import { haversineKm } from "../geo";

export default function PointList({ features, filterText, onFilterChange, selectedId, onSelect, userPos }) {
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
          let dist = "";
          if (userPos != null) {
            const d = haversineKm(userPos, [f.geometry.coordinates[1], f.geometry.coordinates[0]]);
            dist = ` · ${d < 10 ? d.toFixed(1) : Math.round(d) + " km"}`;
          }
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
                  {dist}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
