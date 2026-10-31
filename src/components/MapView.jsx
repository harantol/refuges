import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { pointColor } from "../types";
import { escapeHtml } from "../utils";
import { BASEMAPS } from "../basemaps";

function makeIcon(feature) {
  const color = pointColor(feature);
  const nom = escapeHtml(feature.properties?.nom || "");
  return L.divIcon({
    className: "",
    html: `<span class="dot" style="background:${color}"></span><span class="marker-label" style="border-color:${color};color:${color}">${nom}</span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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

function FocusController({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.setView(focus, Math.max(map.getZoom(), 13));
  }, [focus, map]);
  return null;
}

export default function MapView({ features, onSelect, onNavigate, focus, basemap }) {
  const base = BASEMAPS[basemap] || BASEMAPS.osm;
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
      <MapEvents onNavigate={onNavigate} />
      <FocusController focus={focus} />
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
    </MapContainer>
  );
}
