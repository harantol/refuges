import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { pointColor, iconUrl } from "../types";
import { escapeHtml } from "../utils";
import { BASEMAPS, HILLSHADE } from "../basemaps";

export function makeIcon(feature) {
  const color = pointColor(feature);
  const nom = escapeHtml(feature.properties?.nom || "");
  const icon = iconUrl(feature);
  // Icône refuges.info si disponible, sinon pastille colorée.
  // Le label est EN-DESSOUS de l'icône (colonne flex) pour ne pas la recouvrir.
  const picto = icon
    ? `<img class="marker-icon" src="${icon}" alt="" draggable="false" />`
    : `<span class="dot" style="background:${color}"></span>`;
  return L.divIcon({
    className: "marker-wrap",
    html: `<span data-pid="${feature.id}" style="display:contents">${picto}<span class="marker-label" style="border-color:${color};color:${color}">${nom}</span></span>`,
    iconSize: [30, 30], // conteneur fixe = taille de l'icône, le label dépasse en dessous
    iconAnchor: [15, 15], // ancré pile au centre du point GPS
  });
}

function MapEvents({ onNavigate, onCloseMenus }) {
  const map = useMap();
  useEffect(() => {
    let timer = null;
    const emit = () => {
      const b = map.getBounds();
      onNavigate([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((v) => v.toFixed(4)).join(","));
    };
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(emit, 400);
    };
    map.on("moveend", handler);
    // clic sur la carte (hors marqueurs) -> ferme les menus flottants
    if (onCloseMenus) map.on("click", onCloseMenus);
    emit(); // chargement initial
    return () => {
      map.off("moveend", handler);
      if (onCloseMenus) map.off("click", onCloseMenus);
      clearTimeout(timer);
    };
  }, [map, onNavigate, onCloseMenus]);
  return null;
}

const userIcon = L.divIcon({
  className: "",
  html: '<span class="user-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Centre la carte sur l'emprise des features quand fitToFeatures est activé (ex: recherche par massif)
function BoundsController({ features, fitToFeatures }) {
  const map = useMap();
  useEffect(() => {
    if (!fitToFeatures || features.length === 0) return;
    try {
      const bounds = L.latLngBounds(features.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]]));
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });
    } catch {
      /* coordonnées invalides */
    }
  }, [features, fitToFeatures, map]);
  return null;
}

// Décalage vertical (px) à appliquer au centre de la carte en mobile pour que le point
// cliqué apparaisse au milieu de la zone visible (haut de la carte -> haut du panneau).
// offset > 0 = le centre part vers le sud = le point monte à l'écran.
export function mobileFocusOffsetPx(mapHeight, panelHeight) {
  const visibleBottom = Math.max(60, mapHeight - panelHeight); // zone visible min 60px
  return mapHeight / 2 - visibleBottom / 2;
}

function FocusController({ focus, userPos }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    const zoom = Math.max(map.getZoom(), 14); // zoom 14 = marqueurs déclusterisés (icônes visibles)
    // Sur mobile, le panneau du bas (fiche = 78%, liste = 55% de la hauteur) recouvre la carte :
    // on décale le centre vers le sud pour que le point cliqué apparaisse DANS la zone visible
    // (entre le haut de la carte et le panneau), et non derrière le panneau.
    const isMobile = typeof window.matchMedia === "function" && window.matchMedia("(max-width: 800px)").matches;
    if (isMobile) {
      const size = map.getSize();
      const sidebar = document.getElementById("sidebar");
      let sideH = 48; // panneau replié (juste les onglets)
      if (sidebar?.classList.contains("fiche-open")) sideH = Math.round(size.y * 0.78);
      else if (sidebar?.classList.contains("open")) sideH = Math.round(size.y * 0.55);
      const offset = mobileFocusOffsetPx(size.y, sideH); // > 0 : le point monte à l'écran
      // calcul en projection au zoom cible (un panBy en px dépendrait du zoom courant)
      const center = map.unproject(map.project(focus, zoom).add([0, offset]), zoom);
      map.setView(center, zoom);
    } else {
      map.setView(focus, zoom);
    }
  }, [focus, map]);
  useEffect(() => {
    if (userPos) map.setView(userPos, Math.max(map.getZoom(), 12));
  }, [userPos, map]);
  return null;
}

export default function MapView({ features, onSelect, onNavigate, onCloseMenus, focus, basemap, userPos, hillshade, fitToFeatures }) {
  const base = BASEMAPS[basemap] || BASEMAPS.topo;
  const markers = useMemo(
    () =>
      features.map((f) => ({
        id: f.id,
        position: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
        icon: makeIcon(f),
      })),
    [features]
  );

  return (
    <MapContainer center={[45.7, 6.4]} zoom={9} id="map" zoomControl={false} ref={(m) => { if (m) window.__map = m; }}>
      <TileLayer
        key={basemap}
        url={base.url}
        maxZoom={base.maxZoom}
        attribution={base.attribution}
      />
      {hillshade && (
        <TileLayer
          key="hillshade"
          url={HILLSHADE.url}
          maxZoom={HILLSHADE.maxZoom}
          opacity={HILLSHADE.opacity}
          attribution={HILLSHADE.attribution}
          pane="overlayPane"
        />
      )}
      <MapEvents onNavigate={onNavigate} onCloseMenus={onCloseMenus} />
      <BoundsController features={features} fitToFeatures={fitToFeatures} />
      <FocusController focus={focus} userPos={userPos} />
      <MarkerClusterGroup showCoverageOnHover={false} disableClusteringAtZoom={14}>
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={m.position}
            icon={m.icon}
            eventHandlers={{ click: () => onSelect(m.id) }}
          />
        ))}
      </MarkerClusterGroup>
      {userPos && <Marker position={userPos} icon={userIcon} zIndexOffset={1000} />}
    </MapContainer>
  );
}
