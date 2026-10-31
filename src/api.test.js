import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchZone,
  fetchMassifPoints,
  fetchPointsByIds,
  fetchFiche,
  fetchPointsDetail,
  fetchMassifs,
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

  it("fetchFiche demande detail=fiche + format_texte=html", async () => {
    await fetchFiche(583);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain("/api/point?id=583");
    expect(url).toContain("detail=fiche");
    expect(url).toContain("format_texte=html");
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
