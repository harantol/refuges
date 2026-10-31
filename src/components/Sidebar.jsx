import PointList from "./PointList";
import Fiche from "./Fiche";

export default function Sidebar({
  tab,
  onTabChange,
  count,
  total,
  filterText,
  onFilterChange,
  features,
  selectedId,
  onSelect,
  fiche,
  ficheLoading,
  userPos,
  favorites,
  onToggleFavorite,
  searchInput,
  onSearchChange,
  onClearSearch,
  searching,
}) {
  const listActive = tab === "liste" || tab === "favoris";
  return (
    <aside id="sidebar">
      <div id="sidebar-tabs">
        <button
          id="tab-liste"
          className={tab === "liste" ? "tab active" : "tab"}
          onClick={() => onTabChange("liste")}
        >
          Liste (<span id="count">{count}</span>)
        </button>
        <button
          id="tab-favoris"
          className={tab === "favoris" ? "tab active" : "tab"}
          onClick={() => onTabChange("favoris")}
        >
          ★ Favoris ({favorites.size})
        </button>
        <button
          id="tab-fiche"
          className={tab === "fiche" ? "tab active" : "tab"}
          onClick={() => onTabChange("fiche")}
        >
          Fiche
        </button>
      </div>
      <div id="panel-liste" className={listActive ? "panel active" : "panel"}>
        <div className="search-bar">
          <input
            type="search"
            id="search-nom"
            placeholder="Rechercher un refuge par nom (toute la base)…"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchInput && (
            <button id="btn-clear-search" title="Effacer la recherche" onClick={onClearSearch}>✕</button>
          )}
        </div>
        {searching && <p className="muted small">Recherche en cours…</p>}
        <PointList
          features={features}
          filterText={filterText}
          onFilterChange={onFilterChange}
          selectedId={selectedId}
          onSelect={onSelect}
          userPos={userPos}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
      <div id="panel-fiche" className={tab === "fiche" ? "panel active" : "panel"}>
        <Fiche
          fiche={fiche}
          loading={ficheLoading}
          userPos={userPos}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    </aside>
  );
}
