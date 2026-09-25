import { DEPOTS, fillForDepot, lotsForDepot } from "./depots.js";

export function sevenDayForecast(bins, lots) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const series = [];
  const warnings = [];

  DEPOTS.forEach((depot) => {
    const start = fillForDepot(depot, bins);
    const kg = lotsForDepot(depot, lots).reduce((sum, lot) => sum + Number(lot.weight || 0), 0);
    const daily = Math.max(1.2, Math.min(6.5, 1.8 + kg / 900));
    let crossed = null;
    for (let d = 0; d < 7; d += 1) {
      const day = new Date(today);
      day.setDate(today.getDate() + d);
      const label = day.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" });
      if (!series[d]) series[d] = { day: label };
      const fill = Math.min(100, Math.round((start + daily * d) * 10) / 10);
      series[d][depot.id] = fill;
      if (crossed === null && fill >= 95) crossed = { day: label, fill, depot };
    }
    if (crossed) warnings.push(crossed);
  });

  return { series, warnings, depots: DEPOTS };
}

export function vehicleDispatchAdvice(warnings, sites) {
  const fromForecast = (warnings || []).map(
    (w) => `${w.day}: ${w.depot.id} ${w.depot.name} tahmini %${w.fill} — araç çıkar`
  );
  const fromSites = (sites || [])
    .filter((s) => Number(s.fill) >= 80)
    .map((s) => `Bugün: ${s.id} ${s.district} %${s.fill} — ${s.material} toplama`);
  return [...fromForecast, ...fromSites];
}
