import { useCallback, useEffect } from "react";
import { absUrl } from "./Fiche";
import SafeHtml from "./SafeHtml";
import { commentDate } from "../utils";

// Diaporama photo en overlay par-dessus la page.
// Navigation : boutons ‹ ›, clic sur le fond, ou clavier (Échap / ← / →).
export default function Lightbox({ photos, index, onClose, onIndexChange }) {
  const count = photos.length;
  const go = useCallback(
    (dir) => onIndexChange((index + dir + count) % count),
    [index, count, onIndexChange]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // bloque le scroll de la page derrière
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  const c = photos[index];
  if (!c) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Diaporama photo">
      <button className="lightbox-close" onClick={onClose} aria-label="Fermer le diaporama">✕</button>
      {count > 1 && (
        <>
          <button
            className="lightbox-nav prev"
            aria-label="Photo précédente"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
          >‹</button>
          <button
            className="lightbox-nav next"
            aria-label="Photo suivante"
            onClick={(e) => { e.stopPropagation(); go(1); }}
          >›</button>
        </>
      )}
      <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
        <img className="lightbox-img" src={absUrl(c.photo)} alt={`Photo ${index + 1} sur ${count}`} />
        <figcaption>
          <span className="lightbox-meta">
            <b>{c.auteur || "contributeur"}</b>
            {commentDate(c) && ` · ${commentDate(c)}`}
            {` — ${index + 1}/${count}`}
          </span>
          {c.texte ? <SafeHtml className="lightbox-caption" html={c.texte} /> : null}
        </figcaption>
      </figure>
    </div>
  );
}
