import PointList from "./PointList";
import Fiche from "./Fiche";
import SearchPanel from "./SearchPanel";

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
  onSearch,
  onClearSearch,
  searching,
  searchCount,
  searchActive,
  onSharePoint,
  onShareFavorites,
}) {
  const listActive = tab === "liste" || tab === "favoris";
  return (
    <aside id="sidebar" className={tab === "fiche" ? "fiche-open" : ""}>
      <div id="sidebar-tabs">
        <button
          id="tab-liste"
          className={tab === "liste" ? "tab active" : "tab"}
          onClick={() => onTabChange("liste")}
        >
          Liste (<span id="count">{count}</span>)
        </button>
        <button
          id="tab-recherche"
          className={tab === "recherche" ? "tab active" : "tab"}
          onClick={() => onTabChange("recherche")}
        >
          🔎 Recherche
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
        {searchActive && (
          <div className="search-banner">
            <span>Résultats de recherche ({searchCount})</span>
            <button id="btn-clear-search" title="Effacer la recherche" onClick={onClearSearch}>
              ✕
            </button>
          </div>
        )}
        {tab === "favoris" && (
          <button id="btn-share-favoris" className="share-btn" onClick={onShareFavorites}>
            🔗 Copier le lien de la liste ({favorites.size})
          </button>
        )}
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
      <div id="panel-recherche" className={tab === "recherche" ? "panel active" : "panel"}>
        <SearchPanel
          onSearch={onSearch}
          onReset={onClearSearch}
          searching={searching}
          resultCount={searchActive ? searchCount : null}
        />
      </div>
      <div id="panel-fiche" className={tab === "fiche" ? "panel active" : "panel"}>
        <Fiche
          fiche={fiche}
          loading={ficheLoading}
          userPos={userPos}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onShare={onSharePoint}
        />
      </div>
    </aside>
  );
}
