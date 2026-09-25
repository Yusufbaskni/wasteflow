export const BASER = {
  id: "BASER",
  name: "Başer Geri Dönüşüm",
  legal: "Başer Geri Dönüşüm ve Ticaret Ltd. Şti.",
  short: "Başer",
  district: "Çerkezköy",
  city: "Tekirdağ",
  address: "Çerkezköy OSB, Gazi Osman Paşa Mah. 5. Cad. No:18 Çerkezköy / Tekirdağ",
  phone: "0282 726 40 10",
  email: "kabul@baser-gd.com.tr",
  contact: "Hasan Başer",
  title: "Satın alma müdürü",
  taxNo: "147 025 3894",
  mersis: "0147025389400016",
  license: "ÇŞB-GDO-59-2024-118",
  contract: "WF-BASER-2026-04",
  iban: "TR72 0006 2000 1188 0000 2841 02",
  terms: "15 gün vade · havale",
  hours: "07:00–19:00 (Pazartesi–Cumartesi)",
  gate: "B kapısı kantar · 60 t baskül",
  spec: "Pres balya / big-bag. Nem ≤ %12. PET şeffaf-renkli ayrı.",
  minTon: 8,
  color: "#1B6B4A",
  colorDim: "#2E8B57",
  bg: "#f3f8f5",
  lat: 41.2864,
  lng: 27.9996
};

export const STAR = {
  id: "STAR",
  name: "Star Geri Dönüşüm",
  legal: "Star Geri Dönüşüm Sanayi ve Ticaret A.Ş.",
  short: "Star",
  district: "Hadımköy",
  city: "İstanbul",
  address: "Hadımköy OSB, 2. Cadde No:7 Arnavutköy / İstanbul",
  phone: "0212 798 22 40",
  email: "alim@star-gd.com.tr",
  contact: "Deniz Star",
  title: "Hammadde kabul şefi",
  taxNo: "781 046 2210",
  mersis: "0781046221000019",
  license: "ÇŞB-GDO-34-2025-042",
  contract: "WF-STAR-2026-02",
  iban: "TR18 0004 6001 1880 0001 5520 09",
  terms: "21 gün vade · havale / çek",
  hours: "06:30–20:00 (Pazartesi–Cumartesi)",
  gate: "A kapısı tır rampası · 80 t baskül",
  spec: "Balya + dökme. Cam kırığı ayrı silo. WEEE lisanslı hat.",
  minTon: 6,
  color: "#1E5A9C",
  colorDim: "#3D7CC4",
  bg: "#f3f6fb",
  lat: 41.1568,
  lng: 28.6184
};

export const BUYERS = [BASER, STAR];
export const BUYER = BASER;

export function buyerById(id) {
  return BUYERS.find((b) => b.id === id) || BASER;
}

/** ₺/kg — iki alıcı birbirine yakın; hangisinin daha iyi teklif verdiği karşılaştırmada görünür. */
export const PRICE_TRY_KG = {
  BASER: {
    "PET Plastik": 8.4,
    "HDPE Plastik": 7.1,
    "PP Plastik": 6.2,
    "LDPE Film / Naylon": 5.4,
    "Oluklu Mukavva": 2.3,
    "Beyaz Kağıt / Karton": 1.9,
    "Cam Ambalaj": 0.85,
    "Alüminyum Ambalaj": 18.5,
    "Hurda Demir / Çelik": 4.2,
    "Ahşap Palet": 1.1,
    "Tekstil / Elyaf": 3.4,
    "Elektronik Atık (WEEE)": 12.8,
    "Organik / Gıda Atığı": 0.35,
    "Lastik / Kauçuk": 2.6,
    "Karışık Ambalaj": 1.4,
    "Tehlikeli Kimyasal Atık": 0
  },
  STAR: {
    "PET Plastik": 8.55,
    "HDPE Plastik": 6.95,
    "PP Plastik": 6.35,
    "LDPE Film / Naylon": 5.28,
    "Oluklu Mukavva": 2.38,
    "Beyaz Kağıt / Karton": 1.85,
    "Cam Ambalaj": 0.88,
    "Alüminyum Ambalaj": 18.2,
    "Hurda Demir / Çelik": 4.28,
    "Ahşap Palet": 1.05,
    "Tekstil / Elyaf": 3.52,
    "Elektronik Atık (WEEE)": 12.55,
    "Organik / Gıda Atığı": 0.32,
    "Lastik / Kauçuk": 2.68,
    "Karışık Ambalaj": 1.45,
    "Tehlikeli Kimyasal Atık": 0
  }
};

export const SALE_PRICE_TRY_KG = PRICE_TRY_KG.BASER;
export const MATERIALS = Object.keys(PRICE_TRY_KG.BASER);

export function salePriceKg(material, buyerId = "BASER") {
  const table = PRICE_TRY_KG[buyerId] || PRICE_TRY_KG.BASER;
  return table[material] ?? PRICE_TRY_KG.BASER[material] ?? 1.5;
}

export function saleAmount(material, kg, buyerId = "BASER") {
  return Math.round(Number(kg || 0) * salePriceKg(material, buyerId) * 100) / 100;
}

function enrich(row, buyer) {
  const priceKg = salePriceKg(row.material, buyer.id);
  return {
    ...row,
    buyerId: buyer.id,
    buyer: buyer.name,
    dest: `${buyer.district} / ${buyer.city}`,
    address: buyer.address,
    priceKg,
    amount: saleAmount(row.material, row.kg, buyer.id),
    terms: buyer.terms,
    contract: buyer.contract
  };
}

export const DEFAULT_SALES = [
  enrich({ id: "SAT-2026-0101", lotId: "LOT-8928", material: "Oluklu Mukavva", kg: 1840, facility: "FAC-02 (Zeytinburnu)", plate: "34 WF 102", driver: "Mehmet Kaya", time: "19.09.2026 08:40:00", eFatura: "BAS2026001840", pay: "Ödendi" }, BASER),
  enrich({ id: "SAT-2026-0102", lotId: "LOT-8931", material: "Hurda Demir / Çelik", kg: 1260, facility: "FAC-01 (Topkapı)", plate: "34 WF 110", driver: "Okan Yılmaz", time: "20.09.2026 09:15:00", eFatura: "BAS2026001260", pay: "Ödendi" }, BASER),
  enrich({ id: "SAT-2026-0103", lotId: "LOT-8934", material: "PET Plastik", kg: 612, facility: "FAC-01 (Topkapı)", plate: "34 WF 101", driver: "Ahmet Yıldız", time: "21.09.2026 07:50:00", eFatura: "BAS2026000612", pay: "Ödendi" }, BASER),
  enrich({ id: "SAT-2026-0104", lotId: "LOT-8936", material: "Cam Ambalaj", kg: 940, facility: "FAC-04 (İstinye)", plate: "34 ISU 104", driver: "Can Özkan", time: "21.09.2026 14:22:00", eFatura: "BAS2026000940", pay: "Ödendi" }, BASER),
  enrich({ id: "SAT-2026-0105", lotId: "LOT-8938", material: "HDPE Plastik", kg: 428, facility: "FAC-05 (Küçükçekmece)", plate: "34 WF 105", driver: "Elif Şahin", time: "21.09.2026 16:05:00", eFatura: "BAS2026000428", pay: "Vadesi 06.10" }, BASER),
  enrich({ id: "SAT-2026-0106", lotId: "LOT-8954", material: "Elektronik Atık (WEEE)", kg: 98, facility: "FAC-03 (Bahçelievler)", plate: "34 WF 108", driver: "Hakan Çelik", time: "22.09.2026 11:30:00", eFatura: "BAS2026000098", pay: "Ödendi" }, BASER),
  enrich({ id: "SAT-2026-0107", lotId: "LOT-8940", material: "Beyaz Kağıt / Karton", kg: 736, facility: "FAC-02 (Zeytinburnu)", plate: "34 WF 102", driver: "Mehmet Kaya", time: "23.09.2026 10:08:00", eFatura: "BAS2026000736", pay: "Ödendi" }, BASER),
  enrich({ id: "SAT-2026-0108", lotId: "LOT-8941", material: "PET Plastik", kg: 468, facility: "FAC-01 (Topkapı)", plate: "34 WF 101", driver: "Ahmet Yıldız", time: "24.09.2026 06:55:00", eFatura: "BAS2026000468", pay: "Vadesi 09.10" }, BASER),
  enrich({ id: "SAT-2026-0109", lotId: "LOT-8951", material: "Ahşap Palet", kg: 1080, facility: "FAC-02 (Zeytinburnu)", plate: "34 WF 113", driver: "Deniz Acar", time: "24.09.2026 13:40:00", eFatura: "BAS2026001080", pay: "Ödendi" }, BASER),
  enrich({ id: "SAT-2026-0110", lotId: "LOT-8956", material: "Organik / Gıda Atığı", kg: 254, facility: "FAC-04 (İstinye)", plate: "34 WF 114", driver: "Merve Uçar", time: "24.09.2026 15:18:00", eFatura: "BAS2026000254", pay: "Ödendi" }, BASER),
  enrich({ id: "SAT-2026-0201", lotId: "LOT-8942", material: "Oluklu Mukavva", kg: 1520, facility: "FAC-02 (Zeytinburnu)", plate: "34 WF 112", driver: "Emre Güneş", time: "24.09.2026 17:10:00", eFatura: "STR2026001520", pay: "Ödendi" }, STAR),
  enrich({ id: "SAT-2026-0202", lotId: "LOT-8945", material: "HDPE Plastik", kg: 574, facility: "FAC-05 (Küçükçekmece)", plate: "34 WF 115", driver: "Yusuf Eren", time: "25.09.2026 07:42:00", eFatura: "STR2026000574", pay: "Vadesi 16.10" }, STAR),
  enrich({ id: "SAT-2026-0203", lotId: "LOT-8950", material: "Alüminyum Ambalaj", kg: 214, facility: "FAC-01 (Topkapı)", plate: "34 WF 106", driver: "Burak Aydın", time: "25.09.2026 08:55:00", eFatura: "STR2026000214", pay: "Ödendi" }, STAR),
  enrich({ id: "SAT-2026-0204", lotId: "LOT-8957", material: "Hurda Demir / Çelik", kg: 890, facility: "FAC-01 (Topkapı)", plate: "34 WF 112", driver: "Emre Güneş", time: "25.09.2026 10:20:00", eFatura: "STR2026000890", pay: "Vadesi 16.10" }, STAR),
  enrich({ id: "SAT-2026-0205", lotId: "LOT-8952", material: "Tekstil / Elyaf", kg: 445, facility: "FAC-02 (Zeytinburnu)", plate: "34 WF 107", driver: "Zeynep Arslan", time: "23.09.2026 18:05:00", eFatura: "STR2026000445", pay: "Ödendi" }, STAR),
  enrich({ id: "SAT-2026-0206", lotId: "LOT-8944", material: "Cam Ambalaj", kg: 812, facility: "FAC-04 (İstinye)", plate: "34 WF 115", driver: "Yusuf Eren", time: "25.09.2026 12:30:00", eFatura: "STR2026000812", pay: "Ödendi" }, STAR)
];

export function mergeSales(saved = []) {
  const byId = new Map(DEFAULT_SALES.map((s) => [s.id, { ...s }]));
  const extra = Array.isArray(saved) ? saved : [];
  for (const s of extra) {
    if (!s?.id) continue;
    if (!byId.has(s.id)) byId.set(s.id, s);
  }
  return [...byId.values()].sort((a, b) => String(b.time).localeCompare(String(a.time), "tr"));
}

export function salesFor(sales = [], buyerId) {
  return sales.filter((s) => (s.buyerId || "BASER") === buyerId);
}

export function makeSale({ lot, kg, plate, driver, user, buyer }) {
  const b = buyer || BASER;
  const weight = Number(kg || lot.weight || 0);
  const prefix = b.id === "STAR" ? "STR" : "BAS";
  return {
    id: `SAT-${Date.now().toString().slice(-8)}`,
    lotId: lot.id,
    material: lot.material,
    kg: weight,
    facility: lot.facility,
    plate: plate || "",
    driver: driver || "",
    time: new Date().toLocaleString("tr-TR"),
    eFatura: `${prefix}${Date.now().toString().slice(-8)}`,
    pay: "Kesildi",
    who: user?.name || "",
    ...enrich({ material: lot.material, kg: weight }, b)
  };
}

export function soldLotIds(sales = []) {
  return new Set(sales.map((s) => s.lotId).filter(Boolean));
}

export function summarizeSales(sales = [], buyerId) {
  const list = buyerId ? salesFor(sales, buyerId) : sales;
  const byMat = {};
  let kg = 0;
  let amount = 0;
  list.forEach((s) => {
    const bid = s.buyerId || "BASER";
    const w = Number(s.kg || 0);
    const a = Number(s.amount ?? saleAmount(s.material, w, bid));
    kg += w;
    amount += a;
    if (!byMat[s.material]) {
      byMat[s.material] = { material: s.material, kg: 0, amount: 0, priceKg: salePriceKg(s.material, bid), count: 0 };
    }
    byMat[s.material].kg += w;
    byMat[s.material].amount += a;
    byMat[s.material].count += 1;
  });
  const rows = Object.values(byMat).sort((a, b) => b.amount - a.amount);
  return {
    count: list.length,
    kg: Math.round(kg),
    amount: Math.round(amount * 100) / 100,
    rows,
    chart: rows.map((r) => ({ name: r.material.replace(" / ", "/"), kg: Math.round(r.kg), amount: Math.round(r.amount) }))
  };
}

export function compareKgPrices() {
  return MATERIALS.map((material) => {
    const baser = salePriceKg(material, "BASER");
    const star = salePriceKg(material, "STAR");
    const delta = Math.round((star - baser) * 100) / 100;
    const pct = baser ? Math.round((delta / baser) * 1000) / 10 : 0;
    let winner = "eşit";
    if (delta > 0) winner = "STAR";
    if (delta < 0) winner = "BASER";
    return { material, baser, star, delta, pct, winner };
  });
}
