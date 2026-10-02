import { DIESEL_TRY_KM } from "./ekonomi.js";
import { explainRoute } from "./rotaOnerisi.js";
import { haversine, nearestNeighbor, START } from "./toplamaRotalari.js";

export const WRONG_FACILITY_TRY = 850;
export const EXPERIMENT_START = START;

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, seed) {
  const out = [...list];
  const rnd = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function tourFromOrder(start, points) {
  const stops = [];
  let cur = start;
  let km = 0;
  points.forEach((p, i) => {
    const d = haversine(cur, p);
    km += d;
    stops.push({ ...p, order: i + 1, legKm: Math.round(d * 10) / 10 });
    cur = p;
  });
  km += haversine(cur, start);
  return { stops, km: Math.round(km * 10) / 10 };
}

export function pickScenario(sites, seed = Date.now()) {
  const ranked = [...(sites || [])].sort((a, b) => Number(b.fill || 0) - Number(a.fill || 0));
  const top = ranked.slice(0, 14);
  const shuffled = shuffle(top, seed);
  return shuffled.slice(0, 10);
}

export function compareTours(points, seed) {
  const start = START;
  const system = nearestNeighbor(start, points);
  const random = tourFromOrder(start, shuffle(points, seed));
  const extraKm = Math.round((random.km - system.km) * 10) / 10;
  const dieselTry = Math.round(Math.max(0, extraKm) * DIESEL_TRY_KM);
  return { start, system, random, extraKm, dieselTry };
}

export function compareHumanVsSystem(points, humanOrder) {
  const start = START;
  const ordered = (humanOrder || [])
    .map((id) => points.find((p) => p.id === id))
    .filter(Boolean);
  const pool = ordered.length === points.length ? ordered : points;
  const human = tourFromOrder(start, pool);
  const system = nearestNeighbor(start, points);
  const extraKm = Math.round((human.km - system.km) * 10) / 10;
  const dieselTry = Math.round(Math.max(0, extraKm) * DIESEL_TRY_KM);
  return { start, system, human, extraKm, dieselTry };
}

export const LOG_KEY = "wasteflow.experiment.v1";

export function loadExperimentLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExperimentLog(rows) {
  localStorage.setItem(LOG_KEY, JSON.stringify(rows));
}

export function exportExperimentCsv(rows) {
  const header = ["deneme", "tarih", "lot", "malzeme", "sizin_tesis", "sistem_tesis", "tesis_dogru", "sizin_km", "sistem_km", "fark_km", "fazla_dizel_tl", "yanlis_tesis_tl", "toplam_fazla_tl"];
  const lines = [header.join(";")];
  (rows || []).forEach((r, i) => {
    lines.push([
      i + 1,
      r.at || "",
      r.lotId || "",
      `"${String(r.material || "").replaceAll('"', '""')}"`,
      `"${String(r.humanFacility || "").replaceAll('"', '""')}"`,
      `"${String(r.systemFacility || "").replaceAll('"', '""')}"`,
      r.facilityOk ? "evet" : "hayir",
      r.humanKm,
      r.systemKm,
      r.extraKm,
      r.dieselTry,
      r.penaltyTry,
      r.totalTry
    ].join(";"));
  });
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "karar-deneyi.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function pathLatLngs(start, stops) {
  return [start, ...stops, start].map((p) => [p.lat, p.lng]);
}

export function facilityVerdict(material, humanFacility) {
  const explained = explainRoute(material);
  const picked = String(humanFacility || "").trim();
  const wrong = Boolean(picked) && picked !== explained.facility;
  return {
    ...explained,
    humanFacility: picked,
    wrong,
    penaltyTry: wrong ? WRONG_FACILITY_TRY : 0
  };
}

export function formatTry(n) {
  return `${Number(n || 0).toLocaleString("tr-TR")} TL`;
}
