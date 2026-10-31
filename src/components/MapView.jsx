import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { pointColor, iconUrl } from "../types";
import { escapeHtml } from "../utils";
import { BASEMAPS, HILLSHADE } from "../basemaps";

function makeIcon(feature) {
  const color = pointColor(feature);
  const nom = escapeHtml(feature.properties?.nom || "");
  const icon = iconUrl(feature);
  // Icône refuges.info si disponible, sinon pastille colorée
  const picto = icon
    ? `<img class="marker-icon" src="${icon}" alt="" draggable="false" />`
    : `<span class="dot" style="background:${color}"></span>`;
  return L.divIcon({
    className: "",
    html: `${picto}<span class="marker-label" style="border-color:${color};color:${color}">${nom}</span>`,
    iconSize: icon ? [28, 28] : [16, 16],
    iconAnchor: icon ? [14, 26] : [8, 8],
  });
}

function MapEvents({ onNavigate }) {
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
    emit(); // chargement initial
    return () => {
      map.off("moveend", handler);
      clearTimeout(timer);
    };
  }, [map, onNavigate]);
  return null;
}

const userIcon = L.divIcon({
  className: "",
  html: '<span class="user-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FocusController({ focus, userPos }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.setView(focus, Math.max(map.getZoom(), 13));
  }, [focus, map]);
  useEffect(() => {
    if (userPos) map.setView(userPos, Math.max(map.getZoom(), 12));
  }, [userPos, map]);
  return null;
}

export default function MapView({ features, onSelect, onNavigate, focus, basemap, userPos, hillshade }) {
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
    <MapContainer center={[45.7, 6.4]} zoom={9} id="map">
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
      <MapEvents onNavigate={onNavigate} />
      <FocusController focus={focus} userPos={userPos} />
      <MarkerClusterGroup showCoverageOnHover={false}>
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
