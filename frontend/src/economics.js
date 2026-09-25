import { salePriceKg } from "./sales.js";

const COLLECT_COST = 1.35;
const HAZARD_COST = 8.5;
export const DIESEL_TRY_KM = 8.4;

export const CIRCULARITY_TARGET = 85;

export function rateFor(material) {
  return salePriceKg(material);
}

export function economicsFromLots(lots, fx = null, fleetKm = 0) {
  const rows = [];
  const byMat = {};
  lots.forEach((lot) => {
    const key = lot.material || "Diğer";
    if (!byMat[key]) byMat[key] = 0;
    byMat[key] += Number(lot.weight || 0);
  });
  let revenue = 0;
  let cost = 0;
  Object.entries(byMat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([material, kg]) => {
      const price = rateFor(material);
      const rev = Math.round(kg * price);
      const c = Math.round(kg * (material.includes("Tehlikeli") ? HAZARD_COST : COLLECT_COST));
      revenue += rev;
      cost += c;
      rows.push({ material, kg: Math.round(kg), price, revenue: rev, cost: c, margin: rev - c });
    });
  const km = Number(fleetKm || 0);
  const fuel = Math.round(km * DIESEL_TRY_KM);
  cost += fuel;
  const usdTry = fx?.usdTry || 0;
  const eurTry = fx?.eurTry || 0;
  const conv = (tryAmount) => ({
    try: tryAmount,
    usd: usdTry ? tryAmount / usdTry : 0,
    eur: eurTry ? tryAmount / eurTry : 0
  });
  return {
    rows,
    revenue,
    cost,
    margin: revenue - cost,
    fleetKm: Math.round(km * 10) / 10,
    fuelTry: fuel,
    dieselPerKm: DIESEL_TRY_KM,
    totals: { revenue: conv(revenue), cost: conv(cost), margin: conv(revenue - cost), fuel: conv(fuel) }
  };
}
