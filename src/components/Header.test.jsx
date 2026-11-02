import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header";

const makeProps = (overrides = {}) => ({
  massifs: [{ id: 351, nom: "Vanoise" }],
  massifQuery: "",
  onMassifQueryChange: vi.fn(),
  ...overrides,
});

describe("Header", () => {
  it("rend les contrôles d'entête sans le contrôle redondant de zone visible", () => {
    render(<Header {...makeProps()} />);
    expect(screen.getByPlaceholderText(/massif/i)).toBeInTheDocument();
    expect(screen.queryByText("Zone visible")).not.toBeInTheDocument();
    // régression : un #status dans l'entête faisait varier sa hauteur et décalait la carte (mobile)
    expect(document.querySelector("#status")).toBeNull();
    expect(document.querySelector('#massifs-list option[value="Vanoise"]')).not.toBeNull(); // datalist
  });

  it("appelle le callback de recherche au changement", () => {
    const props = makeProps();
    render(<Header {...props} />);
    fireEvent.change(screen.getByPlaceholderText(/massif/i), { target: { value: "Van" } });
    expect(props.onMassifQueryChange).toHaveBeenCalledWith("Van");
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
