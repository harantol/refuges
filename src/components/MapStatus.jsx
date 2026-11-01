// Indicateur d'activité flottant SUR la carte :
// - chargement en cours -> spinner dans le coin haut-gauche de la carte
// - message info/erreur -> toast discret en haut au centre (auto-dismiss côté App)
// Rien dans l'entête : un texte de statut y faisait varier la hauteur et décalait la carte (mobile).
export default function MapStatus({ loading, status }) {
  return (
    <>
      {loading && (
        <div id="map-loading" role="status" aria-label="Chargement en cours">
          <span className="spinner" aria-hidden="true" />
        </div>
      )}
      {!loading && status ? (
        <div id="map-toast" role="status">
          {status}
        </div>
      ) : null}
    </>
  );
}
