import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SafeHtml from "./SafeHtml";

describe("SafeHtml", () => {
  it("rend le HTML autorisé (b, br, a)", () => {
    const { container } = render(<SafeHtml html={"<b>gras</b><br>ligne <a href='https://x'>lien</a>"} />);
    expect(container.querySelector("b")?.textContent).toBe("gras");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://x");
    expect(container.querySelector("br")).not.toBeNull();
  });

  it("neutralise le contenu dangereux (script, onerror)", () => {
    const { container } = render(
      <SafeHtml html={"<script>alert(1)</script><img src=x onerror=alert(1)><b>ok</b>"} />
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("onerror")).toBeNull();
    expect(container.querySelector("b")?.textContent).toBe("ok");
  });

  it("gère une valeur nulle", () => {
    const { container } = render(<SafeHtml html={null} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
