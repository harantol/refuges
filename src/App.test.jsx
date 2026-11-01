import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "./App";
import { TYPE_LABELS } from "./types";

// MapView mocké : on simule juste l'émission initiale du bbox (Leaflet ne tourne pas dans jsdom)
vi.mock("./components/MapView", async () => {
  const React = await import("react");
  return {
    default: ({ onNavigate, basemap, hillshade, onCloseMenus }) => {
      React.useEffect(() => {
        onNavigate("6.0,45.5,7.0,46.0");
      }, [onNavigate]);
      return React.createElement(
        "div",
        {
          "data-testid": "map",
          "data-basemap": basemap,
          "data-hillshade": String(Boolean(hillshade)),
        },
        React.createElement(
          "button",
          { "data-testid": "map-click", onClick: onCloseMenus },
          "clic carte"
        )
      );
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
        type: { valeur: "refuge gardé" }, // detail=fiche réel : pas d'id dans type
        coord: { alt: 2000 },
      },
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
      geometry: { coordinates: [8.5, 44.2] }, // HORS de la bbox visible (6.0,45.5,7.0,46.0)
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

// Base complète en detail=complet (monde) : utilisée quand un critère équipement est actif
const detailAllData = {
  features: [
    {
      id: 42,
      geometry: { coordinates: [6.3, 45.7] },
      properties: {
        nom: "Cabane du Lac",
        type: { id: 7, valeur: "cabane non gardée" },
        coord: { alt: 1500 },
        info_comp: { cheminee: { nom: "Cheminée", valeur: "Oui" }, poele: { nom: "Poêle", valeur: "Non" } },
      },
    },
    {
      id: 43,
      geometry: { coordinates: [6.4, 45.8] },
      properties: {
        nom: "Refuge du Goûter",
        type: { id: 10, valeur: "refuge gardé" },
        coord: { alt: 3835 },
        info_comp: { cheminee: { nom: "Cheminée", valeur: "Non" }, poele: { nom: "Poêle", valeur: "Non" } },
      },
    },
    {
      id: 900,
      geometry: { coordinates: [6.9, 45.0] },
      properties: {
        nom: "P900",
        type: { id: 7, valeur: "cabane non gardée" },
        coord: { alt: 1000 },
        info_comp: { poele: { nom: "Poêle", valeur: "Oui" } },
      },
    },
    {
      id: 1,
      geometry: { coordinates: [6.0, 45.0] },
      properties: {
        nom: "P1",
        type: { id: 7, valeur: "cabane non gardée" },
        coord: { alt: 1000 },
        info_comp: { poele: { nom: "Poêle", valeur: "[b]Inconnu[/b]" } },
      },
    },
  ],
};

// Base "simple" monde et base "complet" monde, surchargeables par test
let allDataMock = allData;
const allDataBig = {
  size: 900,
  features: Array.from({ length: 900 }, (_, i) => ({
    id: i + 1,
    geometry: { coordinates: [6.0 + i * 0.001, 45.0] },
    properties: { nom: `P${i + 1}`, type: { id: 7, valeur: "cabane non gardée" }, coord: { alt: 1000 } },
  })),
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  allDataMock = allData;
  try {
    history.replaceState(null, "", window.location.pathname); // reset du hash entre les tests
  } catch {
    /* jsdom */
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, opts = {}) => {
      const json = async (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
      // cloud Supabase (tests de session)
      if (String(url).startsWith("https://test.supabase.co")) {
        if (url.includes("/auth/v1/user")) return json({ id: "u1", email: "a@b.c" });
        if (url.includes("/rest/v1/favoris") && opts.method === "DELETE") return { ok: true, status: 204, json: async () => null };
        if (url.includes("/rest/v1/favoris") && opts.method === "POST") return json({}, 201);
        if (url.includes("/rest/v1/favoris")) return json([{ point_id: 42 }]);
        return json({});
      }
      if (url.includes("/api/polygones")) return json(massifsData);
      if (url.includes("/api/massif")) return json(massifData);
      if (url.includes("detail=fiche")) return json(ficheData);
      if (url.includes("detail=complet") && url.includes("bbox=world")) return json(detailAllData);
      if (url.includes("/api/bbox") && url.includes("nb_points=all")) return json(allDataMock);
      if (url.includes("/api/bbox")) return json(zoneData);
      if (url.includes("/api/point")) return json(zoneData);
      return json({ features: [] });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("App (intégration, fetch mocké)", () => {
  it("charge la zone visible au montage et affiche le point dans la liste", async () => {
    render(<App />);
    expect(await screen.findByText("Refuge Test")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/bbox?bbox=6.0,45.5,7.0,46.0"));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/polygones?type_polygone=1"));
  });

  it("fond de carte par défaut = OpenTopoMap", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    expect(screen.getByTestId("map").getAttribute("data-basemap")).toBe("topo");
  });

  it("choisir IGN Top 25 dans le menu 🗺️ affiche le formulaire de clé perso", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getByLabelText("Fond de carte")); // menu flottant
    fireEvent.click(screen.getByLabelText(/IGN Top 25/)); // radio
    expect(screen.getByTestId("map").getAttribute("data-basemap")).toBe("ign");
    expect(await screen.findByPlaceholderText(/Clé perso IGN/)).toBeInTheDocument();
  });

  it("la case Pentes (menu 🗺️ de la carte) active/désactive la couche hillshade", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    const map = screen.getByTestId("map");
    expect(map.getAttribute("data-hillshade")).toBe("false");
    fireEvent.click(screen.getByLabelText("Fond de carte")); // ouvre le menu 🗺️
    const casePentes = screen.getByLabelText(/Pentes/); // unique maintenant (menu carte)
    fireEvent.click(casePentes);
    expect(map.getAttribute("data-hillshade")).toBe("true");
  });

  it("les contrôles flottants de la carte sont présents (fonds, interrupteur zone, position, filtres)", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    expect(screen.getByLabelText("Fond de carte")).toBeInTheDocument();
    expect(screen.getByLabelText("Limiter à la zone visible")).toBeInTheDocument();
    expect(screen.getByLabelText("Autour de moi")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtres")).toBeInTheDocument();
  });

  it("le menu flottant 'Fond de carte' permet de changer de fond", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getByLabelText("Fond de carte"));
    fireEvent.click(screen.getByLabelText(/Satellite/));
    expect(screen.getByTestId("map").getAttribute("data-basemap")).toBe("satellite");
  });

  it("un clic sur la carte ferme les menus flottants ouverts", async () => {
    const { container } = render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getByLabelText("Fond de carte"));
    expect(container.querySelector(".map-menu")).not.toBeNull();
    fireEvent.click(screen.getByTestId("map-click")); // clic sur la carte
    expect(container.querySelector(".map-menu")).toBeNull();
  });

  it("au clic sur un point, charge et affiche sa fiche", async () => {
    render(<App />);
    fireEvent.click(await screen.findByText("Refuge Test"));
    expect(await screen.findByText(/2000 m/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("detail=fiche"));
  });

  it("la fiche récupère type.id/icone depuis la feature d'origine (absents du detail=fiche)", async () => {
    const { container } = render(<App />);
    fireEvent.click(await screen.findByText("Refuge Test")); // zoneData : type id 10
    await screen.findByText(/2000 m/);
    // type.id=10 récupéré -> icône par défaut cabane_red
    expect(container.querySelector("img.fiche-icon")?.getAttribute("src")).toBe(
      "https://www.refuges.info/images/icones/cabane_red.png"
    );
  });

  it("l'onglet Favoris charge chaque favori par un appel /api/point individuel", async () => {
    localStorage.setItem("refuges-favoris", JSON.stringify([1, 2]));
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getByText(/Favoris/));
    await waitFor(() => {
      const urls = fetch.mock.calls.map((c) => c[0]).filter((u) => u.includes("/api/point?"));
      expect(urls.some((u) => u.includes("/api/point?id=1&"))).toBe(true);
      expect(urls.some((u) => u.includes("/api/point?id=2&"))).toBe(true);
    });
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

  it("recherche détaillée filtre sur les équipements (base complète detail=complet, sans format_texte)", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getByText("🔎 Recherche"));
    fireEvent.change(screen.getByLabelText("Cheminée"), { target: { value: "oui" } });
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    expect(await screen.findByText("Cabane du Lac")).toBeInTheDocument();
    expect(screen.queryByText("Refuge du Goûter")).not.toBeInTheDocument();
    // base complète demandée en detail=complet, SANS format_texte=html (sinon HTTP 500)
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/bbox=world.*detail=complet/));
    const detailUrl = fetch.mock.calls.map((c) => c[0]).find((u) => u.includes("detail=complet"));
    expect(detailUrl).not.toContain("format_texte=html");
  });

  it("recherche équipements avec >800 candidats : charge la base complète détaillée (pas de cap arbitraire)", async () => {
    allDataMock = allDataBig;
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getByText("🔎 Recherche"));
    fireEvent.change(screen.getByLabelText("Poêle"), { target: { value: "oui" } });
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    // P900 (poêle=Oui, au-delà du cap de 800) est trouvé ; P1 (poêle=Non) est exclu
    expect(await screen.findByText("P900")).toBeInTheDocument();
    expect(screen.queryByText("P1")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/bbox=world.*detail=complet/));
  });

  it("affiche tous les types connus dans les filtres, même absents de la zone courante", async () => {
    render(<App />);
    await screen.findByText("Refuge Test"); // zoneData ne contient qu'un refuge gardé (type 10)
    const filters = within(document.getElementById("type-filters"));
    expect(filters.getAllByRole("checkbox").length).toBe(Object.keys(TYPE_LABELS).length);
    expect(filters.getByLabelText(/cabane non gardée/)).toBeChecked();
  });

  it("conserve tous les filtres de type (et leur état) après un rechargement", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    const filters = within(document.getElementById("type-filters"));
    // décocher un type absent de la zone courante
    fireEvent.click(filters.getByLabelText(/cabane non gardée/));
    expect(filters.getByLabelText(/cabane non gardée/)).not.toBeChecked();
    // simuler un rechargement (changement du zoom => nouveau chargement via le filtre 'depuis')
    fireEvent.change(screen.getByTitle(/modifiés récemment/i), { target: { value: "30" } });
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("depuis=-2592000"))
    );
    await waitFor(() =>
      expect(within(document.getElementById("type-filters")).getAllByRole("checkbox").length).toBe(
        Object.keys(TYPE_LABELS).length
      )
    );
    // la case existe toujours et reste décochée
    expect(within(document.getElementById("type-filters")).getByLabelText(/cabane non gardée/)).not.toBeChecked();
  });

  it("fix: aller à l'onglet Favoris efface les résultats de recherche (ne polluent plus la liste)", async () => {
    localStorage.setItem("refuges-favoris", JSON.stringify([1]));
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(document.getElementById("tab-recherche"));
    fireEvent.change(screen.getByPlaceholderText(/Nom du refuge/i), { target: { value: "lac" } });
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    await screen.findByText("Cabane du Lac");
    fireEvent.click(screen.getByRole("button", { name: /Favoris/ }));
    await waitFor(() => expect(screen.queryByText("Cabane du Lac")).not.toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/point?id=1&"));
  });

  it("au chargement avec #point=1, ouvre directement la fiche du point", async () => {
    window.location.hash = "#point=1";
    render(<App />);
    expect(await screen.findByText(/2000 m/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("detail=fiche"));
    window.location.hash = "";
  });

  it("au chargement avec #favoris=7,8, charge ces points sans toucher au localStorage", async () => {
    window.location.hash = "#favoris=7,8";
    render(<App />);
    await waitFor(() => {
      const urls = fetch.mock.calls.map((c) => c[0]).filter((u) => u.includes("/api/point?"));
      expect(urls.some((u) => u.includes("/api/point?id=7&"))).toBe(true);
      expect(urls.some((u) => u.includes("/api/point?id=8&"))).toBe(true);
    });
    expect(localStorage.getItem("refuges-favoris")).toBeNull();
    window.location.hash = "";
  });

  it("le bouton 🔗 de la fiche copie le lien #point=<id> dans le presse-papiers", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<App />);
    fireEvent.click(await screen.findByText("Refuge Test"));
    await screen.findByText(/2000 m/);
    fireEvent.click(screen.getByTitle(/Copier le lien de partage/));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("#point=1")));
  });

  it("au chargement avec une session cloud, merge les favoris local + cloud", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
    localStorage.setItem("cloud-auth-token", "tok");
    render(<App />);
    await screen.findByText("Refuge Test");
    // le favori cloud (42) est mergé -> compteur Favoris = 1
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Favoris/ }).textContent).toContain("(1)")
    );
    // appel REST avec le Bearer token
    const cloudCall = fetch.mock.calls.find(
      ([u, o]) => String(u).includes("test.supabase.co/rest/v1/favoris") && (!o || !o.method || o.method === "GET")
    );
    expect(cloudCall).toBeTruthy();
    expect(cloudCall[1].headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(localStorage.getItem("refuges-favoris"))).toContain(42);
  });

  it("le bouton 👤 ouvre le panneau compte", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getAllByTitle(/Connexion \/ compte/)[0]); // bouton 👤 du header
    expect(await screen.findByText(/non configuré/i)).toBeInTheDocument();
  });

  it("l'interrupteur zone (loupe) limite la liste à la bbox visible", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(document.getElementById("tab-recherche"));
    fireEvent.click(screen.getByRole("button", { name: /Rechercher/i }));
    await screen.findByText("Cabane du Lac"); // id 42, dans la bbox
    expect(screen.getByText("Refuge du Goûter")).toBeInTheDocument(); // id 43, hors bbox
    // activer l'interrupteur zone
    fireEvent.click(screen.getAllByLabelText("Limiter à la zone visible")[0]);
    await waitFor(() => expect(screen.queryByText("Refuge du Goûter")).not.toBeInTheDocument());
    expect(screen.getByText("Cabane du Lac")).toBeInTheDocument();
  });

  it("le panneau du bas est replié par défaut et se déplie au clic sur un onglet", async () => {
    render(<App />);
    await screen.findByText("Refuge Test");
    expect(document.getElementById("sidebar").className).not.toContain("open");
    fireEvent.click(document.getElementById("tab-recherche"));
    expect(document.getElementById("sidebar").className).toContain("open");
    // reclic sur le même onglet -> replie
    fireEvent.click(document.getElementById("tab-recherche"));
    expect(document.getElementById("sidebar").className).not.toContain("open");
  });

  it("création de compte avec confirmation email requise : message 'confirmez votre email', pas d'erreur", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, opts = {}) => {
        const u = String(url);
        const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
        if (u.startsWith("https://test.supabase.co")) {
          if (u.includes("/auth/v1/signup")) return json({});
          if (u.includes("/auth/v1/token")) return json({ error_description: "Email not confirmed" }, 400);
          if (u.includes("/rest/v1/favoris")) return json([]);
          return json({});
        }
        if (u.includes("/api/polygones")) return json(massifsData);
        if (u.includes("/api/bbox")) return json(zoneData);
        return json({ features: [] });
      })
    );
    render(<App />);
    await screen.findByText("Refuge Test");
    fireEvent.click(screen.getAllByTitle(/Connexion \/ compte/)[0]);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "new@b.c" } });
    fireEvent.change(screen.getByPlaceholderText("Mot de passe"), { target: { value: "secret1" } });
    fireEvent.click(screen.getByText("Créer un compte"));
    expect(await screen.findByText(/confirmez votre adresse email/i)).toBeInTheDocument();
    expect(screen.queryByText("Email not confirmed")).toBeNull();
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
