import { describe, it, expect } from "vitest";
import { BASEMAPS, HILLSHADE, IGN_HAS_KEY } from "./basemaps";

describe("basemaps", () => {
  it("OpenTopoMap est présent (fond par défaut)", () => {
    expect(BASEMAPS.topo).toBeDefined();
    expect(BASEMAPS.topo.url).toContain("opentopomap.org");
  });

  it("Plan IGN v2 est open data : URL sans clé, couche PLANIGNV2", () => {
    expect(BASEMAPS.planign.url).toContain("GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2");
    expect(BASEMAPS.planign.url).not.toContain("key=");
    expect(BASEMAPS.planign.url).toContain("{z}");
  });

  it("BDUNI J1 (fond vectoriel officiel) est open data sans clé", () => {
    expect(BASEMAPS.bduni.url).toContain("GEOGRAPHICALGRIDSYSTEMS.MAPS.BDUNI.J1");
    expect(BASEMAPS.bduni.url).not.toContain("key=");
    expect(BASEMAPS.bduni.url).toContain("data.geopf.fr/wmts"); // endpoint public
  });

  it("IGN Top 25 passe par private/wmts avec la clé (l'endpoint public renvoie 'Layer unknown')", () => {
    expect(BASEMAPS.ign.url).toContain("GEOGRAPHICALGRIDSYSTEMS.MAPS");
    expect(BASEMAPS.ign.url).toContain("private/wmts");
    expect(BASEMAPS.ign.url).toContain("key=");
    expect(BASEMAPS.ign.noKey).toBe(!IGN_HAS_KEY);
    expect(BASEMAPS.ign.label).toMatch(/Top 25/);
  });

  it("la couche 'pentes' est la couche officielle IGN SLOPES.MOUNTAIN, sans clé", () => {
    expect(HILLSHADE.url).toContain("GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN");
    expect(HILLSHADE.url).not.toContain("key=");
    expect(HILLSHADE.url).toContain("{z}");
    expect(HILLSHADE.opacity).toBeGreaterThan(0);
  });
});
