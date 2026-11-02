import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchZone,
  fetchMassifPoints,
  fetchPointsByIds,
  fetchFiche,
  fetchPointsDetail,
  fetchMassifs,
  fetchIgnHikingRoutes,
  fetchAllPoints,
  fetchAllPointsDetail,
} from "./api";

const okJson = (data) => ({ ok: true, status: 200, json: async () => data });

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => okJson({ features: [], size: 0 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api refuges.info - construction des URLs", () => {
  it("fetchZone : /api/bbox avec detail=simple, nb_points=500, sans depuis par défaut", async () => {
    await fetchZone("6.0,45.5,7.0,46.0");
    const url = fetch.mock.calls[0][0];
    expect(url).toContain("https://www.refuges.info/api/bbox?bbox=6.0,45.5,7.0,46.0");
    expect(url).toContain("format=geojson");
    expect(url).toContain("detail=simple");
    expect(url).toContain("nb_points=500");
    expect(url).not.toContain("depuis");
  });

  it("fetchZone ajoute depuis=-604800 pour 7 jours", async () => {
    await fetchZone("world", 7);
    expect(fetch.mock.calls[0][0]).toContain("depuis=-604800");
  });

  it("fetchMassifPoints : /api/massif avec l'id et depuis pour 30 jours", async () => {
    await fetchMassifPoints("351", 30);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain("/api/massif?massif=351");
    expect(url).toContain("depuis=-2592000");
  });

  it("fetchPointsByIds fait UN appel par id (/api/point n'accepte qu'un seul id) et concatène", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        const m = /id=(\d+)/.exec(url);
        return { ok: true, status: 200, json: async () => ({ features: [{ id: Number(m[1]) }] }) };
      })
    );
    const data = await fetchPointsByIds([1, 2, 583]);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls.map((c) => c[0])).toEqual([
      expect.stringContaining("/api/point?id=1"),
      expect.stringContaining("/api/point?id=2"),
      expect.stringContaining("/api/point?id=583"),
    ]);
    expect(data.features.map((f) => f.id)).toEqual([1, 2, 583]);
  });

  it("borne à six le nombre d'appels simultanés pour une liste de points", async () => {
    let active = 0;
    let maxActive = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (url) =>
          new Promise((resolve) => {
            active += 1;
            maxActive = Math.max(maxActive, active);
            setTimeout(() => {
              active -= 1;
              const id = Number(/id=(\d+)/.exec(url)[1]);
              resolve({ ok: true, json: async () => ({ features: [{ id }] }) });
            }, 0);
          })
      )
    );

    const data = await fetchPointsByIds(Array.from({ length: 14 }, (_, i) => i + 1));
    expect(maxActive).toBe(6);
    expect(data.features.map((feature) => feature.id)).toEqual(
      Array.from({ length: 14 }, (_, i) => i + 1)
    );
  });

  it("ne masque pas l'échec d'un appel de point", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503 }))
    );
    await expect(fetchPointsByIds([1, 2])).rejects.toThrow("HTTP 503");
  });

  it("fetchFiche demande detail=fiche + format_texte=html", async () => {
    await fetchFiche(583);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain("/api/point?id=583");
    expect(url).toContain("detail=fiche");
    expect(url).toContain("format_texte=html");
  });

  it("transmet un AbortSignal aux appels annulables", async () => {
    const controller = new AbortController();
    await fetchZone("world", 0, { signal: controller.signal });
    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it("fetchPointsDetail : un appel par id en detail=complet, SANS format_texte (sinon HTTP 500)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okJson({ features: [] })));
    await fetchPointsDetail([42, 43]);
    expect(fetch).toHaveBeenCalledTimes(2);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain("/api/point?id=42");
    expect(url).toContain("detail=complet");
    expect(url).not.toContain("format_texte");
  });

  it("fetchMassifs demande les polygones de type 1 sur le monde", async () => {
    await fetchMassifs();
    const url = fetch.mock.calls[0][0];
    expect(url).toContain("/api/polygones?type_polygone=1");
    expect(url).toContain("bbox=world");
  });

  it("fetchIgnHikingRoutes charge les itinéraires pédestres IGN pour la bbox", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          numberMatched: 2,
          features: [
            { properties: { nature: "Itinéraire de randonnée pédestre" } },
            { properties: { nature: "Itinéraire cyclable" } },
          ],
        }),
      }))
    );
    const controller = new AbortController();
    const result = await fetchIgnHikingRoutes("5.8,45.4,6.8,46.1", {
      signal: controller.signal,
    });
    const [url, options] = fetch.mock.calls[0];
    const query = new URL(url).searchParams;

    expect(query.get("TYPENAMES")).toBe("BDTOPO_V3:itineraire_autre");
    expect(query.get("COUNT")).toBe("3000");
    expect(query.get("FILTER")).toContain("Itinéraire de randonnée pédestre");
    expect(query.get("FILTER")).toContain("<gml:lowerCorner>5.8 45.4</gml:lowerCorner>");
    expect(options.signal).toBe(controller.signal);
    expect(result.features).toHaveLength(1);
    expect(result.truncated).toBe(false);
  });

  it("signale lorsque la réponse des itinéraires IGN est limitée", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ numberMatched: 3001, features: Array(3000).fill({ properties: {} }) }),
      }))
    );
    const result = await fetchIgnHikingRoutes("5,45,6,46");
    expect(result.truncated).toBe(true);
  });

  it("refuse une bbox invalide pour la requête IGN", async () => {
    await expect(fetchIgnHikingRoutes("bad,bbox")).rejects.toThrow("Emprise de carte invalide");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetchAllPoints : monde entier en detail=simple nb_points=all", async () => {
    await fetchAllPoints();
    const url = fetch.mock.calls[0][0];
    expect(url).toContain("bbox=world");
    expect(url).toContain("detail=simple");
    expect(url).toContain("nb_points=all");
  });

  it("fetchAllPointsDetail : monde en detail=complet, sans format_texte=html (cause de HTTP 500)", async () => {
    await fetchAllPointsDetail();
    const url = fetch.mock.calls[0][0];
    expect(url).toContain("bbox=world");
    expect(url).toContain("detail=complet");
    expect(url).toContain("nb_points=all");
    expect(url).not.toContain("format_texte=html");
  });

  it("lève une erreur sur HTTP non 200", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(fetchZone("world")).rejects.toThrow("HTTP 500");
  });

  it("renvoie le JSON parsé", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okJson({ features: [{ id: 1 }], size: 1 })));
    const data = await fetchZone("world");
    expect(data.size).toBe(1);
    expect(data.features).toHaveLength(1);
  });
});
