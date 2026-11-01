import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MapStatus from "./MapStatus";

describe("MapStatus (indicateur flottant sur la carte)", () => {
  it("chargement en cours -> spinner dans le coin de la carte, sans texte de statut", () => {
    render(<MapStatus loading={true} status="Chargement de la zone visible…" />);
    const el = document.querySelector("#map-loading");
    expect(el).not.toBeNull();
    expect(el.querySelector(".spinner")).not.toBeNull();
    expect(el.getAttribute("role")).toBe("status");
    expect(document.querySelector("#map-toast")).toBeNull(); // pas de toast pendant le chargement
  });

  it("message info/erreur -> toast discret sur la carte", () => {
    render(<MapStatus loading={false} status="Erreur de recherche : HTTP 500" />);
    expect(screen.getByText("Erreur de recherche : HTTP 500")).toBeInTheDocument();
    expect(document.querySelector("#map-toast")).not.toBeNull();
    expect(document.querySelector("#map-loading")).toBeNull();
  });

  it("rien à signaler -> aucun élément", () => {
    const { container } = render(<MapStatus loading={false} status="" />);
    expect(container.firstChild).toBeNull();
  });
});
