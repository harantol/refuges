import { describe, it, expect } from "vitest";
import { iconUrl, DEFAULT_TYPE_ICONS, TYPE_LABELS } from "./types";

describe("iconUrl", () => {
  it("utilise l'icône précise fournie par l'API (type.icone)", () => {
    const f = { properties: { type: { id: 7, valeur: "cabane non gardée", icone: "cabane_feu" } } };
    expect(iconUrl(f)).toBe("https://www.refuges.info/images/icones/cabane_feu.png");
  });

  it("retombe sur l'icône par défaut du type si type.icone absent", () => {
    expect(iconUrl({ properties: { type: { id: 10 } } })).toBe(
      "https://www.refuges.info/images/icones/cabane_red.png"
    );
    expect(iconUrl({ properties: { type: { id: 23 } } })).toBe(
      "https://www.refuges.info/images/icones/pointdeau.png"
    );
  });

  it("retourne null si aucun type ni icône", () => {
    expect(iconUrl({ properties: {} })).toBeNull();
    expect(iconUrl(null)).toBeNull();
  });

  it("a une icône par défaut pour chaque type connu", () => {
    for (const id of Object.keys(TYPE_LABELS)) {
      expect(DEFAULT_TYPE_ICONS[id]).toBeTruthy();
    }
  });
});
