import { COLLECTION_POINTS } from "./collectionPoints.js";
import { DEPOTS } from "./depots.js";
import { BASER, STAR, BUYERS } from "./sales.js";

export const FLEET_DESTINATIONS = [
  ...BUYERS.map((b) => ({ id: b.id, label: `Satış · ${b.name} (${b.district})`, lat: b.lat, lng: b.lng })),
  ...DEPOTS.map((d) => ({ id: d.id, label: `Depo ${d.id} ${d.name}`, lat: d.lat, lng: d.lng })),
  ...COLLECTION_POINTS.map((p) => ({ id: p.id, label: `${p.id} ${p.name}`, lat: p.lat, lng: p.lng }))
];

const OUTBOUND = { "AR-10": BASER.id, "AR-11": BASER.id, "AR-13": BASER.id, "AR-12": STAR.id, "AR-15": STAR.id };

export const INITIAL_FLEET = [
  { id: "AR-01", plate: "34 WF 101", brand: "Ford", model: "Transit 350", driver: "Ahmet Yıldız", phone: "905321112001", lat: 41.021, lng: 28.935, heading: 40 },
  { id: "AR-02", plate: "34 WF 102", brand: "Fiat", model: "Ducato 2.3", driver: "Mehmet Kaya", phone: "905321112002", lat: 40.995, lng: 28.905, heading: 120 },
  { id: "AR-03", plate: "34 WF 103", brand: "Mercedes-Benz", model: "Sprinter 317", driver: "Ayşe Demir", phone: "905321112003", lat: 41.004, lng: 28.861, heading: 200 },
  { id: "AR-04", plate: "34 ISU 104", brand: "Volkswagen", model: "Crafter 35", driver: "Can Özkan", phone: "905321112004", lat: 41.118, lng: 29.048, heading: 310 },
  { id: "AR-05", plate: "34 WF 105", brand: "Iveco", model: "Daily 70C", driver: "Elif Şahin", phone: "905321112005", lat: 41.016, lng: 28.778, heading: 75 },
  { id: "AR-06", plate: "34 WF 106", brand: "Ford", model: "Custom 320", driver: "Burak Aydın", phone: "905321112006", lat: 41.046, lng: 28.899, heading: 15 },
  { id: "AR-07", plate: "34 WF 107", brand: "Peugeot", model: "Boxer L3", driver: "Zeynep Arslan", phone: "905321112007", lat: 41.037, lng: 28.891, heading: 260 },
  { id: "AR-08", plate: "34 WF 108", brand: "Renault", model: "Master L2H2", driver: "Hakan Çelik", phone: "905321112008", lat: 41.067, lng: 28.988, heading: 180 },
  { id: "AR-09", plate: "34 WF 109", brand: "Citroën", model: "Jumper 35", driver: "Selin Koç", phone: "905321112009", lat: 41.081, lng: 29.012, heading: 95 },
  { id: "AR-10", plate: "34 WF 110", brand: "Mercedes-Benz", model: "Atego 818", driver: "Okan Yılmaz", phone: "905321112010", lat: 41.079, lng: 28.945, heading: 150 },
  { id: "AR-11", plate: "34 WF 111", brand: "Isuzu", model: "NPR 3D", driver: "Fatma Aksoy", phone: "905321112011", lat: 40.988, lng: 28.772, heading: 330 },
  { id: "AR-12", plate: "34 WF 112", brand: "Mitsubishi", model: "Fuso Canter", driver: "Emre Güneş", phone: "905321112012", lat: 41.012, lng: 28.884, heading: 48 },
  { id: "AR-13", plate: "34 WF 113", brand: "Ford", model: "Transit Tipper", driver: "Deniz Acar", phone: "905321112013", lat: 41.000, lng: 28.863, heading: 275 },
  { id: "AR-14", plate: "34 WF 114", brand: "Fiat", model: "Doblo Cargo", driver: "Merve Uçar", phone: "905321112014", lat: 41.044, lng: 29.006, heading: 22 },
  { id: "AR-15", plate: "34 WF 115", brand: "Mercedes-Benz", model: "Sprinter 519", driver: "Yusuf Eren", phone: "905321112015", lat: 41.079, lng: 28.795, heading: 88 }
].map((v, i) => {
  const destId = OUTBOUND[v.id] || "";
  const buyer = BUYERS.find((b) => b.id === destId);
  return {
    ...v,
    speedKmh: 18 + (i % 7) * 4,
    destId,
    destLabel: buyer ? `Satış · ${buyer.name} (${buyer.district})` : "",
    destLat: buyer ? buyer.lat : null,
    destLng: buyer ? buyer.lng : null,
    lastPing: "şimdi",
    lastNotify: "",
    tripKm: 0,
    tripStartLat: buyer ? v.lat : null,
    tripStartLng: buyer ? v.lng : null,
    arrivedAck: false
  };
});

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

function stepToward(lat, lng, tLat, tLng, step) {
  const dLat = tLat - lat;
  const dLng = tLng - lng;
  const dist = Math.hypot(dLat, dLng) || 1e-9;
  const move = Math.min(step, dist);
  return { lat: lat + (dLat / dist) * move, lng: lng + (dLng / dist) * move, arrived: dist < step * 1.2 };
}

export function tickFleet(vehicles) {
  const jitter = 0.00018;
  const arrivals = [];
  const nextVehicles = vehicles.map((v, i) => {
    const phase = Date.now() / 8000 + i;
    let lat = v.lat;
    let lng = v.lng;
    let heading = v.heading;
    let arrived = false;
    if (v.destLat && v.destLng) {
      const next = stepToward(lat, lng, v.destLat, v.destLng, 0.00035 + (v.speedKmh / 40000));
      lat = next.lat;
      lng = next.lng;
      arrived = next.arrived;
      heading = (Math.atan2(v.destLng - v.lng, v.destLat - v.lat) * 180) / Math.PI;
    } else {
      lat += Math.sin(phase) * jitter;
      lng += Math.cos(phase * 0.85) * jitter;
      heading = (heading + 4) % 360;
    }
    lat = Math.min(41.34, Math.max(40.92, lat));
    lng = Math.min(29.08, Math.max(27.92, lng));
    if (arrived && v.destId && !v.arrivedAck) {
      const km = Math.round(haversineKm(
        { lat: v.tripStartLat ?? v.lat, lng: v.tripStartLng ?? v.lng },
        { lat: v.destLat, lng: v.destLng }
      ) * 10) / 10;
      arrivals.push({
        vehicleId: v.id,
        plate: v.plate,
        driver: v.driver,
        destId: v.destId,
        destLabel: v.destLabel,
        km
      });
      return {
        ...v,
        lat,
        lng,
        heading,
        lastPing: new Date().toLocaleTimeString("tr-TR"),
        destLabel: `${v.destLabel} (ulaştı)`,
        destLat: null,
        destLng: null,
        destId: "",
        tripKm: Number(v.tripKm || 0) + km,
        arrivedAck: true
      };
    }
    return {
      ...v,
      lat,
      lng,
      heading,
      lastPing: new Date().toLocaleTimeString("tr-TR"),
      destLabel: v.destLabel
    };
  });
  return { vehicles: nextVehicles, arrivals };
}

export function dispatchMessage(vehicle, dest) {
  const maps = `https://maps.google.com/?q=${dest.lat},${dest.lng}`;
  return `WasteFlow görev: ${vehicle.plate} / ${vehicle.driver}. Hedef: ${dest.label}. Konum: ${maps}`;
}

export function smsHref(phone, text) {
  return `sms:+${phone}?&body=${encodeURIComponent(text)}`;
}

export function waHref(phone, text) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
