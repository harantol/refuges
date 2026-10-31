import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchZone,
  fetchMassifPoints,
  fetchPointsByIds,
  fetchFiche,
  fetchMassifs,
  fetchAllPoints,
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

  it("fetchPointsByIds joint les ids avec des virgules", async () => {
    await fetchPointsByIds([1, 2, 583]);
    expect(fetch.mock.calls[0][0]).toContain("/api/point?id=1,2,583");
  });

  it("fetchFiche demande detail=fiche + format_texte=html", async () => {
    await fetchFiche(583);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain("/api/point?id=583");
    expect(url).toContain("detail=fiche");
    expect(url).toContain("format_texte=html");
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
