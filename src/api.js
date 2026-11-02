const API = "https://www.refuges.info/api";
const IGN_WFS = "https://data.geopf.fr/wfs/ows";
const IGN_ROUTE_LIMIT = 3000;

const NB_POINTS_MAX = 500;

async function apiFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

export const fetchZone = (bbox, recentDays = 0, { signal } = {}) =>
  apiFetch(
    `${API}/bbox?bbox=${bbox}&format=geojson&detail=simple&nb_points=${NB_POINTS_MAX}&cache=300` +
      (recentDays > 0 ? `&depuis=-${recentDays * 86400}` : ""),
    { signal }
  );

export const fetchMassifPoints = (massifId, recentDays = 0, { signal } = {}) =>
  apiFetch(
    `${API}/massif?massif=${massifId}&format=geojson&detail=simple&nb_points=${NB_POINTS_MAX}&cache=300` +
      (recentDays > 0 ? `&depuis=-${recentDays * 86400}` : ""),
    { signal }
  );

// /api/point ne supporte QU'UN SEUL id (intval côté serveur) : limiter le fan-out.
const fetchPointsForIds = async (ids, detail, signal) => {
  const features = [];
  const concurrency = 6;
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((id) =>
        apiFetch(
          `${API}/point?id=${id}&format=geojson&detail=${detail}&nb_points=all&cache=300`,
          { signal }
        )
      )
    );
    for (const result of results) features.push(...(result.features || []));
  }
  return { features, size: features.length };
};

export const fetchPointsByIds = (ids, { signal } = {}) =>
  fetchPointsForIds(ids, "simple", signal);

export const fetchFiche = (id, { signal } = {}) =>
  apiFetch(`${API}/point?id=${id}&format=geojson&detail=fiche&format_texte=html`, { signal });

// Détail complet (inclut info_comp) pour un lot d'ids.
export const fetchPointsDetail = (ids, { signal } = {}) =>
  fetchPointsForIds(ids, "complet", signal);

export const fetchMassifs = ({ signal } = {}) =>
  apiFetch(`${API}/polygones?type_polygone=1&format=geojson&bbox=world`, { signal });

export const fetchIgnHikingRoutes = async (bbox, { signal } = {}) => {
  const coordinates = bbox.split(",").map(Number);
  if (coordinates.length !== 4 || !coordinates.every(Number.isFinite)) {
    throw new Error("Emprise de carte invalide");
  }
  const routeFilter = `<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:gml="http://www.opengis.net/gml/3.2">
    <fes:And>
      <fes:PropertyIsEqualTo>
        <fes:ValueReference>nature</fes:ValueReference>
        <fes:Literal>Itinéraire de randonnée pédestre</fes:Literal>
      </fes:PropertyIsEqualTo>
      <fes:BBOX>
        <fes:ValueReference>geometrie</fes:ValueReference>
        <gml:Envelope srsName="urn:ogc:def:crs:OGC::CRS84">
          <gml:lowerCorner>${coordinates[0]} ${coordinates[1]}</gml:lowerCorner>
          <gml:upperCorner>${coordinates[2]} ${coordinates[3]}</gml:upperCorner>
        </gml:Envelope>
      </fes:BBOX>
    </fes:And>
  </fes:Filter>`;
  const query = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: "2.0.0",
    REQUEST: "GetFeature",
    TYPENAMES: "BDTOPO_V3:itineraire_autre",
    OUTPUTFORMAT: "application/json",
    COUNT: String(IGN_ROUTE_LIMIT),
    FILTER: routeFilter,
  });
  const data = await apiFetch(`${IGN_WFS}?${query}`, { signal });
  const features = (data.features || []).filter(
    (feature) => feature.properties?.nature === "Itinéraire de randonnée pédestre"
  );
  const matched = Number(data.numberMatched ?? data.totalFeatures);
  return {
    features,
    truncated: Number.isFinite(matched) && matched > (data.features || []).length,
  };
};

// Base complète (détail simple : nom, type, altitude, état, places, lien) pour la
// recherche détaillée côté client (~3,8 Mo, chargée une fois et mise en cache session)
export const fetchAllPoints = () =>
  apiFetch(`${API}/bbox?bbox=world&format=geojson&detail=simple&nb_points=all&cache=300`);

// Base complète en détail complet (inclut info_comp) — ~20 Mo, chargée une seule fois
// en mémoire, uniquement si la recherche porte sur les équipements ou l'accès par clé.
// ATTENTION : ne PAS ajouter format_texte=html ici, le serveur renvoie HTTP 500.
export const fetchAllPointsDetail = () =>
  apiFetch(`${API}/bbox?bbox=world&format=geojson&detail=complet&nb_points=all&cache=300`);
