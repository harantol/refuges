import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MapControls from "./MapControls";

const makeProps = (overrides = {}) => ({
  basemap: "topo",
  onBasemapChange: vi.fn(),
  hillshade: false,
  onHillshadeChange: vi.fn(),
  zoneOnly: false,
  onZoneOnlyToggle: vi.fn(),
  onLocate: vi.fn(),
  located: false,
  menu: null,
  onMenuToggle: vi.fn(),
  allTypes: new Map([[7, "cabane non gardée"], [10, "refuge gardé"]]),
  typeCounts: new Map([[10, 3]]),
  uncheckedTypes: new Set(),
  onToggleType: vi.fn(),
  recentDays: 0,
  onRecentChange: vi.fn(),
  onIgnKeySave: vi.fn(),
  ...overrides,
});

describe("MapControls (boutons flottants mobile)", () => {
  it("affiche les boutons : fonds, interrupteur zone (loupe), ma position, filtres (entonnoir SVG)", () => {
    render(<MapControls {...makeProps()} />);
    expect(screen.getByLabelText("Fond de carte")).toBeInTheDocument();
    expect(screen.getByLabelText("Limiter à la zone visible")).toBeInTheDocument();
    expect(screen.getByLabelText("Autour de moi")).toBeInTheDocument();
    const filtres = screen.getByLabelText("Filtres");
    expect(filtres.querySelector("svg")).not.toBeNull(); // icône entonnoir SVG, pas un emoji
  });

  it("la loupe est un interrupteur (aria-pressed) qui appelle onZoneOnlyToggle", () => {
    const props = makeProps({ zoneOnly: false });
    render(<MapControls {...props} />);
    const loupe = screen.getByLabelText("Limiter à la zone visible");
    expect(loupe.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(loupe);
    expect(props.onZoneOnlyToggle).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Autour de moi"));
    expect(props.onLocate).toHaveBeenCalled();
  });

  it("le bouton fonds ouvre le menu avec les radios + la case Pentes", () => {
    const props = makeProps({ menu: "basemap" });
    render(<MapControls {...props} />);
    expect(screen.getByLabelText(/IGN Top 25/)).toBeInTheDocument();
    expect(screen.getByLabelText(/OpenTopoMap/)).toBeChecked();
    fireEvent.click(screen.getByLabelText(/Satellite/));
    expect(props.onBasemapChange).toHaveBeenCalledWith("satellite");
    fireEvent.click(screen.getByLabelText(/Pentes/));
    expect(props.onHillshadeChange).toHaveBeenCalledWith(true);
  });

  it("le bouton filtres ouvre le menu avec les types et le filtre 'depuis'", () => {
    const props = makeProps({ menu: "filters" });
    render(<MapControls {...props} />);
    fireEvent.click(screen.getByLabelText(/cabane non gardée/));
    expect(props.onToggleType).toHaveBeenCalledWith(7, false);
    fireEvent.change(screen.getByLabelText(/Modifié depuis/), { target: { value: "30" } });
    expect(props.onRecentChange).toHaveBeenCalledWith(30);
  });

  it("dans le menu fonds, choisir IGN Top 25 affiche le formulaire de clé perso", () => {
    const props = makeProps({ menu: "basemap", basemap: "ign" });
    render(<MapControls {...props} />);
    expect(screen.getByPlaceholderText(/Clé perso IGN/)).toBeInTheDocument();
  });

  it("clic sur le bouton actif referme le menu (toggle)", () => {
    const props = makeProps({ menu: "basemap" });
    render(<MapControls {...props} />);
    fireEvent.click(screen.getByLabelText("Fond de carte"));
    expect(props.onMenuToggle).toHaveBeenCalledWith("basemap");
  });
});
