import { useState } from "react";
import { pointColor } from "../types";
import { haversineKm } from "../geo";
import SafeHtml from "./SafeHtml";
import Lightbox from "./Lightbox";
import { commentDate } from "../utils";

const API_ORIGIN = "https://www.refuges.info";

export const absUrl = (path) =>
  !path ? "" : path.startsWith("http") ? path : API_ORIGIN + path;

export default function Fiche({ fiche, loading, userPos, favorites, onToggleFavorite }) {
  if (loading) return <div id="fiche-content"><p className="muted">Chargement de la fiche...</p></div>;
  if (!fiche) return <div id="fiche-content"><p className="muted">Cliquez sur un point de la carte pour voir sa fiche.</p></div>;
  if (fiche.error) return <div id="fiche-content"><p className="muted">Erreur : {fiche.error}</p></div>;

  const p = fiche.properties || {};
  const color = pointColor(fiche);
  const infoComp = Object.values(p.info_comp || {}).filter((i) => i && i.valeur != null && i.valeur !== "");
  const commentaires = p.commentaires || [];
  const photos = commentaires.filter((c) => c.photo);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  let distTxt = "";
  if (userPos != null && p.coord?.lat != null && p.coord?.long != null) {
    const d = haversineKm(userPos, [p.coord.lat, p.coord.long]);
    const km = d < 10 ? d.toFixed(1) : String(Math.round(d));
    distTxt = ` · ${km} km de vous`;
  }

  return (
    <div id="fiche-content">
      <span className="badge" style={{ background: color }}>{p.type?.valeur || ""}</span>
      <button
        className={favorites?.has(fiche.id) ? "fav-btn on big" : "fav-btn big"}
        title={favorites?.has(fiche.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
        onClick={() => onToggleFavorite(fiche.id)}
      >
        {favorites?.has(fiche.id) ? "★" : "☆"}
      </button>
      <h2>{p.nom || "(sans nom)"}</h2>
      {p.coord && (
        <p className="kv">
          <b>Altitude :</b> {p.coord.alt != null ? p.coord.alt + " m" : "?"} · <b>Lat</b> {p.coord.lat}, <b>Long</b>{" "}
          {p.coord.long}
          {distTxt}
        </p>
      )}
      {p.etat?.valeur && <p className="kv"><b>État :</b> {p.etat.valeur}</p>}
      {p.places?.valeur != null && <p className="kv"><b>Places :</b> {p.places.valeur}</p>}
      {p.proprio?.valeur && <p className="kv"><b>{p.proprio.nom} :</b> {p.proprio.valeur}</p>}

      {photos.length > 0 && (
        <>
          <h3>Photos ({photos.length})</h3>
          <div className="photo-gallery">
            {photos.map((c, i) => (
              <button
                key={c.id}
                className="thumb"
                onClick={() => setLightboxIndex(i)}
                title={`Photo de ${c.auteur || "contributeur"}${commentDate(c) ? `, le ${commentDate(c)}` : ""}`}
              >
                <img src={absUrl(c.photo)} alt={`${p.nom || "point"} — photo ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
      {lightboxIndex != null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      {p.acces?.valeur && (<><h3>Accès</h3><SafeHtml className="text" html={p.acces.valeur} /></>)}
      {p.remarque?.valeur && (<><h3>Remarques</h3><SafeHtml className="text" html={p.remarque.valeur} /></>)}
      {infoComp.length > 0 && (
        <>
          <h3>Équipements</h3>
          {infoComp.map((i, idx) => (
            <p className="kv" key={idx}><b>{i.nom} :</b> {String(i.valeur)}</p>
          ))}
        </>
      )}
      {p.date && (
        <>
          <h3>Dates</h3>
          <p className="kv">Création : {p.date.creation || "?"} · Modifié : {p.date.derniere_modif || "?"}</p>
        </>
      )}
      {p.lien && (
        <p>
          <a href={p.lien} target="_blank" rel="noopener">Fiche complète sur refuges.info &#8599;</a>
        </p>
      )}
      {commentaires.length > 0 && (
        <>
          <h3>Commentaires ({commentaires.length})</h3>
          {commentaires.map((c) => (
            <div className="comment" key={c.id}>
              <div className="c-head">{c.date || ""} — {c.auteur || "?"}</div>
              {c.texte ? <SafeHtml className="text" html={c.texte} /> : null}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
