import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Fiche from "./Fiche";

const fiche = {
  id: 583,
  geometry: { coordinates: [5.94, 44.64] },
  properties: {
    nom: "Cabane du Vallon d'Âne",
    type: { id: 7, valeur: "cabane non gardée" },
    coord: { alt: 1766, lat: 44.64, long: 5.94 },
    places: { valeur: 12 },
    etat: { valeur: "ouvert" },
    remarque: { valeur: "Beau panorama" },
    lien: "https://www.refuges.info/point/583",
  },
  comments: [{ date: "2024-01-01", auteur: "randonneur", texte: "Très sympa" }],
};

describe("Fiche", () => {
  it("affiche un message de chargement", () => {
    render(<Fiche fiche={null} loading={true} />);
    expect(screen.getByText(/Chargement de la fiche/)).toBeInTheDocument();
  });

  it("affiche un message par défaut sans fiche", () => {
    render(<Fiche fiche={null} loading={false} />);
    expect(screen.getByText(/Cliquez sur un point/)).toBeInTheDocument();
  });

  it("affiche l'erreur si le chargement a échoué", () => {
    render(<Fiche fiche={{ error: "HTTP 500" }} loading={false} />);
    expect(screen.getByText(/HTTP 500/)).toBeInTheDocument();
  });

  it("affiche les infos de la fiche (nom, altitude, remarques, commentaires, lien)", () => {
    render(<Fiche fiche={fiche} loading={false} favorites={new Set()} onToggleFavorite={() => {}} />);
    expect(screen.getByText("Cabane du Vallon d'Âne")).toBeInTheDocument();
    expect(screen.getByText(/cabane non gardée/)).toBeInTheDocument();
    expect(screen.getByText(/1766 m/)).toBeInTheDocument();
    expect(screen.getByText("Beau panorama")).toBeInTheDocument();
    expect(screen.getByText("Très sympa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /refuges.info/ })).toHaveAttribute(
      "href",
      "https://www.refuges.info/point/583"
    );
  });

  it("appelle onToggleFavorite avec l'id au clic sur l'étoile", () => {
    const onToggleFavorite = vi.fn();
    render(<Fiche fiche={fiche} loading={false} favorites={new Set()} onToggleFavorite={onToggleFavorite} />);
    fireEvent.click(screen.getByTitle("Ajouter aux favoris"));
    expect(onToggleFavorite).toHaveBeenCalledWith(583);
  });

  it("affiche la distance depuis userPos", () => {
    render(
      <Fiche fiche={fiche} loading={false} userPos={[44.64, 5.94]} favorites={new Set()} onToggleFavorite={() => {}} />
    );
    expect(screen.getByText(/0\.0 km de vous/)).toBeInTheDocument();
  });
});
