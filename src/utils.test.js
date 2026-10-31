import { describe, it, expect } from "vitest";
import { escapeHtml } from "./utils";

describe("escapeHtml", () => {
  it("échappe les caractères spéciaux HTML", () => {
    expect(escapeHtml(`<b>"&'x`)).toBe("&lt;b&gt;&quot;&amp;&#39;x");
  });

  it("convertit les non-string en string", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(null)).toBe("null");
  });
});
