import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";

const makeProps = (overrides = {}) => ({
  tab: "liste",
  onTabChange: vi.fn(),
  count: 5,
  total: 10,
  filterText: "",
  onFilterChange: vi.fn(),
  features: [],
  selectedId: null,
  onSelect: vi.fn(),
  fiche: null,
  ficheLoading: false,
  userPos: null,
  favorites: new Set(),
  onToggleFavorite: vi.fn(),
  onSearch: vi.fn(),
  onClearSearch: vi.fn(),
  searching: false,
  searchCount: 3,
  searchActive: false,
  onSharePoint: vi.fn(),
  onShareFavorites: vi.fn(),
  ...overrides,
});

describe("Sidebar", () => {
  it("affiche les 4 onglets et appelle onTabChange au clic", () => {
    const props = makeProps();
    render(<Sidebar {...props} />);
    expect(screen.getByRole("button", { name: /Liste/ }).textContent).toContain("5");
    expect(document.getElementById("tab-recherche")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Favoris/ }).textContent).toContain("0");
    expect(screen.getByRole("button", { name: "Fiche" })).toBeInTheDocument();
    fireEvent.click(document.getElementById("tab-recherche"));
    expect(props.onTabChange).toHaveBeenCalledWith("recherche");
    fireEvent.click(screen.getByRole("button", { name: /Favoris/ }));
    expect(props.onTabChange).toHaveBeenCalledWith("favoris");
  });

  it("affiche le banner de recherche avec bouton ✕ quand searchActive", () => {
    const props = makeProps({ searchActive: true, searchCount: 3 });
    render(<Sidebar {...props} />);
    expect(screen.getByText(/Résultats de recherche \(3\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Effacer la recherche"));
    expect(props.onClearSearch).toHaveBeenCalled();
  });

  it("pas de banner quand aucune recherche active", () => {
    render(<Sidebar {...makeProps({ searchActive: false })} />);
    expect(screen.queryByTitle("Effacer la recherche")).toBeNull();
  });

  it("l'onglet actif a la classe active", () => {
    render(<Sidebar {...makeProps({ tab: "fiche" })} />);
    expect(screen.getByText("Fiche")).toHaveClass("active");
    expect(screen.getByText(/Liste/).closest("button")).not.toHaveClass("active");
  });

  it("bouton 'copier le lien de la liste' visible uniquement en onglet favoris", () => {
    const props = makeProps({ tab: "favoris", favorites: new Set([1, 2]) });
    render(<Sidebar {...props} />);
    const btn = screen.getByText(/Copier le lien de la liste \(2\)/);
    fireEvent.click(btn);
    expect(props.onShareFavorites).toHaveBeenCalled();
  });

  it("pas de bouton partage favoris hors de l'onglet favoris", () => {
    render(<Sidebar {...makeProps({ tab: "liste" })} />);
    expect(screen.queryByText(/Copier le lien de la liste/)).toBeNull();
  });

  it("le panneau recherche contient le formulaire", () => {
    render(<Sidebar {...makeProps({ tab: "recherche" })} />);
    expect(screen.getByPlaceholderText(/Nom du refuge/i)).toBeInTheDocument();
  });
});
