import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { makeIcon } from "./MapView";

describe("styles des marqueurs (régression décalage au zoom)", () => {
  // Leaflet positionne les divIcon avec transform: translate3d + marges négatives.
  // Si .marker-wrap repasse en position:relative/static (règle CSS après leaflet.css),
  // les marqueurs retombent dans le flux du marker-pane et se décalent cumulativement.
  const css = readFileSync("src/styles.css", "utf8"); // cwd = racine projet sous vitest
  const rule = css.match(/\.marker-wrap\s*\{[^}]*\}/);
  it(".marker-wrap garde position:absolute", () => {
    expect(rule).toBeTruthy();
    expect(rule[0]).toMatch(/position:\s*absolute/);
  });
});

describe("makeIcon (marqueur carte)", () => {
  it("icône refuges.info au-dessus du label (colonne, pas de superposition)", () => {
    const f = { properties: { nom: "Cabane X", type: { id: 7, icone: "cabane_feu" } } };
    const opt = makeIcon(f).options;
    expect(opt.className).toBe("marker-wrap");
    expect(opt.html).toContain('class="marker-icon"');
    expect(opt.html).toContain("https://www.refuges.info/images/icones/cabane_feu.png");
    expect(opt.html).toContain("marker-label");
    expect(opt.html).toContain("Cabane X");
    // conteneur fixe 30x30 ancré au centre -> le point GPS est au centre de l'icône,
    // même si le label est plus large (il est en absolu, il ne élargit pas le conteneur)
    expect(opt.iconSize).toEqual([30, 30]);
    expect(opt.iconAnchor).toEqual([15, 15]);
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
