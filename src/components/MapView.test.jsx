import { describe, it, expect } from "vitest";
import { makeIcon } from "./MapView";

describe("makeIcon (marqueur carte)", () => {
  it("icône refuges.info au-dessus du label (colonne, pas de superposition)", () => {
    const f = { properties: { nom: "Cabane X", type: { id: 7, icone: "cabane_feu" } } };
    const opt = makeIcon(f).options;
    expect(opt.className).toBe("marker-wrap");
    expect(opt.html).toContain('class="marker-icon"');
    expect(opt.html).toContain("https://www.refuges.info/images/icones/cabane_feu.png");
    expect(opt.html).toContain("marker-label");
    expect(opt.html).toContain("Cabane X");
    // l'icône vient avant le label dans le HTML (flex column : icône puis texte)
    expect(opt.html.indexOf("marker-icon")).toBeLessThan(opt.html.indexOf("marker-label"));
  });

  it("fallback pastille colorée si pas d'icône de type", () => {
    const html = makeIcon({ properties: { nom: "X", type: { id: 999 } } }).options.html;
    expect(html).toContain('class="dot"');
    expect(html).not.toContain("marker-icon");
  });

  it("échappe le nom dans le label", () => {
    const html = makeIcon({ properties: { nom: "<b>X</b>" } }).options.html;
    expect(html).not.toContain("<b>X</b>");
    expect(html).toContain("&lt;b&gt;X&lt;/b&gt;");
  });
});
