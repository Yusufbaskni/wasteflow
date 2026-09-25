export const FACILITY_OPTIONS = [
  "FAC-01 (Topkapı)",
  "FAC-02 (Zeytinburnu)",
  "FAC-03 (Bahçelievler)",
  "FAC-04 (İstinye)",
  "FAC-05 (Küçükçekmece)"
];

export const MATERIAL_OPTIONS = [
  "PET Plastik",
  "HDPE Plastik",
  "PP Plastik",
  "LDPE Film / Naylon",
  "Oluklu Mukavva",
  "Beyaz Kağıt / Karton",
  "Cam Ambalaj",
  "Alüminyum Ambalaj",
  "Hurda Demir / Çelik",
  "Ahşap Palet",
  "Tekstil / Elyaf",
  "Elektronik Atık (WEEE)",
  "Organik / Gıda Atığı",
  "Lastik / Kauçuk",
  "Karışık Ambalaj",
  "Tehlikeli Kimyasal Atık"
];

export function recommendRoute(material) {
  const m = (material || "").toLowerCase();
  if (["tehlikeli", "kimyasal", "hazard"].some((k) => m.includes(k))) {
    return { facility: "FAC-03 (Bahçelievler)", reason: "Tehlikeli atık lisanslı FAC-03 hattına yönlendirildi." };
  }
  if (["elektronik", "weee", "e-atık", "e-atik"].some((k) => m.includes(k))) {
    return { facility: "FAC-03 (Bahçelievler)", reason: "WEEE / elektronik atık FAC-03 lisanslı ayırma hattına yönlendirildi." };
  }
  if (["mukavva", "karton", "kağıt", "kagit", "paper"].some((k) => m.includes(k))) {
    return { facility: "FAC-02 (Zeytinburnu)", reason: "Kağıt/oluklu mukavva FAC-02 presleme hattına yönlendirildi." };
  }
  if (m.includes("cam") || m.includes("glass")) {
    return { facility: "FAC-04 (İstinye)", reason: "Cam ambalaj FAC-04 kırma hattına yönlendirildi." };
  }
  if (["alüminyum", "aluminyum", "hurda", "demir", "çelik", "celik", "metal"].some((k) => m.includes(k))) {
    return { facility: "FAC-01 (Topkapı)", reason: "Metal fraksiyon FAC-01 haddahane/ayırma hattına yönlendirildi." };
  }
  if (["ahşap", "ahsap", "palet", "tekstil", "elyaf"].some((k) => m.includes(k))) {
    return { facility: "FAC-02 (Zeytinburnu)", reason: "Ahşap/tekstil FAC-02 balyalama hattına yönlendirildi." };
  }
  if (["organik", "gıda", "gida", "biyobozunur"].some((k) => m.includes(k))) {
    return { facility: "FAC-04 (İstinye)", reason: "Organik atık FAC-04 kompost hattına yönlendirildi." };
  }
  if (["lastik", "kauçuk", "kaucuk"].some((k) => m.includes(k))) {
    return { facility: "FAC-05 (Küçükçekmece)", reason: "Lastik/kauçuk FAC-05 kırma ünitesine yönlendirildi." };
  }
  if (m.includes("hdpe") || m.includes("pp ") || m.includes("sert plastik") || m.startsWith("pp ")) {
    return { facility: "FAC-05 (Küçükçekmece)", reason: "HDPE/PP FAC-05 polimer ayırma ünitesine yönlendirildi." };
  }
  if (m.includes("pp plastik")) {
    return { facility: "FAC-05 (Küçükçekmece)", reason: "HDPE/PP FAC-05 polimer ayırma ünitesine yönlendirildi." };
  }
  if (["pet", "ldpe", "naylon", "polimer", "plastik"].some((k) => m.includes(k))) {
    return { facility: "FAC-01 (Topkapı)", reason: "PET/polimer FAC-01 yıkama-balya hattına yönlendirildi." };
  }
  return { facility: "FAC-02 (Zeytinburnu)", reason: "Karışık fraksiyon FAC-02 aktarma deposuna alındı." };
}

export function applyRouting(lots) {
  return lots.map((lot) => {
    if (lot.status === "İŞLENDİ" || lot.status === "KARANTİNADA") return lot;
    const rec = recommendRoute(lot.material);
    return { ...lot, facility: rec.facility, status: "ROTALANDI", routeReason: rec.reason };
  });
}

function fold(s) {
  return String(s || "")
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseLotsCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]).map((h) => fold(h));
  const find = (...names) => names.map((n) => header.indexOf(fold(n))).find((i) => i >= 0) ?? -1;
  const colId = find("id", "lot", "lot_id", "lot id");
  const colMat = find("material", "materyal", "malzeme");
  const colW = find("weight", "agirlik", "ağırlık", "kg", "weight_kg");
  const colFac = find("facility", "tesis", "depo");
  const colP = find("purity", "saflik", "saflık");
  const start = header.some((h) => ["id", "material", "materyal", "weight", "agirlik"].includes(h)) ? 1 : 0;
  const lots = [];
  for (let i = start; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const material = (colMat >= 0 ? cols[colMat] : cols[1]) || "Karışık Ambalaj";
    const weight = parseFloat(colW >= 0 ? cols[colW] : cols[2]);
    if (!Number.isFinite(weight) || weight <= 0) continue;
    lots.push({
      id: (colId >= 0 ? cols[colId] : cols[0]) || `LOT-${Date.now()}-${i}`,
      material,
      weight,
      facility: (colFac >= 0 ? cols[colFac] : cols[3]) || recommendRoute(material).facility,
      purity: parseFloat(colP >= 0 ? cols[colP] : cols[4]) || 90,
      status: "CSV AKTARILDI"
    });
  }
  return lots;
}
