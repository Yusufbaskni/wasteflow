import { DEPOTS, fillForDepot, lotsForDepot } from "./depots.js";

const GOOD = new Set(["İŞLENDİ", "ROTALANDI", "TESLİM EDİLDİ", "ALINDI"]);

export function bonusBand(score) {
  if (score >= 88) return { rate: 0.18, band: "A", label: "Üstün" };
  if (score >= 75) return { rate: 0.12, band: "B", label: "İyi" };
  if (score >= 60) return { rate: 0.07, band: "C", label: "Orta" };
  if (score >= 40) return { rate: 0.03, band: "D", label: "Zayıf" };
  return { rate: 0, band: "E", label: "Prim yok" };
}

export function depotPerformance(lots, bins) {
  const rows = DEPOTS.map((depot) => {
    const list = lotsForDepot(depot, lots);
    const kg = list.reduce((s, l) => s + Number(l.weight || 0), 0);
    const goodKg = list.filter((l) => GOOD.has(l.status)).reduce((s, l) => s + Number(l.weight || 0), 0);
    const badKg = list.filter((l) => l.status === "KARANTİNADA").reduce((s, l) => s + Number(l.weight || 0), 0);
    const fill = fillForDepot(depot, bins);
    return { depot, list, kg, goodKg, badKg, fill };
  });
  const maxKg = Math.max(1, ...rows.map((r) => r.kg));
  return rows.map((r) => {
    const throughput = Math.round((r.kg / maxKg) * 40);
    const quality = r.kg ? Math.round(((r.goodKg - r.badKg) / r.kg) * 40) : 0;
    const capacity = r.fill >= 95 ? 0 : r.fill >= 85 ? 8 : r.fill >= 70 ? 14 : 20;
    const idleReady = r.kg < 80 && r.badKg === 0 && r.fill < 80 ? 30 : 0;
    const score = Math.max(0, Math.min(100, throughput + Math.max(0, quality) + capacity + idleReady));
    const band = bonusBand(score);
    return {
      id: r.depot.id,
      name: r.depot.name,
      kg: Math.round(r.kg),
      lots: r.list.length,
      fill: r.fill,
      circ: r.kg ? Math.round((r.goodKg / r.kg) * 1000) / 10 : 0,
      score,
      ...band
    };
  });
}

export function payFor(person, perfById) {
  const d = perfById[person.depotId] || {};
  const rate = Number(d.rate || 0);
  const salary = Number(person.salary || 0);
  const bonus = Math.round(salary * rate);
  return {
    salary,
    bonus,
    total: salary + bonus,
    rate,
    score: d.score || 0,
    band: d.band || "E",
    label: d.label || "Prim yok"
  };
}
