import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchPanel from "./SearchPanel";
import { TYPE_LABELS } from "../types";

const ALL_IDS = Object.keys(TYPE_LABELS).map(Number);

const renderPanel = (props = {}) =>
  render(
    <SearchPanel
      onSearch={() => {}}
      onReset={() => {}}
      searching={false}
      resultCount={null}
      {...props}
    />
  );

describe("SearchPanel", () => {
  it("soumet les critères parsés (texte + altitude + état)", () => {
    const onSearch = vi.fn();
    renderPanel({ onSearch });
    fireEvent.change(screen.getByPlaceholderText(/Nom du refuge/i), { target: { value: "goûter" } });
    fireEvent.change(screen.getByLabelText(/Altitude min/i), { target: { value: "3000" } });
    fireEvent.change(screen.getByLabelText(/Altitude max/i), { target: { value: "4000" } });
    fireEvent.change(screen.getByLabelText(/Places minimum/i), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText(/^État$/i), { target: { value: "ouvert" } });
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    expect(onSearch).toHaveBeenCalledWith({
      q: "goûter",
      altMin: 3000,
      altMax: 4000,
      placesMin: 20,
      etat: "ouvert",
      types: null, // tous les types cochés = pas de filtre
      equip: {},
    });
  });

  it("envoie les critères équipements (info_comp) tri-état", () => {
    const onSearch = vi.fn();
    renderPanel({ onSearch });
    fireEvent.change(screen.getByLabelText("Cheminée"), { target: { value: "oui" } });
    fireEvent.change(screen.getByLabelText("Eau à moins de 100 m"), { target: { value: "non" } });
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    const params = onSearch.mock.calls[0][0];
    expect(params.equip).toEqual({ cheminee: "oui", eau: "non" });
  });

  it("envoie le set de types quand au moins un type est décoché", () => {
    const onSearch = vi.fn();
    renderPanel({ onSearch });
    fireEvent.click(screen.getByLabelText("refuge gardé"));
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    const params = onSearch.mock.calls[0][0];
    expect(params.types).toBeInstanceOf(Set);
    expect(params.types.has(10)).toBe(false);
    expect(params.types.size).toBe(ALL_IDS.length - 1);
  });

  it("ignore les champs numériques vides (null, pas NaN)", () => {
    const onSearch = vi.fn();
    renderPanel({ onSearch });
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    const params = onSearch.mock.calls[0][0];
    expect(params.altMin).toBeNull();
    expect(params.altMax).toBeNull();
    expect(params.placesMin).toBeNull();
    expect(params.q).toBe("");
    expect(params.equip).toEqual({});
  });

  it("réinitialise le formulaire et appelle onReset", () => {
    const onReset = vi.fn();
    renderPanel({ onReset });
    fireEvent.change(screen.getByPlaceholderText(/Nom du refuge/i), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /Réinitialiser/i }));
    expect(onReset).toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/Nom du refuge/i)).toHaveValue("");
  });

  it("désactive les boutons pendant la recherche", () => {
    renderPanel({ searching: true });
    expect(screen.getByRole("button", { name: /Recherche…/i })).toBeDisabled();
  });

  it("affiche le nombre de résultats", () => {
    renderPanel({ resultCount: 42 });
    expect(screen.getByText(/42 résultat/)).toBeInTheDocument();
  });
});
