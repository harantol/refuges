import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header";

const makeProps = (overrides = {}) => ({
  massifs: [{ id: 351, nom: "Vanoise" }],
  massifQuery: "",
  onMassifQueryChange: vi.fn(),
  onZoneClick: vi.fn(),
  zoneActive: true,
  onLocate: vi.fn(),
  located: false,
  recentDays: 0,
  onRecentChange: vi.fn(),
  status: "Prêt",
  allTypes: new Map([[10, "refuge gardé"]]),
  typeCounts: new Map([[10, 2]]),
  uncheckedTypes: new Set(),
  onToggleType: vi.fn(),
  ...overrides,
});

describe("Header", () => {
  it("rend tous les contrôles et affiche le statut", () => {
    render(<Header {...makeProps()} />);
    expect(screen.getByPlaceholderText(/massif/i)).toBeInTheDocument();
    expect(screen.getByText("Zone visible")).toBeInTheDocument();
    expect(screen.getByText(/Autour de moi/)).toBeInTheDocument();
    expect(screen.getByTitle(/modifiés récemment/i)).toBeInTheDocument();
    expect(screen.getByText("Prêt")).toBeInTheDocument();
    expect(document.querySelector('#massifs-list option[value="Vanoise"]')).not.toBeNull(); // datalist
  });

  it("appelle les callbacks au changement", () => {
    const props = makeProps();
    render(<Header {...props} />);
    fireEvent.change(screen.getByPlaceholderText(/massif/i), { target: { value: "Van" } });
    expect(props.onMassifQueryChange).toHaveBeenCalledWith("Van");
    fireEvent.click(screen.getByText("Zone visible"));
    expect(props.onZoneClick).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/Autour de moi/));
    expect(props.onLocate).toHaveBeenCalled();
    fireEvent.change(screen.getByTitle(/modifiés récemment/i), { target: { value: "30" } });
    expect(props.onRecentChange).toHaveBeenCalledWith(30);
  });

  it("le bouton zone a la classe active quand zoneActive", () => {
    render(<Header {...makeProps({ zoneActive: true })} />);
    expect(screen.getByText("Zone visible")).toHaveClass("active");
  });

  it("le bouton locate a la classe active quand located", () => {
    render(<Header {...makeProps({ located: true })} />);
    expect(screen.getByText(/Autour de moi/)).toHaveClass("active");
  });

  it("l'icône compte 👤 est à droite du champ de recherche de massif", () => {
    const props = makeProps({ accountOpen: true, onAccountToggle: vi.fn() });
    const { container } = render(<Header {...props} />);
    const row = container.querySelector(".massif-row");
    expect(row).not.toBeNull();
    expect(row.children[0].id).toBe("massif-search"); // le champ
    expect(row.children[1].querySelector("#btn-account")).not.toBeNull(); // l'icône à droite
    // le panneau compte s'ouvre (accountOpen=true)
    expect(container.querySelector(".account-dropdown")).not.toBeNull();
    // au clic sur 👤, onAccountToggle est appelé
    fireEvent.click(screen.getByLabelText("Compte"));
    expect(props.onAccountToggle).toHaveBeenCalled();
    // l'icône est un SVG outline (pas l'emoji plein)
    expect(screen.getByLabelText("Compte").querySelector("svg")).not.toBeNull();
  });

  it("affiche la légende des icônes de types dans l'entête (7 icônes refuges.info)", () => {
    const { container } = render(<Header {...makeProps()} />);
    const legend = container.querySelector("#type-legend");
    expect(legend).not.toBeNull();
    const imgs = legend.querySelectorAll("img");
    expect(imgs.length).toBe(7);
    expect(imgs[0].getAttribute("src")).toContain("https://www.refuges.info/images/icones/");
    expect(legend.textContent).toContain("refuge gardé");
  });

  it("affiche les filtres de type avec compteur", () => {
    const { container } = render(<Header {...makeProps()} />);
    const filters = container.querySelector("#type-filters");
    expect(filters.textContent).toContain("refuge gardé");
    expect(filters.textContent).toContain("2");
  });
});
