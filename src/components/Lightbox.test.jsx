import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Lightbox from "./Lightbox";

const photos = [
  { id: 1, photo: "/photos_points/1.jpeg", auteur: "Alice", date: "2024-01-01" },
  { id: 2, photo: "/photos_points/2.jpeg", auteur: "Bob", date: "2024-02-02" },
  { id: 3, photo: "/photos_points/3.jpeg", auteur: "Chloe", date: "2024-03-03" },
];

const renderLightbox = (props = {}) =>
  render(
    <Lightbox photos={photos} index={0} onClose={() => {}} onIndexChange={() => {}} {...props} />
  );

describe("Lightbox (diaporama)", () => {
  it("affiche la photo à l'index donné avec compteur et légende", () => {
    renderLightbox({ index: 1 });
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("https://www.refuges.info/photos_points/2.jpeg");
    expect(screen.getByText(/Bob · 2024-02-02 — 2\/3/)).toBeInTheDocument();
  });

  it("les flèches appellent onIndexChange avec wrap-around", () => {
    const onIndexChange = vi.fn();
    const { rerender } = render(
      <Lightbox photos={photos} index={0} onClose={() => {}} onIndexChange={onIndexChange} />
    );
    fireEvent.click(screen.getByLabelText("Photo suivante"));
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    rerender(<Lightbox photos={photos} index={2} onClose={() => {}} onIndexChange={onIndexChange} />);
    fireEvent.click(screen.getByLabelText("Photo suivante"));
    expect(onIndexChange).toHaveBeenLastCalledWith(0); // wrap
    fireEvent.click(screen.getByLabelText("Photo précédente"));
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    rerender(<Lightbox photos={photos} index={0} onClose={() => {}} onIndexChange={onIndexChange} />);
    fireEvent.click(screen.getByLabelText("Photo précédente"));
    expect(onIndexChange).toHaveBeenLastCalledWith(2); // wrap arrière
  });

  it("Échap ferme, ← → naviguent au clavier", () => {
    const onClose = vi.fn();
    const onIndexChange = vi.fn();
    renderLightbox({ index: 1, onClose, onIndexChange });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(onIndexChange).toHaveBeenCalledWith(2);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("clic sur le fond ferme, clic sur l'image ne ferme pas", () => {
    const onClose = vi.fn();
    renderLightbox({ onClose });
    fireEvent.click(screen.getByRole("img"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });

  it("bloque le scroll du body pendant l'affichage et le restaure", () => {
    const { unmount } = renderLightbox();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("masque les flèches s'il n'y a qu'une seule photo", () => {
    render(<Lightbox photos={[photos[0]]} index={0} onClose={() => {}} onIndexChange={() => {}} />);
    expect(screen.queryByLabelText("Photo suivante")).toBeNull();
    expect(screen.queryByLabelText("Photo précédente")).toBeNull();
  });
});
