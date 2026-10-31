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
}) {
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
          id="tab-fiche"
          className={tab === "fiche" ? "tab active" : "tab"}
          onClick={() => onTabChange("fiche")}
        >
          Fiche
        </button>
      </div>
      <div id="panel-liste" className={tab === "liste" ? "panel active" : "panel"}>
        <PointList
          features={features}
          filterText={filterText}
          onFilterChange={onFilterChange}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>
      <div id="panel-fiche" className={tab === "fiche" ? "panel active" : "panel"}>
        <Fiche fiche={fiche} loading={ficheLoading} />
      </div>
    </aside>
  );
}
