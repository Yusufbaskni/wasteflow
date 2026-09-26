const OSRM_BASES = [
  "https://router.project-osrm.org",
  "https://routing.openstreetmap.de/routed-car"
];

const cache = new Map();

function routeKey(from, to) {
  return `${from.lat.toFixed(4)},${from.lng.toFixed(4)}>${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
}

export function haversineKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return 0;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function pathLengthKm(pts = []) {
  let km = 0;
  for (let i = 1; i < pts.length; i += 1) km += haversineKm(pts[i - 1], pts[i]);
  return Math.round(km * 10) / 10;
}

function parseOsrm(data) {
  const coords = data?.routes?.[0]?.geometry?.coordinates;
  if (!coords?.length) throw new Error("empty-route");
  return coords.map(([lng, lat]) => ({ lat, lng }));
}

async function fetchOsrmHttp(from, to) {
  const qs = `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  if (window.wasteflowDesktop?.fetchRoute) {
    const data = await window.wasteflowDesktop.fetchRoute(from, to);
    return parseOsrm(data);
  }
  let lastErr = null;
  for (const base of OSRM_BASES) {
    try {
      const res = await fetch(`${base}/route/v1/driving/${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      return parseOsrm(await res.json());
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("route-failed");
}

export async function fetchDrivingPath(from, to) {
  const key = routeKey(from, to);
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = fetchOsrmHttp(from, to);
  cache.set(key, pending);
  try {
    const pts = await pending;
    cache.set(key, pts);
    return pts;
  } catch (err) {
    cache.delete(key);
    throw err;
  }
}

export function pointAlongPath(pts, km) {
  if (!pts?.length) return null;
  if (pts.length === 1 || km <= 0) {
    return { lat: pts[0].lat, lng: pts[0].lng, heading: 0, done: false };
  }
  let left = km;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const d = haversineKm(a, b) || 1e-9;
    if (left > d && i < pts.length - 2) {
      left -= d;
      continue;
    }
    const t = Math.min(1, left / d);
    return {
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
      heading: (Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180) / Math.PI,
      done: i === pts.length - 2 && left >= d * 0.98
    };
  }
  const last = pts[pts.length - 1];
  return { lat: last.lat, lng: last.lng, heading: 0, done: true };
}
