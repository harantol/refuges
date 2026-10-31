// Clé API IGN (Géoportail) : variable d'env VITE_IGN_API_KEY au build,
// ou localStorage "ign-api-key" (à créer sur https://geoservices.ign.fr/).
const IGN_KEY =
  (typeof localStorage !== "undefined" && localStorage.getItem("ign-api-key")) ||
  import.meta.env.VITE_IGN_API_KEY ||
  "";

export const IGN_HAS_KEY = Boolean(IGN_KEY);

export const BASEMAPS = {
  // OpenTopoMap par défaut (relief, courbes de niveau)
  topo: {
    label: "Topo (OpenTopoMap)",
    url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      "&copy; OpenStreetMap, SRTM | &copy; <a href='https://opentopomap.org'>OpenTopoMap</a> (CC-BY-SA)",
    maxZoom: 17,
  },
  osm: {
    label: "Carte OSM",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
    maxZoom: 19,
  },
  satellite: {
    label: "Satellite (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  osmfr: {
    label: "OSM France (HOT)",
    url: "https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap, <a href='https://www.hotosm.org'>HOT</a>",
    maxZoom: 19,
  },
  // Plan IGN v2 : couche vectorielle officielle IGN en OPEN DATA -> aucune clé requise
  // (vérifié : HTTP 200, PNG 119 Ko sans clé sur data.geopf.fr, tuile Mont Blanc z14)
  planign: {
    label: "IGN Plan v2 (officiel, sans clé)",
    url: "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
    attribution: "&copy; <a href='https://geoservices.ign.fr/'>IGN</a> — Plan IGN v2 (open data)",
    maxZoom: 18,
  },
  // BDUNI J1 : fond de carte vectoriel officiel du portail IGN, open data sans clé
  // (vérifié : HTTP 200, PNG 8 Ko sans clé, tuile Mont Blanc z14)
  bduni: {
    label: "IGN BDUNI J1 (officiel, sans clé)",
    url: "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.BDUNI.J1&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
    attribution: "&copy; <a href='https://geoservices.ign.fr/'>IGN</a> — BDUNI J1 (open data)",
    maxZoom: 18,
  },
  // Top 25 raster (SCAN25) : sur la Géoplateforme elle n'est plus servie sur l'endpoint
  // public ("Layer unknown" sans clé) mais sur private/wmts avec une clé API (401 sinon)
  ign: {
    label: IGN_HAS_KEY ? "IGN Top 25 (clé)" : "IGN Top 25 (clé requise)",
    url: `https://data.geopf.fr/private/wmts?key=${IGN_KEY}&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`,
    attribution: "&copy; <a href='https://geoservices.ign.fr/'>IGN</a> — Géoportail Top 25",
    maxZoom: 18,
    noKey: !IGN_HAS_KEY,
  },
};

// Couche "pentes" : couche OFFICIELLE IGN "pentes montagne", open data sans clé
// (vérifié : HTTP 200, PNG 65 Ko sans clé, tuile Mont Blanc z14) — en overlay au-dessus du fond
export const HILLSHADE = {
  url: "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
  attribution: "&copy; <a href='https://geoservices.ign.fr/'>IGN</a> — Pentes montagne (open data)",
  maxZoom: 18,
  opacity: 0.55,
};
