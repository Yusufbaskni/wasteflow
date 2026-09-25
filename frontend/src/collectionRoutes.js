function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

const START = { lat: 41.0186, lng: 28.9319, name: "FAC-01 Topkapı çıkış" };

function nearestNeighbor(start, points) {
  const remaining = [...points];
  const stops = [];
  let cur = start;
  let km = 0;
  while (remaining.length) {
    let bestI = 0;
    let bestD = Infinity;
    remaining.forEach((p, i) => {
      const d = haversine(cur, p);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    });
    const next = remaining.splice(bestI, 1)[0];
    km += bestD;
    stops.push({ ...next, order: stops.length + 1, legKm: Math.round(bestD * 10) / 10 });
    cur = next;
  }
  km += haversine(cur, start);
  return { stops, km: Math.round(km * 10) / 10 };
}

export function planDailyRoutes(points, materials = []) {
  let pool = materials.length
    ? points.filter((p) => materials.includes(p.material))
    : points.filter((p) => Number(p.fill) >= 62);
  if (pool.length < 4) {
    pool = [...points].sort((a, b) => Number(b.fill) - Number(a.fill)).slice(0, 12);
  }
  const sortedLng = pool.map((p) => p.lng).sort((a, b) => a - b);
  const mid = sortedLng[Math.floor(sortedLng.length / 2)] ?? 28.9;
  const west = pool.filter((p) => p.lng <= mid);
  const east = pool.filter((p) => p.lng > mid);
  const left = west.length ? west : pool.slice(0, Math.ceil(pool.length / 2));
  const right = east.length ? east : pool.slice(Math.ceil(pool.length / 2));
  return [
    { id: "ARAÇ-1", name: "Batı hattı", depot: START.name, ...nearestNeighbor(START, left) },
    { id: "ARAÇ-2", name: "Doğu hattı", depot: START.name, ...nearestNeighbor(START, right) }
  ];
}
