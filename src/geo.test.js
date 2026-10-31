import { describe, it, expect } from "vitest";
import { haversineKm } from "./geo";

describe("haversineKm", () => {
  it("retourne 0 pour un même point", () => {
    expect(haversineKm([45.7, 6.4], [45.7, 6.4])).toBeCloseTo(0, 5);
  });

  it("calcule une distance connue (Paris -> Lyon ≈ 392 km)", () => {
    const d = haversineKm([48.8566, 2.3522], [45.764, 4.8357]);
    expect(d).toBeGreaterThan(390);
    expect(d).toBeLessThan(400);
  });

  it("est symétrique", () => {
    const a = [45.0, 6.0];
    const b = [46.0, 7.0];
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });
});
