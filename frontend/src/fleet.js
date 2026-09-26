import { COLLECTION_POINTS } from "./collectionPoints.js";
import { DEPOTS } from "./depots.js";
import { BASER, STAR, BUYERS } from "./sales.js";
import { haversineKm, pathLengthKm, pointAlongPath } from "./roadRoute.js";

export { haversineKm };

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
  const home = DEPOTS[i % DEPOTS.length];
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
    arrivedAck: false,
    routePath: null,
    routeKmDone: 0,
    routeDistanceKm: 0,
    depotId: home.id,
    imei: `8649980${String(10000000 + i).slice(-8)}`,
    sim: `5321112${String(i + 1).padStart(3, "0")}`,
    trackerModel: i % 3 === 0 ? "Teltonika FMB920" : i % 3 === 1 ? "Queclink GV75" : "Ruptela Trace5",
    trackerStatus: "online"
  };
});

export const TRACKER_MODELS = ["Teltonika FMB920", "Queclink GV75", "Ruptela Trace5", "Concox GT06N", "Jimi VL103"];

export function nextFleetId(existing = []) {
  const nums = existing.map((v) => Number(String(v.id || "").replace(/\D/g, ""))).filter((n) => n > 0);
  return `AR-${String(Math.max(15, ...nums) + 1).padStart(2, "0")}`;
}

export function persistableFleet(vehicles = []) {
  const seedIds = new Set(INITIAL_FLEET.map((v) => v.id));
  return vehicles.filter((v) => v?.id && !seedIds.has(v.id));
}

export function mergeFleet(saved = []) {
  const extras = persistableFleet(saved);
  return [...INITIAL_FLEET.map((v) => ({ ...v })), ...extras.map((v) => ({
    ...v,
    destLat: v.destLat ?? null,
    destLng: v.destLng ?? null,
    routePath: v.routePath || null,
    routeKmDone: v.routeKmDone || 0,
    trackerStatus: v.trackerStatus || "online"
  }))];
}

export function makeVehicle(form, existing = []) {
  const depot = DEPOTS.find((d) => d.id === form.depotId) || DEPOTS[0];
  const plate = String(form.plate || "").trim().toUpperCase().replace(/\s+/g, " ");
  const phone = String(form.phone || "").replace(/\D/g, "") || "905320000000";
  return {
    id: nextFleetId(existing),
    plate,
    brand: String(form.brand || "Ford").trim(),
    model: String(form.model || "Transit").trim(),
    driver: String(form.driver || "").trim(),
    phone: phone.startsWith("90") ? phone : `90${phone.replace(/^0/, "")}`,
    lat: depot.lat + 0.0028,
    lng: depot.lng + 0.0024,
    heading: 85,
    speedKmh: Number(form.speedKmh || 28),
    destId: "",
    destLabel: "",
    destLat: null,
    destLng: null,
    lastPing: new Date().toLocaleTimeString("tr-TR"),
    lastNotify: "",
    tripKm: 0,
    tripStartLat: null,
    tripStartLng: null,
    arrivedAck: false,
    routePath: null,
    routeKmDone: 0,
    routeDistanceKm: 0,
    depotId: depot.id,
    imei: String(form.imei || "").replace(/\D/g, ""),
    sim: String(form.sim || "").replace(/\D/g, ""),
    trackerModel: form.trackerModel || TRACKER_MODELS[0],
    trackerStatus: "online"
  };
}

export function assignDestination(v, dest, extra = {}) {
  return {
    ...v,
    destId: dest.id,
    destLabel: dest.label,
    destLat: dest.lat,
    destLng: dest.lng,
    tripStartLat: v.lat,
    tripStartLng: v.lng,
    arrivedAck: false,
    routePath: null,
    routeKmDone: 0,
    routeDistanceKm: 0,
    ...extra
  };
}

export function needsRoadRoute(v) {
  return Boolean(v.destLat && v.destLng && !(v.routePath && v.routePath.length));
}

export function tickFleet(vehicles) {
  const jitter = 0.00005;
  const arrivals = [];
  const nextVehicles = vehicles.map((v, i) => {
    const phase = Date.now() / 8000 + i;
    let lat = v.lat;
    let lng = v.lng;
    let heading = v.heading;
    let routeKmDone = v.routeKmDone || 0;
    let arrived = false;
    if (v.destLat && v.destLng && v.routePath?.length) {
      const stepKm = (Number(v.speedKmh || 24) / 3600) * 2 * 2;
      const next = pointAlongPath(v.routePath, routeKmDone + stepKm);
      lat = next.lat;
      lng = next.lng;
      heading = next.heading;
      routeKmDone += stepKm;
      arrived = next.done;
    } else if (!v.destLat) {
      lat += Math.sin(phase) * jitter;
      lng += Math.cos(phase * 0.85) * jitter;
      heading = (heading + 4) % 360;
      lat = Math.min(41.34, Math.max(40.92, lat));
      lng = Math.min(29.08, Math.max(27.92, lng));
    }
    if (arrived && v.destId && !v.arrivedAck) {
      const km = Number(v.routeDistanceKm) || pathLengthKm(v.routePath) || Math.round(haversineKm(
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
        arrivedAck: true,
        routePath: null,
        routeKmDone: 0,
        routeDistanceKm: 0
      };
    }
    return {
      ...v,
      lat,
      lng,
      heading,
      routeKmDone,
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
