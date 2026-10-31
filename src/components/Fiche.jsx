import { pointColor } from "../types";
import { haversineKm } from "../geo";

export default function Fiche({ fiche, loading, userPos, favorites, onToggleFavorite }) {
  if (loading) return <div id="fiche-content"><p className="muted">Chargement de la fiche...</p></div>;
  if (!fiche) return <div id="fiche-content"><p className="muted">Cliquez sur un point de la carte pour voir sa fiche.</p></div>;
  if (fiche.error) return <div id="fiche-content"><p className="muted">Erreur : {fiche.error}</p></div>;

  const p = fiche.properties || {};
  const color = pointColor(fiche);
  const infoComp = Object.values(p.info_comp || {}).filter((i) => i && i.valeur != null && i.valeur !== "");

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
      {p.acces?.valeur && (<><h3>Accès</h3><div className="text">{p.acces.valeur}</div></>)}
      {p.remarque?.valeur && (<><h3>Remarques</h3><div className="text">{p.remarque.valeur}</div></>)}
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
      {fiche.comments?.length > 0 && (
        <>
          <h3>Commentaires</h3>
          {fiche.comments.map((c, idx) => (
            <div className="comment" key={idx}>
              <div className="c-head">{c.date || ""} — {c.auteur || "?"}</div>
              <div className="text">{c.texte || ""}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
