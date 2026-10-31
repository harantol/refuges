const API = "https://www.refuges.info/api";

const NB_POINTS_MAX = 500;

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

export const fetchZone = (bbox, recentDays = 0) =>
  apiFetch(
    `${API}/bbox?bbox=${bbox}&format=geojson&detail=simple&nb_points=${NB_POINTS_MAX}&cache=300` +
      (recentDays > 0 ? `&depuis=-${recentDays * 86400}` : "")
  );

export const fetchMassifPoints = (massifId, recentDays = 0) =>
  apiFetch(
    `${API}/massif?massif=${massifId}&format=geojson&detail=simple&nb_points=${NB_POINTS_MAX}&cache=300` +
      (recentDays > 0 ? `&depuis=-${recentDays * 86400}` : "")
  );

export const fetchPointsByIds = (ids) =>
  apiFetch(`${API}/point?id=${ids.join(",")}&format=geojson&detail=simple&nb_points=all&cache=300`);

export const fetchFiche = (id) =>
  apiFetch(`${API}/point?id=${id}&format=geojson&detail=fiche&format_texte=html`);

// Détail complet (inclut info_comp) pour un lot d'ids — utilisé par la recherche
// détaillée sur équipements, par paquets pour rester raisonnable.
export const fetchPointsDetail = (ids) =>
  apiFetch(
    `${API}/point?id=${ids.join(",")}&format=geojson&detail=complet&format_texte=html&nb_points=all&cache=300`
  );

export const fetchMassifs = () =>
  apiFetch(`${API}/polygones?type_polygone=1&format=geojson&bbox=world`);

// Base complète (détail simple : nom, type, altitude, état, places, lien) pour la
// recherche détaillée côté client (~3,8 Mo, chargée une fois et mise en cache session)
export const fetchAllPoints = () =>
  apiFetch(`${API}/bbox?bbox=world&format=geojson&detail=simple&nb_points=all&cache=300`);

// Base complète en détail complet (inclut info_comp) — ~20 Mo, chargée une seule fois
// en mémoire, uniquement si la recherche porte sur les équipements
export const fetchAllPointsDetail = () =>
  apiFetch(`${API}/bbox?bbox=world&format=geojson&detail=complet&format_texte=html&nb_points=all&cache=300`);
