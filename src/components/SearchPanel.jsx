import { useState } from "react";
import { TYPE_LABELS } from "../types";

const ALL_TYPE_IDS = Object.keys(TYPE_LABELS).map(Number);

const toNum = (v) => {
  const n = Number(v);
  return v !== "" && Number.isFinite(n) ? n : null;
};

export default function SearchPanel({ onSearch, onReset, searching, resultCount }) {
  const [q, setQ] = useState("");
  const [altMin, setAltMin] = useState("");
  const [altMax, setAltMax] = useState("");
  const [placesMin, setPlacesMin] = useState("");
  const [etat, setEtat] = useState("");
  const [types, setTypes] = useState(() => new Set(ALL_TYPE_IDS));

  const buildParams = () => ({
    q: q.trim(),
    altMin: toNum(altMin),
    altMax: toNum(altMax),
    placesMin: toNum(placesMin),
    etat,
    // null = tous les types cochés (pas de filtre)
    types: types.size === ALL_TYPE_IDS.length ? null : types,
  });

  const submit = (e) => {
    e.preventDefault();
    onSearch(buildParams());
  };

  const toggleType = (id) => {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setQ("");
    setAltMin("");
    setAltMax("");
    setPlacesMin("");
    setEtat("");
    setTypes(new Set(ALL_TYPE_IDS));
    onReset();
  };

  return (
    <form id="search-panel" onSubmit={submit}>
      <input
        type="search"
        id="search-q"
        placeholder="Nom du refuge, cabane, point d'eau…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <fieldset>
        <legend>Type de point</legend>
        <div className="type-checks">
          {ALL_TYPE_IDS.map((id) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={types.has(id)}
                onChange={() => toggleType(id)}
              />
              {TYPE_LABELS[id]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="range-row">
        <label>
          Altitude min (m)
          <input
            type="number"
            min="0"
            max="9000"
            inputMode="numeric"
            value={altMin}
            onChange={(e) => setAltMin(e.target.value)}
          />
        </label>
        <label>
          Altitude max (m)
          <input
            type="number"
            min="0"
            max="9000"
            inputMode="numeric"
            value={altMax}
            onChange={(e) => setAltMax(e.target.value)}
          />
        </label>
      </div>

      <label className="full">
        Places minimum
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={placesMin}
          onChange={(e) => setPlacesMin(e.target.value)}
        />
      </label>

      <label className="full">
        État
        <select value={etat} onChange={(e) => setEtat(e.target.value)}>
          <option value="">Tous</option>
          <option value="ouvert">Ouvert</option>
          <option value="fermé">Fermé</option>
        </select>
      </label>

      <div className="search-actions">
        <button type="submit" className="primary" disabled={searching}>
          {searching ? "Recherche…" : "🔎 Rechercher"}
        </button>
        <button type="button" onClick={reset} disabled={searching}>
          ✕ Réinitialiser
        </button>
      </div>

      {resultCount != null && (
        <p className="muted small">{resultCount} résultat(s) — affichés sur la carte et dans la liste</p>
      )}
    </form>
  );
}
