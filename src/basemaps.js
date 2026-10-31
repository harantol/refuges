export const BASEMAPS = {
  osm: {
    label: "Carte OSM",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
    maxZoom: 19,
  },
  topo: {
    label: "Topo (OpenTopoMap)",
    url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      "&copy; OpenStreetMap, SRTM | &copy; <a href='https://opentopomap.org'>OpenTopoMap</a> (CC-BY-SA)",
    maxZoom: 17,
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
};
