import { ewcOf } from "./ewc.js";
import { ensureEIrsaliye, makeEIrsaliye } from "./eirsaliye.js";

export function nowStamp() {
  return new Date().toLocaleString("tr-TR");
}

export function nowClock() {
  return new Date().toLocaleTimeString("tr-TR");
}

export function pushEvent(lot, event) {
  const events = [...(lot.events || []), { at: nowStamp(), ...event }];
  return { ...lot, events, chainAt: nowClock() };
}

export function seedEvents(lot) {
  if (lot.events?.length) return lot;
  const ewc = ewcOf(lot.material);
  const day = lot.day || "25.09.2026";
  const events = [
    { at: `${day} 07:52:00`, type: "KAYIT", who: "Saha operatörü", detail: `${lot.sourceId || "COL"} kantarı ${Number(lot.weight).toLocaleString("tr-TR")} kg. EWC ${ewc.code}` }
  ];
  if (["ALINDI", "TESLİM EDİLDİ", "İŞLENDİ", "ROTALANDI"].includes(lot.status)) {
    events.push({ at: `${day} 09:18:00`, type: "ALIM", who: "Şoför", plate: "34 WF 101", detail: `İrsaliye tartımı ${Number(lot.weight).toLocaleString("tr-TR")} kg · ${lot.sourceId}` });
  }
  if (["TESLİM EDİLDİ", "İŞLENDİ"].includes(lot.status)) {
    events.push({ at: `${day} 11:06:00`, type: "TESLİM", who: "Depo müdürü", plate: "34 WF 101", detail: `${lot.facility} kabul ${Number(lot.weight).toLocaleString("tr-TR")} kg · saflık %${lot.purity}` });
  }
  if (lot.status === "İŞLENDİ") {
    events.push({ at: `${day} 15:40:00`, type: "İŞLEME", who: "Tesis", detail: "Ayırma / pres hattına alındı" });
  }
  if (lot.status === "KARANTİNADA") {
    events.push({ at: `${day} 10:12:00`, type: "KARANTİNA", who: "FAC-03", detail: "EWC / etiket uyuşmazlığı · lisanslı kabin" });
  }
  return { ...lot, events };
}

export const DEFAULT_WAYBILLS = [
  { id: "IRS-2026-0136", lotId: "LOT-8928", kind: "TESLİM", material: "Oluklu Mukavva", ewc: "15 01 01", kg: 1840, sourceId: "COL-10", facility: "FAC-02 (Zeytinburnu)", plate: "34 WF 102", driver: "Mehmet Kaya", signer: "Selin Arslan", signData: "", time: "18.09.2026 11:14:00" },
  { id: "IRS-2026-0138", lotId: "LOT-8931", kind: "TESLİM", material: "Hurda Demir / Çelik", ewc: "16 01 17", kg: 1260, sourceId: "COL-17", facility: "FAC-01 (Topkapı)", plate: "34 WF 110", driver: "Okan Yılmaz", signer: "Kemal Yılmaz", signData: "", time: "19.09.2026 13:02:00" },
  { id: "IRS-2026-0141", lotId: "LOT-8941", kind: "TESLİM", material: "PET Plastik", ewc: "15 01 02", kg: 468, sourceId: "COL-01", facility: "FAC-01 (Topkapı)", plate: "34 WF 101", driver: "Ahmet Yıldız", signer: "Kemal Yılmaz", signData: "", time: "23.09.2026 10:41:00" },
  { id: "IRS-2026-0142", lotId: "LOT-8944", kind: "TESLİM", material: "Cam Ambalaj", ewc: "15 01 07", kg: 812, sourceId: "COL-13", facility: "FAC-04 (İstinye)", plate: "34 ISU 104", driver: "Can Özkan", signer: "Pınar Aydın", signData: "", time: "24.09.2026 12:18:00" },
  { id: "IRS-2026-0143", lotId: "LOT-8942", kind: "ALIM", material: "Oluklu Mukavva", ewc: "15 01 01", kg: 1520, sourceId: "COL-09", facility: "FAC-02 (Zeytinburnu)", plate: "34 WF 102", driver: "Mehmet Kaya", signer: "Ece Yaman", signData: "", time: "24.09.2026 09:27:00" },
  { id: "IRS-2026-0144", lotId: "LOT-8951", kind: "TESLİM", material: "Ahşap Palet", ewc: "15 01 03", kg: 1080, sourceId: "COL-19", facility: "FAC-02 (Zeytinburnu)", plate: "34 WF 113", driver: "Deniz Acar", signer: "Selin Arslan", signData: "", time: "23.09.2026 16:05:00" },
  { id: "IRS-2026-0145", lotId: "LOT-8956", kind: "TESLİM", material: "Organik / Gıda Atığı", ewc: "20 01 08", kg: 254, sourceId: "COL-26", facility: "FAC-04 (İstinye)", plate: "34 WF 114", driver: "Merve Uçar", signer: "Pınar Aydın", signData: "", time: "23.09.2026 08:55:00" },
  { id: "IRS-2026-0146", lotId: "LOT-8954", kind: "TESLİM", material: "Elektronik Atık (WEEE)", ewc: "16 02 14", kg: 98, sourceId: "COL-24", facility: "FAC-03 (Bahçelievler)", plate: "34 WF 108", driver: "Hakan Çelik", signer: "Murat Koç", signData: "", time: "21.09.2026 14:33:00" }
];

export function mergeWaybills(saved = []) {
  const byId = new Map(DEFAULT_WAYBILLS.map((w) => [w.id, { ...w }]));
  for (const w of saved || []) {
    if (!w?.id) continue;
    if (!byId.has(w.id)) byId.set(w.id, w);
  }
  return [...byId.values()]
    .sort((a, b) => String(b.time).localeCompare(String(a.time), "tr"))
    .map((w, _, arr) => ensureEIrsaliye(w, arr));
}

export function makeWaybill(opts) {
  return makeEIrsaliye(opts);
}

export function massBalance(lots) {
  const kg = (list) => list.reduce((s, l) => s + Number(l.weight || 0), 0);
  const incoming = kg(lots);
  const recovered = kg(lots.filter((l) => l.status === "İŞLENDİ" || l.status === "TESLİM EDİLDİ"));
  const landfill = kg(lots.filter((l) => l.status === "KARANTİNADA"));
  const transit = Math.max(0, incoming - recovered - landfill);
  const circularity = incoming ? Math.round(((recovered) / incoming) * 1000) / 10 : 0;
  return {
    incomingKg: Math.round(incoming),
    recoveredKg: Math.round(recovered),
    landfillKg: Math.round(landfill),
    transitKg: Math.round(transit),
    circularity,
    incomingTons: Math.round((incoming / 1000) * 100) / 100,
    recoveredTons: Math.round((recovered / 1000) * 100) / 100,
    landfillTons: Math.round((landfill / 1000) * 100) / 100
  };
}
