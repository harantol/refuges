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

  it("IGN Top 25 embarque la clé quand présente, sinon marqué noKey", () => {
    expect(BASEMAPS.ign.url).toContain("GEOGRAPHICALGRIDSYSTEMS.MAPS");
    expect(BASEMAPS.ign.url).toContain("key=");
    expect(BASEMAPS.ign.noKey).toBe(!IGN_HAS_KEY);
    expect(BASEMAPS.ign.label).toMatch(/Top 25/);
  });

  it("hillshade Esri configuré", () => {
    expect(HILLSHADE.url).toContain("World_Hillshade");
    expect(HILLSHADE.url).toContain("{z}/{y}/{x}");
    expect(HILLSHADE.opacity).toBeGreaterThan(0);
  });
});
