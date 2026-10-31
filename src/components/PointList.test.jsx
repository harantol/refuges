import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PointList from "./PointList";

const features = [
  {
    id: 1,
    geometry: { coordinates: [6.1, 45.9] },
    properties: {
      nom: "Refuge du Goûter",
      type: { id: 10, valeur: "refuge gardé" },
      places: { valeur: 50 },
      coord: { alt: 3835 },
    },
  },
  {
    id: 2,
    geometry: { coordinates: [6.2, 45.8] },
    properties: {
      nom: "Cabane de Bionnassay",
      type: { id: 7, valeur: "cabane non gardée", icone: "cabane_feu" },
    },
  },
];

const renderList = (props = {}) =>
  render(
    <PointList
      features={features}
      filterText=""
      onFilterChange={() => {}}
      selectedId={null}
      onSelect={() => {}}
      favorites={new Set()}
      onToggleFavorite={() => {}}
      {...props}
    />
  );

describe("PointList", () => {
  it("affiche tous les points avec type et altitude", () => {
    renderList();
    expect(screen.getByText("Refuge du Goûter")).toBeInTheDocument();
    expect(screen.getByText("Cabane de Bionnassay")).toBeInTheDocument();
    expect(screen.getByText(/refuge gardé/)).toBeInTheDocument();
    expect(screen.getByText(/3835 m/)).toBeInTheDocument();
  });

  it("filtre les points selon filterText", () => {
    renderList({ filterText: "goûter" });
    expect(screen.getByText("Refuge du Goûter")).toBeInTheDocument();
    expect(screen.queryByText("Cabane de Bionnassay")).not.toBeInTheDocument();
  });

  it("appelle onSelect avec l'id au clic sur un item", () => {
    const onSelect = vi.fn();
    renderList({ onSelect });
    fireEvent.click(screen.getByText("Refuge du Goûter"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("appelle onToggleFavorite au clic sur l'étoile sans déclencher onSelect", () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    renderList({ onSelect, onToggleFavorite });
    fireEvent.click(screen.getAllByTitle("Ajouter aux favoris")[0]);
    expect(onToggleFavorite).toHaveBeenCalledWith(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("affiche une étoile pleine pour un favori", () => {
    renderList({ favorites: new Set([2]) });
    expect(screen.getByTitle("Retirer des favoris")).toBeInTheDocument();
  });

  it("affiche la distance si userPos est fourni", () => {
    renderList({ userPos: [45.9, 6.1] });
    expect(screen.getByText(/0\.0 km/)).toBeInTheDocument();
  });

  it("icône de partage à droite du champ de filtre quand showShareFavorites", () => {
    const onShareFavorites = vi.fn();
    const { container } = renderList({ showShareFavorites: true, onShareFavorites });
    const row = container.querySelector(".filter-row");
    expect(row).not.toBeNull();
    expect(row.children[0].id).toBe("filter-text");
    const btn = row.querySelector("#btn-share-favoris");
    expect(btn?.textContent).toBe("🔗");
    fireEvent.click(btn);
    expect(onShareFavorites).toHaveBeenCalled();
  });

  it("pas d'icône de partage par défaut", () => {
    const { container } = renderList();
    expect(container.querySelector("#btn-share-favoris")).toBeNull();
  });

  it("affiche l'icône refuges.info (type.icone, sinon défaut par type, sinon pastille)", () => {
    const extra = [
      { id: 3, geometry: { coordinates: [6.3, 45.7] }, properties: { nom: "Sans type" } },
    ];
    const { container } = renderList({ features: [...features, ...extra] });
    const srcs = [...container.querySelectorAll("img.li-icon")].map((i) => i.getAttribute("src"));
    expect(srcs).toContain("https://www.refuges.info/images/icones/cabane_feu.png"); // type.icone (id 2)
    expect(srcs).toContain("https://www.refuges.info/images/icones/cabane_red.png"); // défaut type 10 (id 1)
    expect(container.querySelectorAll(".dot").length).toBe(1); // point sans type (id 3)
  });
});
