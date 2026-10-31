import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header";

const makeProps = (overrides = {}) => ({
  massifs: [{ id: 351, nom: "Vanoise" }],
  massifQuery: "",
  onMassifQueryChange: vi.fn(),
  onZoneClick: vi.fn(),
  zoneActive: true,
  basemap: "osm",
  onBasemapChange: vi.fn(),
  hillshade: false,
  onHillshadeChange: vi.fn(),
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
    expect(screen.getByTitle(/fond de carte/i)).toBeInTheDocument();
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
    fireEvent.change(screen.getByTitle(/fond de carte/i), { target: { value: "satellite" } });
    expect(props.onBasemapChange).toHaveBeenCalledWith("satellite");
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

  it("la case à cocher Pentes appelle onHillshadeChange", () => {
    const props = makeProps();
    render(<Header {...props} />);
    const cb = screen.getByLabelText(/Pentes/);
    expect(cb).not.toBeChecked();
    fireEvent.click(cb);
    expect(props.onHillshadeChange).toHaveBeenCalledWith(true);
  });

  it("affiche les filtres de type avec compteur", () => {
    render(<Header {...makeProps()} />);
    expect(screen.getByText(/refuge gardé/)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
