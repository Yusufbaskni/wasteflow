import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { pathLatLngs } from "./kararDeneyi.js";

function along(latlngs, t) {
  if (!latlngs.length) return null;
  if (latlngs.length === 1) return latlngs[0];
  const segs = [];
  let total = 0;
  for (let i = 1; i < latlngs.length; i += 1) {
    const a = L.latLng(latlngs[i - 1]);
    const b = L.latLng(latlngs[i]);
    const d = a.distanceTo(b);
    segs.push({ a, b, d });
    total += d;
  }
  if (total <= 0) return latlngs[0];
  let remain = Math.max(0, Math.min(1, t)) * total;
  for (const s of segs) {
    if (remain <= s.d) {
      const u = s.d ? remain / s.d : 0;
      return [s.a.lat + (s.b.lat - s.a.lat) * u, s.a.lng + (s.b.lng - s.a.lng) * u];
    }
    remain -= s.d;
  }
  return latlngs[latlngs.length - 1];
}

export default function ExperimentMap({
  start,
  systemStops,
  humanStops,
  playing,
  revealed,
  selectedId,
  onSelectStop
}) {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const hostRef = useRef(null);
  const sysMarker = useRef(null);
  const humanMarker = useRef(null);
  const raf = useRef(0);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = L.map(hostRef.current, { zoomControl: true }).setView([41.04, 28.95], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 200);
    return () => {
      cancelAnimationFrame(raf.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map || !start || !humanStops?.length) return;
    layer.clearLayers();
    sysMarker.current = null;
    humanMarker.current = null;

    const humanPath = pathLatLngs(start, humanStops);
    const sysPath = revealed && systemStops?.length ? pathLatLngs(start, systemStops) : [];

    L.polyline(humanPath, { color: "#B42318", weight: 4, dashArray: "8 8", opacity: 0.85 }).addTo(layer);
    if (sysPath.length) {
      L.polyline(sysPath, { color: "#1B6B4A", weight: 5, opacity: 0.95 }).addTo(layer);
    }

    L.circleMarker([start.lat, start.lng], {
      radius: 9,
      color: "#0B2C5F",
      fillColor: "#0B2C5F",
      fillOpacity: 1
    }).bindTooltip(start.name || "Çıkış", { permanent: true, direction: "right", offset: [8, 0] }).addTo(layer);

    humanStops.forEach((s) => {
      const selected = selectedId === s.id;
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: selected ? 10 : 7,
        color: selected ? "#0B2C5F" : "#B42318",
        weight: selected ? 3 : 2,
        fillColor: selected ? "#C4A35A" : "#fff",
        fillOpacity: 1
      }).bindTooltip(`${s.order}. ${s.id} · tıklayınca bu lot`, { direction: "top" });
      marker.on("click", () => onSelectStop?.(s.id));
      marker.addTo(layer);
    });

    humanMarker.current = L.circleMarker(humanPath[0], {
      radius: 8,
      color: "#B42318",
      fillColor: "#B42318",
      fillOpacity: 1
    }).bindTooltip("Sizin turunuz", { direction: "top" }).addTo(layer);

    if (sysPath.length) {
      sysMarker.current = L.circleMarker(sysPath[0], {
        radius: 8,
        color: "#1B6B4A",
        fillColor: "#1B6B4A",
        fillOpacity: 1
      }).bindTooltip("Sistem turu", { direction: "top" }).addTo(layer);
    }

    const bounds = L.latLngBounds(sysPath.length ? [...humanPath, ...sysPath] : humanPath);
    map.fitBounds(bounds, { padding: [28, 28] });

    cancelAnimationFrame(raf.current);
    if (!playing) return undefined;
    const t0 = performance.now();
    const duration = 7200;
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const hPos = along(humanPath, t);
      if (hPos) humanMarker.current?.setLatLng(hPos);
      if (sysPath.length) {
        const sPos = along(sysPath, t);
        if (sPos) sysMarker.current?.setLatLng(sPos);
      }
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [start, systemStops, humanStops, playing, revealed, selectedId, onSelectStop]);

  return <div ref={hostRef} style={{ height: "100%", minHeight: 420, width: "100%", borderRadius: 6, overflow: "hidden" }} />;
}
