import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BUYERS } from "./sales.js";

export default function FleetMap({ vehicles, selectedId, onSelect }) {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const hostRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = L.map(hostRef.current, { zoomControl: true }).setView([41.04, 28.95], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 250);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    vehicles.forEach((v) => {
      const selected = selectedId === v.id;
      const destColor = v.destId === "BASER" ? "#1B6B4A" : v.destId === "STAR" ? "#1E5A9C" : v.destId ? "#C4A35A" : "#6B7280";
      const marker = L.circleMarker([v.lat, v.lng], {
        radius: selected ? 11 : 8,
        color: selected ? "#0B2C5F" : destColor,
        weight: 2,
        fillColor: destColor,
        fillOpacity: 0.92
      });
      marker.bindTooltip(`${v.plate} · ${v.brand} ${v.model} · ${v.driver}`, { direction: "top" });
      marker.on("click", () => onSelect?.(v.id));
      marker.addTo(layer);
      if (v.destLat && v.destLng) {
        const line = (v.routePath?.length
          ? v.routePath.map((p) => [p.lat, p.lng])
          : [[v.lat, v.lng], [v.destLat, v.destLng]]);
        L.polyline(line, {
          color: destColor,
          weight: selected ? 4 : 3,
          dashArray: v.routePath?.length ? undefined : "4 6",
          opacity: 0.85
        }).addTo(layer);
      }
    });
    BUYERS.forEach((b) => {
      L.circleMarker([b.lat, b.lng], {
        radius: 10,
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
  }, [vehicles, selectedId, onSelect]);

  return <div ref={hostRef} style={{ height: "100%", minHeight: 420, width: "100%", borderRadius: 6, overflow: "hidden" }} />;
}
