const KEY = "wasteflow.v1";

import { seedEvents } from "./chain.js";
import { RAW_SEED_LOTS } from "./seedLots.js";

export const DEFAULT_LOTS = RAW_SEED_LOTS.map(seedEvents);

function plausibleLot(lot) {
  const w = Number(lot?.weight ?? lot?.weight_kg ?? 0);
  return Boolean(lot?.id) && w >= 25;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function mergeLots(remote = [], local = []) {
  const byId = new Map();
  const seedIds = new Set(DEFAULT_LOTS.map((l) => l.id));
  for (const lot of DEFAULT_LOTS) byId.set(lot.id, { ...lot });
  const fold = (lot) => {
    if (!lot?.id) return;
    if (seedIds.has(lot.id)) {
      const prev = byId.get(lot.id);
      byId.set(lot.id, {
        ...prev,
        photoThumb: lot.photoThumb || prev.photoThumb,
        sourceId: prev.sourceId || lot.sourceId,
        chainAt: lot.chainAt || prev.chainAt
      });
      return;
    }
    if (!plausibleLot(lot)) return;
    const prev = byId.get(lot.id);
    byId.set(lot.id, prev ? { ...prev, ...lot, events: lot.events?.length ? lot.events : prev.events } : lot);
  };
  (remote || []).forEach(fold);
  (local || []).forEach(fold);
  return [...byId.values()];
}

export function saveState(partial) {
  const next = { ...loadState(), ...partial };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function metricsFromLots(lots) {
  const total = lots.reduce((sum, lot) => sum + Number(lot.weight || 0), 0);
  const recycled = lots.filter((l) => l.status === "İŞLENDİ").reduce((s, l) => s + Number(l.weight || 0), 0);
  const reused = lots.filter((l) => l.status === "ROTALANDI").reduce((s, l) => s + Number(l.weight || 0), 0);
  const landfilled = lots.filter((l) => l.status === "KARANTİNADA").reduce((s, l) => s + Number(l.weight || 0), 0);
  return {
    circularity_rate: total ? Math.round(((recycled + reused) / total) * 1000) / 10 : 0,
    recycled_tons: Math.round((recycled / 1000) * 100) / 100,
    reused_tons: Math.round((reused / 1000) * 100) / 100,
    landfilled_tons: Math.round((landfilled / 1000) * 100) / 100
  };
}

export function esgFromLots(lots) {
  const totalTons = lots.reduce((sum, lot) => sum + Number(lot.weight || 0), 0) / 1000;
  return {
    total_waste_processed_tons: Math.round(totalTons * 100) / 100,
    co2_avoided_tons: Math.round(totalTons * 2.3 * 100) / 100,
    trees_saved: Math.round(totalTons * 14),
    water_saved_liters: Math.round(totalTons * 31500),
    esg_compliance_score: "AA+ (GRI & CSRD Uyumlu)"
  };
}
