import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEPOTS, fillForDepot, pinColor } from "./depots.js";
import { COLLECTION_POINTS } from "./collectionPoints.js";
import { BUYERS } from "./sales.js";

export default function DepotMap({
  bins,
  selectedId,
  onSelect,
  collectionPoints = COLLECTION_POINTS,
  selectedCollectionId,
  onSelectCollection
}) {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const hostRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = L.map(hostRef.current, { zoomControl: true, attributionControl: true }).setView([41.04, 28.95], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 200);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    DEPOTS.forEach((depot) => {
      const fill = fillForDepot(depot, bins);
      const marker = L.circleMarker([depot.lat, depot.lng], {
        radius: selectedId === depot.id ? 14 : 10,
        color: "#0B2C5F",
        weight: 2,
        fillColor: pinColor(fill),
        fillOpacity: 0.92
      });
      marker.bindTooltip(`Depo · ${depot.id} ${depot.name} · %${fill}`, {
        permanent: true,
        direction: "right",
        offset: [12, 0],
        className: "map-pin-label"
      });
      marker.on("click", () => onSelect?.(depot));
      marker.addTo(layer);
    });
    collectionPoints.forEach((point) => {
      const selected = selectedCollectionId === point.id;
      const fill = Number(point.fill ?? 50);
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: selected ? 9 : 6,
        color: selected ? "#0B2C5F" : "#4A6FA5",
        weight: selected ? 2 : 1,
        fillColor: pinColor(fill),
        fillOpacity: 0.9
      });
      marker.bindTooltip(`${point.id} · ${point.material} · ${point.name} · %${fill}`, { direction: "top" });
      marker.on("click", () => onSelectCollection?.(point));
      marker.addTo(layer);
    });
    BUYERS.forEach((b) => {
      L.circleMarker([b.lat, b.lng], {
        radius: 11,
        color: b.color,
        weight: 2,
        fillColor: b.color,
        fillOpacity: 0.9
      }).bindTooltip(`Alıcı · ${b.name} · ${b.district}`, {
        permanent: true,
        direction: "right",
        offset: [12, 0],
        className: "map-pin-label"
      }).addTo(layer);
    });
  }, [bins, selectedId, onSelect, collectionPoints, selectedCollectionId, onSelectCollection]);

  return <div ref={hostRef} style={{ height: "100%", minHeight: 420, width: "100%", borderRadius: 6, overflow: "hidden" }} />;
}
