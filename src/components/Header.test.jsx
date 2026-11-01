import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header";

const makeProps = (overrides = {}) => ({
  massifs: [{ id: 351, nom: "Vanoise" }],
  massifQuery: "",
  onMassifQueryChange: vi.fn(),
  onZoneClick: vi.fn(),
  zoneActive: true,
  ...overrides,
});

describe("Header", () => {
  it("rend tous les contrôles, sans aucun texte de statut (hauteur d'entête fixe)", () => {
    render(<Header {...makeProps()} />);
    expect(screen.getByPlaceholderText(/massif/i)).toBeInTheDocument();
    expect(screen.getByText("Zone visible")).toBeInTheDocument();
    // régression : un #status dans l'entête faisait varier sa hauteur et décalait la carte (mobile)
    expect(document.querySelector("#status")).toBeNull();
    expect(document.querySelector('#massifs-list option[value="Vanoise"]')).not.toBeNull(); // datalist
  });

  it("appelle les callbacks au changement", () => {
    const props = makeProps();
    render(<Header {...props} />);
    fireEvent.change(screen.getByPlaceholderText(/massif/i), { target: { value: "Van" } });
    expect(props.onMassifQueryChange).toHaveBeenCalledWith("Van");
    fireEvent.click(screen.getByText("Zone visible"));
    expect(props.onZoneClick).toHaveBeenCalled();
  });

  it("le bouton zone a la classe active quand zoneActive", () => {
    render(<Header {...makeProps({ zoneActive: true })} />);
    expect(screen.getByText("Zone visible")).toHaveClass("active");
  });

  it("l'icône compte 👤 est après le champ de recherche, à droite de la page", () => {
    const props = makeProps({ accountOpen: true, onAccountToggle: vi.fn() });
    const { container } = render(<Header {...props} />);
    // le champ est dans .massif-row, le bouton 👤 est le dernier élément de .controls (poussé à droite)
    expect(container.querySelector(".massif-row #massif-search")).not.toBeNull();
    const controls = container.querySelector(".controls");
    const btn = controls.querySelector("#btn-account");
    expect(btn).not.toBeNull();
    expect(controls.lastElementChild.classList.contains("account-wrap")).toBe(true);
    // le panneau compte s'ouvre (accountOpen=true)
    expect(container.querySelector(".account-dropdown")).not.toBeNull();
    // au clic sur 👤, onAccountToggle est appelé
    fireEvent.click(screen.getByLabelText("Compte"));
    expect(props.onAccountToggle).toHaveBeenCalled();
    // l'icône est un SVG outline (pas l'emoji plein)
    expect(screen.getByLabelText("Compte").querySelector("svg")).not.toBeNull();
  });

});
