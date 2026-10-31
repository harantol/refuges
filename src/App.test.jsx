import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

// MapView mocké : on simule juste l'émission initiale du bbox (Leaflet ne tourne pas dans jsdom)
vi.mock("./components/MapView", async () => {
  const React = await import("react");
  return {
    default: ({ onNavigate }) => {
      React.useEffect(() => {
        onNavigate("6.0,45.5,7.0,46.0");
      }, [onNavigate]);
      return React.createElement("div", { "data-testid": "map" });
    },
  };
});

const zoneData = {
  size: 1,
  features: [
    {
      id: 1,
      geometry: { coordinates: [6.1, 45.9] },
      properties: { nom: "Refuge Test", type: { id: 10, valeur: "refuge gardé" }, coord: { alt: 2000 } },
    },
  ],
};
const massifsData = { features: [{ id: 351, properties: { nom: "Vanoise" } }] };
const massifData = {
  size: 1,
  features: [
    {
      id: 9,
      geometry: { coordinates: [6.5, 45.4] },
      properties: { nom: "Refuge Massif", type: { id: 10, valeur: "refuge gardé" } },
    },
  ],
};
const ficheData = {
  features: [
    {
      id: 1,
      geometry: { coordinates: [6.1, 45.9] },
      properties: {
        nom: "Refuge Test",
        type: { id: 10, valeur: "refuge gardé" },
        coord: { alt: 2000, lat: 45.9, long: 6.1 },
      },
      comments: [],
    },
  ],
};
const allData = {
  size: 2,
  features: [
    {
      id: 42,
      geometry: { coordinates: [6.3, 45.7] },
      properties: {
        nom: "Cabane du Lac",
        type: { id: 7, valeur: "cabane non gardée" },
        coord: { alt: 1500 },
        places: { valeur: 8 },
        etat: { valeur: "ouvert" },
      },
    },
    {
      id: 43,
      geometry: { coordinates: [6.4, 45.8] },
      properties: {
        nom: "Refuge du Goûter",
        type: { id: 10, valeur: "refuge gardé" },
        coord: { alt: 3835 },
        places: { valeur: 50 },
        etat: { valeur: "ouvert" },
      },
    },
  ],
};

const detailData = {
  features: [
    {
      id: 42,
      geometry: { coordinates: [6.3, 45.7] },
      properties: {
        nom: "Cabane du Lac",
        info_comp: { cheminee: { nom: "Cheminée", valeur: "Oui" }, eau: { nom: "Eau", valeur: "<b>Inconnu</b>" } },
      },
    },
    {
      id: 43,
      geometry: { coordinates: [6.4, 45.8] },
      properties: {
        nom: "Refuge du Goûter",
        info_comp: { cheminee: { nom: "Cheminée", valeur: "Non" }, eau: { nom: "Eau", valeur: "Oui" } },
      },
    },
  ],
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      const json = async (data) => ({ ok: true, status: 200, json: async () => data });
      if (url.includes("/api/polygones")) return json(massifsData);
      if (url.includes("/api/massif")) return json(massifData);
      if (url.includes("detail=fiche")) return json(ficheData);
      if (url.includes("detail=complet")) return json(detailData);
      if (url.includes("/api/bbox") && url.includes("nb_points=all")) return json(allData);
      if (url.includes("/api/bbox")) return json(zoneData);
      if (url.includes("/api/point")) return json(zoneData);
      return json({ features: [] });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App (intégration, fetch mocké)", () => {
  it("charge la zone visible au montage et affiche le point dans la liste", async () => {
    render(<App />);
    expect(await screen.findByText("Refuge Test")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/bbox?bbox=6.0,45.5,7.0,46.0"));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/polygones?type_polygone=1"));
  });

  it("au clic sur un point, charge et affiche sa fiche", async () => {
    render(<App />);
    fireEvent.click(await screen.findByText("Refuge Test"));
    expect(await screen.findByText(/2000 m/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("detail=fiche"));
  });

  it("charge un massif quand on tape son nom exact dans l'autocomplétion", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.change(screen.getByPlaceholderText(/massif/i), { target: { value: "Vanoise" } });
    expect(await screen.findByText("Refuge Massif")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/massif?massif=351"));
  });

  it("recherche détaillée par nom dans toute la base (bbox=world, nb_points=all)", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getByText("🔎 Recherche"));
    fireEvent.change(screen.getByPlaceholderText(/Nom du refuge/i), { target: { value: "lac" } });
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    expect(await screen.findByText("Cabane du Lac")).toBeInTheDocument();
    expect(screen.queryByText("Refuge Test")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("bbox=world"));
  });

  it("recherche détaillée filtre par altitude min", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getByText("🔎 Recherche"));
    fireEvent.change(screen.getByLabelText(/Altitude min/i), { target: { value: "3000" } });
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    expect(await screen.findByText("Refuge du Goûter")).toBeInTheDocument();
    expect(screen.queryByText("Cabane du Lac")).not.toBeInTheDocument();
  });

  it("recherche détaillée filtre sur les équipements (info_comp via detail=complet)", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getByText("🔎 Recherche"));
    fireEvent.change(screen.getByLabelText("Cheminée"), { target: { value: "oui" } });
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    expect(await screen.findByText("Cabane du Lac")).toBeInTheDocument();
    expect(screen.queryByText("Refuge du Goûter")).not.toBeInTheDocument();
    // le détail complet a bien été demandé pour les candidats
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("detail=complet"));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/point?id=42,43"));
  });

  it("le bouton ✕ efface la recherche et réaffiche la zone", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getByText("🔎 Recherche"));
    fireEvent.change(screen.getByPlaceholderText(/Nom du refuge/i), { target: { value: "lac" } });
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    await screen.findByText("Cabane du Lac");
    fireEvent.click(screen.getByTitle("Effacer la recherche"));
    expect(await screen.findByText("Refuge Test")).toBeInTheDocument();
    expect(screen.queryByText("Cabane du Lac")).not.toBeInTheDocument();
  });

  it("ajoute un favori (persistance localStorage) et l'onglet Favoris le recharge via /api/point", async () => {
    render(<App />);
    fireEvent.click(await screen.findByText("Refuge Test"));
    // la fiche est ouverte : on prend l'étoile de la fiche
    fireEvent.click(screen.getByTitle("Ajouter aux favoris"));
    expect(JSON.parse(localStorage.getItem("refuges-favoris"))).toEqual([1]);
    fireEvent.click(screen.getByText(/Favoris/));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/point?id=1"))
    );
  });

  it("le filtre 'modifié depuis' ajoute le paramètre depuis", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.change(screen.getByTitle(/modifiés récemment/i), { target: { value: "30" } });
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("depuis=-2592000"))
    );
  });
});
