import { describe, it, expect } from "vitest";
import { escapeHtml, formatDateFr, commentDate } from "./utils";

describe("escapeHtml", () => {
  it("échappe les caractères spéciaux HTML", () => {
    expect(escapeHtml(`<b>"&'x`)).toBe("&lt;b&gt;&quot;&amp;&#39;x");
  });

  it("convertit les non-string en string", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(null)).toBe("null");
  });
});

describe("formatDateFr", () => {
  it("reformate AAAA-MM-JJ en JJ/MM/AAAA", () => {
    expect(formatDateFr("2026-03-31")).toBe("31/03/2026");
  });

  it("convertit un timestamp unix (secondes)", () => {
    expect(formatDateFr(1774968979)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("retourne une chaîne vide pour une valeur vide", () => {
    expect(formatDateFr("")).toBe("");
    expect(formatDateFr(null)).toBe("");
  });
});

describe("commentDate", () => {
  it("préfère le champ date_photo", () => {
    expect(commentDate({ date_photo: "2026-03-31", date: 1774968979 })).toBe("31/03/2026");
  });

  it("utilise le champ date (timestamp unix)", () => {
    expect(commentDate({ date: 1774968979 })).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("extrait le timestamp de l'URL de la photo en dernier recours", () => {
    expect(commentDate({ photo: "/photos_points/1-originale.jpeg?1793461591" })).toMatch(
      /^\d{2}\/\d{2}\/\d{4}$/
    );
  });

  it("retourne une chaîne vide si rien n'est disponible", () => {
    expect(commentDate({})).toBe("");
    expect(commentDate(null)).toBe("");
  });
});
