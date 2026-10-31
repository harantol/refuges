import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Fiche, { absUrl } from "./Fiche";

const fiche = {
  id: 583,
  geometry: { coordinates: [5.94, 44.64] },
  properties: {
    nom: "Cabane du Vallon d'Âne",
    type: { id: 7, valeur: "cabane non gardée" },
    coord: { alt: 1766, lat: 44.64, long: 5.94 },
    places: { valeur: 12 },
    etat: { valeur: "ouvert" },
    acces: { valeur: "1h de montée. <a href=\"https://exemple.org\">détail</a>" },
    remarque: { valeur: "Vue dominante.<br><b>Cirque</b> génial." },
    info_comp: {
      cheminee: { nom: "Cheminée", valeur: "Oui" },
      eau: { nom: "Eau à moins de 100m", valeur: "Non" },
      latrines: { nom: "Latrines", valeur: "<b>Inconnu</b>" },
    },
    lien: "https://www.refuges.info/point/583",
    commentaires: [
      { id: 1, date_photo: "2024-01-01", auteur: "randonneur", texte: "Très <b>sympa</b>", photo: "/photos_points/1-originale.jpeg?123" },
      { id: 2, auteur: "autre", texte: "", photo: "/photos_points/2-originale.jpeg?1774968979" },
    ],
  },
};

const renderFiche = (props = {}) =>
  render(<Fiche fiche={fiche} loading={false} favorites={new Set()} onToggleFavorite={() => {}} {...props} />);

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

  it("affiche les infos de la fiche (nom, altitude, lien)", () => {
    renderFiche();
    expect(screen.getByText("Cabane du Vallon d'Âne")).toBeInTheDocument();
    expect(screen.getByText(/cabane non gardée/)).toBeInTheDocument();
    expect(screen.getByText(/1766 m/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /refuges.info/ })).toHaveAttribute(
      "href",
      "https://www.refuges.info/point/583"
    );
  });

  it("rend le HTML des champs texte sans balises résiduelles", () => {
    const { container } = renderFiche();
    // le <b> de la remarque est rendu comme élément, pas comme texte brut
    expect(container.querySelector(".text b")?.textContent).toBe("Cirque");
    expect(screen.queryByText(/<b>/)).toBeNull();
    expect(screen.queryByText(/<br>/)).toBeNull();
    // le lien de l'accès est cliquable
    expect(container.querySelector(".text a")?.getAttribute("href")).toBe("https://exemple.org");
  });

  it("affiche la galerie photos avec des URL absolues refuges.info", () => {
    const { container } = renderFiche();
    const imgs = container.querySelectorAll(".photo-gallery img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0].getAttribute("src")).toBe("https://www.refuges.info/photos_points/1-originale.jpeg?123");
    expect(screen.getByText(/Photos \(2\)/)).toBeInTheDocument();
  });

  it("clic sur une miniature ouvre le diaporama en overlay (pas de nouvel onglet)", () => {
    const { container } = renderFiche();
    expect(container.querySelector(".lightbox-overlay")).toBeNull();
    fireEvent.click(container.querySelectorAll(".photo-gallery .thumb")[1]);
    const overlay = container.querySelector(".lightbox-overlay");
    expect(overlay).not.toBeNull();
    expect(overlay.querySelector("img").getAttribute("src")).toBe(
      "https://www.refuges.info/photos_points/2-originale.jpeg?1774968979"
    );
    // fermer avec Échap
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".lightbox-overlay")).toBeNull();
  });

  it("affiche les commentaires depuis properties.commentaires, avec leur date", () => {
    const { container } = renderFiche();
    expect(container.querySelectorAll(".comment")).toHaveLength(2);
    expect(container.querySelector(".comment .text b")?.textContent).toBe("sympa");
    expect(screen.getByText(/Commentaires \(2\)/)).toBeInTheDocument();
    // date_photo au format JJ/MM/AAAA
    expect(screen.getByText(/01\/01\/2024 — randonneur/)).toBeInTheDocument();
    // date extraite du timestamp de l'URL photo pour le second commentaire
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{4} — autre/)).toBeInTheDocument();
  });

  it("affiche les équipements en pastilles, avant les photos", () => {
    const { container } = renderFiche();
    const h3s = [...container.querySelectorAll("#fiche-content h3")].map((h) => h.textContent);
    expect(h3s).toContain("Équipements");
    expect(h3s.indexOf("Équipements")).toBeLessThan(h3s.findIndex((t) => t.startsWith("Photos")));
    const items = [...container.querySelectorAll(".equip-grid li")];
    expect(items.map((li) => li.className)).toEqual(["oui", "non", "inconnu"]);
    expect(items[0].querySelector(".equip-val")?.textContent).toBe("Oui");
    // les balises HTML de la valeur sont retirées
    expect(items[2].querySelector(".equip-val")?.textContent).toBe("Inconnu");
  });

  it("appelle onToggleFavorite avec l'id au clic sur l'étoile", () => {
    const onToggleFavorite = vi.fn();
    renderFiche({ onToggleFavorite });
    fireEvent.click(screen.getByTitle("Ajouter aux favoris"));
    expect(onToggleFavorite).toHaveBeenCalledWith(583);
  });

  it("affiche la distance depuis userPos", () => {
    renderFiche({ userPos: [44.64, 5.94] });
    expect(screen.getByText(/0\.0 km de vous/)).toBeInTheDocument();
  });
});

describe("absUrl", () => {
  it("préfixe les chemins relatifs par l'origine refuges.info", () => {
    expect(absUrl("/photos_points/x.jpeg")).toBe("https://www.refuges.info/photos_points/x.jpeg");
  });
  it("laisse les URL absolues telles quelles", () => {
    expect(absUrl("https://exemple.org/x.jpeg")).toBe("https://exemple.org/x.jpeg");
  });
});
