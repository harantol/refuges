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

export const fetchMassifs = () =>
  apiFetch(`${API}/polygones?type_polygone=1&format=geojson&bbox=world`);

// Base complète (détail icone) pour la recherche par nom côté client (~1,6 Mo)
export const fetchAllPoints = () =>
  apiFetch(`${API}/bbox?bbox=world&format=geojson&detail=icone&nb_points=all&cache=300`);
