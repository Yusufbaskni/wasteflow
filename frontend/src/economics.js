import { saleAmount, salePriceKg } from "./sales.js";

export const DIESEL_TRY_KM = 8.4;
export const CIRCULARITY_TARGET = 85;
/** Toplama + ayırma + fire: satış fiyatının payı (hurda ticareti ince marjlıdır). */
const COGS_RATIO = 0.77;
const PROCESS_TRY_KG = 0.18;
const PERIOD_DAYS = 8;

export function rateFor(material) {
  return salePriceKg(material);
}

function convFactory(fx) {
  const usdTry = fx?.usdTry || 0;
  const eurTry = fx?.eurTry || 0;
  return (tryAmount) => ({
    try: tryAmount,
    usd: usdTry ? tryAmount / usdTry : 0,
    eur: eurTry ? tryAmount / eurTry : 0
  });
}

export function economicsFromLots(lots, fx = null, fleetKm = 0, sales = []) {
  const conv = convFactory(fx);
  const sold = Array.isArray(sales) ? sales : [];
  const byMat = {};
  let revenue = 0;
  let soldKg = 0;
  sold.forEach((s) => {
    const kg = Number(s.kg || 0);
    const bid = s.buyerId || "BASER";
    const amount = Number(s.amount ?? saleAmount(s.material, kg, bid));
    soldKg += kg;
    revenue += amount;
    const key = s.material || "Diğer";
    if (!byMat[key]) byMat[key] = { kg: 0, revenue: 0, price: salePriceKg(key, bid) };
    byMat[key].kg += kg;
    byMat[key].revenue += amount;
  });
  const rows = Object.entries(byMat)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([material, row]) => {
      const cogs = Math.round(row.revenue * COGS_RATIO);
      const process = Math.round(row.kg * PROCESS_TRY_KG);
      const cost = cogs + process;
      const rev = Math.round(row.revenue);
      return {
        material,
        kg: Math.round(row.kg),
        price: row.price,
        revenue: rev,
        cost,
        margin: rev - cost
      };
    });
  const cogs = Math.round(revenue * COGS_RATIO);
  const process = Math.round(soldKg * PROCESS_TRY_KG);
  const km = Number(fleetKm || 0);
  const fuel = Math.round(km * DIESEL_TRY_KM);
  const cost = cogs + process + fuel;
  const margin = Math.round(revenue) - cost;
  const dailyRevenue = PERIOD_DAYS ? Math.round(revenue / PERIOD_DAYS) : 0;
  const dailyMargin = PERIOD_DAYS ? Math.round(margin / PERIOD_DAYS) : 0;
  const marginPct = revenue ? Math.round((margin / revenue) * 1000) / 10 : 0;
  return {
    period: "18–25 Eylül 2026 (8 gün)",
    periodDays: PERIOD_DAYS,
    rows,
    revenue: Math.round(revenue),
    cost,
    margin,
    marginPct,
    dailyRevenue,
    dailyCost: PERIOD_DAYS ? Math.round(cost / PERIOD_DAYS) : 0,
    dailyMargin,
    soldKg: Math.round(soldKg),
    stockKg: Math.round((lots || []).reduce((s, l) => s + Number(l.weight || 0), 0)),
    fleetKm: Math.round(km * 10) / 10,
    fuelTry: fuel,
    dieselPerKm: DIESEL_TRY_KM,
    totals: {
      revenue: conv(Math.round(revenue)),
      cost: conv(cost),
      margin: conv(margin),
      fuel: conv(fuel),
      dailyRevenue: conv(dailyRevenue),
      dailyMargin: conv(dailyMargin)
    }
  };
}
