const MATERIALS = {
  cardboard: {
    detected_material: "Oluklu Mukavva / Kraft Karton",
    recyclability_percentage: 92.5,
    estimated_co2_saving_kg_per_ton: 1800,
    ai_recommendation:
      "Kahverengi kraft/oluklu mukavva tespit edildi. FAC-02 presleme ve kağıt geri dönüşüm hattına sevk edilmelidir. Islak veya yağlı ise karantinaya alın."
  },
  paper: {
    detected_material: "Beyaz Kağıt / Karton Ambalaj",
    recyclability_percentage: 94.0,
    estimated_co2_saving_kg_per_ton: 1700,
    ai_recommendation:
      "Açık tonlu kağıt/karton. Mürekkep ve bant oranı düşükse doğrudan kağıt geri dönüşümüne alınabilir."
  },
  pet: {
    detected_material: "PET Plastik (Mavi/Şeffaf)",
    recyclability_percentage: 94.2,
    estimated_co2_saving_kg_per_ton: 2450,
    ai_recommendation:
      "PET polimer spektrumu. Yıkama + şişe-balya hattına yönlendirin; PVC karışımı varsa ayırın."
  },
  hdpe: {
    detected_material: "HDPE / Renkli Sert Plastik",
    recyclability_percentage: 87.6,
    estimated_co2_saving_kg_per_ton: 2100,
    ai_recommendation:
      "Sert polimer (HDPE/PP). Polimer ayırma ünitesine alın; etiket ve kapaklar ayrılmalı."
  },
  glassGreen: {
    detected_material: "Cam Ambalaj (Yeşil/Kahverengi)",
    recyclability_percentage: 98.0,
    estimated_co2_saving_kg_per_ton: 850,
    ai_recommendation:
      "Cam kırığı hattına sevk edin. Seramik/taş karışımı varsa reddedin."
  },
  glassClear: {
    detected_material: "Cam / Şeffaf Ambalaj",
    recyclability_percentage: 97.5,
    estimated_co2_saving_kg_per_ton: 900,
    ai_recommendation:
      "Şeffaf cam. Renkli camdan ayrı toplanmalı; metal kapaklar ayrılmalı."
  },
  metal: {
    detected_material: "Metal / Alüminyum Ambalaj",
    recyclability_percentage: 96.0,
    estimated_co2_saving_kg_per_ton: 9200,
    ai_recommendation:
      "Metal hurda presi. Manyetik ayırma ile çelik/alüminyum ayrıştırılmalı."
  },
  organic: {
    detected_material: "Organik / Biyobozunur Atık",
    recyclability_percentage: 78.0,
    estimated_co2_saving_kg_per_ton: 600,
    ai_recommendation:
      "Organik fraksiyon. Biyometanizasyon veya kompost hattına alın; plastik bulaşmasını kontrol edin."
  },
  wood: {
    detected_material: "Ahşap / Palet Atığı",
    recyclability_percentage: 84.0,
    estimated_co2_saving_kg_per_ton: 1100,
    ai_recommendation:
      "Ahşap atık. Palet tamiri veya biyokütle enerjisine yönlendirilebilir; boyalı ise ayrı toplanmalı."
  },
  textile: {
    detected_material: "Tekstil / Elyaf Atığı",
    recyclability_percentage: 72.0,
    estimated_co2_saving_kg_per_ton: 3200,
    ai_recommendation:
      "Tekstil elyafı. Yeniden kullanım veya elyaf geri dönüşümüne ayırın."
  }
};

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

export async function classifyWasteImage(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 320 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(8, Math.round(bitmap.width * scale));
  const h = Math.max(8, Math.round(bitmap.height * scale));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const counts = {
    brown: 0,
    kraft: 0,
    paper: 0,
    blue: 0,
    greenGlass: 0,
    plant: 0,
    metal: 0,
    dark: 0,
    clear: 0,
    wood: 0,
    textile: 0,
    total: 0
  };

  let edge = 0;
  const lum = new Float32Array(w * h);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const { h: hue, s, v } = rgbToHsv(r, g, b);
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      lum[y * w + x] = Y;
      counts.total += 1;

      const kraftRgb =
        r > b + 20 &&
        r >= g - 5 &&
        g > b + 4 &&
        r > 70 &&
        r < 235 &&
        r - b > 28 &&
        g / Math.max(r, 1) > 0.52 &&
        g / Math.max(r, 1) < 0.95 &&
        b / Math.max(r, 1) < 0.72;

      const brown =
        kraftRgb ||
        (hue >= 12 && hue <= 48 && s >= 0.2 && s <= 0.92 && v >= 0.22 && v <= 0.88 && r > b + 12 && r >= g - 8);
      const kraft = kraftRgb || (brown && v >= 0.28 && v <= 0.78 && s >= 0.28);
      const paperWhite = v >= 0.78 && s <= 0.18;
      const bluePet = hue >= 185 && hue <= 255 && s >= 0.18 && v >= 0.25;
      const greenGlass = hue >= 70 && hue <= 165 && s >= 0.22 && v >= 0.2 && v <= 0.85 && s <= 0.75;
      const plant = hue >= 70 && hue <= 160 && s >= 0.35 && v >= 0.18 && v <= 0.75;
      const metal = s <= 0.14 && v >= 0.35 && v <= 0.92;
      const dark = v < 0.16;
      const clearGlass = s <= 0.12 && v >= 0.55 && v <= 0.92;
      const woodGrain = hue >= 18 && hue <= 42 && s >= 0.25 && v >= 0.25 && v <= 0.7 && r - b > 25;
      const textileSoft = s >= 0.35 && v >= 0.25 && v <= 0.85 && !(hue >= 12 && hue <= 48);

      if (kraft) counts.kraft += 1;
      else if (brown) counts.brown += 1;
      if (paperWhite) counts.paper += 1;
      if (bluePet) counts.blue += 1;
      if (greenGlass && !plant) counts.greenGlass += 1;
      if (plant) counts.plant += 1;
      if (metal) counts.metal += 1;
      if (dark) counts.dark += 1;
      if (clearGlass) counts.clear += 1;
      if (woodGrain) counts.wood += 1;
      if (textileSoft) counts.textile += 1;
    }
  }

  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const c = lum[y * w + x];
      const dx = lum[y * w + (x + 1)] - lum[y * w + (x - 1)];
      const dy = lum[(y + 1) * w + x] - lum[(y - 1) * w + x];
      if (Math.abs(dx) + Math.abs(dy) > 28) edge += 1;
    }
  }

  const n = counts.total || 1;
  const ratio = (k) => counts[k] / n;
  const corrugated = edge / ((w * h) / 4);

  const scores = {
    cardboard: ratio("kraft") * 4.2 + ratio("brown") * 2.4 + (corrugated > 0.12 && ratio("kraft") + ratio("brown") > 0.15 ? 0.8 : 0),
    paper: ratio("paper") * 3.4 - ratio("kraft") * 0.6,
    pet: ratio("blue") * 4.0,
    hdpe: ratio("textile") * 0.6 + (ratio("blue") < 0.08 && ratio("kraft") < 0.12 && ratio("paper") < 0.35 ? 0.2 : 0),
    glassGreen: ratio("greenGlass") * 3.6 - ratio("plant") * 1.4,
    glassClear: ratio("clear") * 2.2 - ratio("paper") * 1.1,
    metal: ratio("metal") * 2.8 - ratio("paper") * 1.5,
    organic: ratio("plant") * 3.2 + ratio("dark") * 1.4 - ratio("kraft") * 1.2,
    wood: ratio("wood") * 1.6 - ratio("kraft") * 0.8,
    textile: ratio("textile") * 1.8 - ratio("kraft") * 1.5 - ratio("blue") * 0.8
  };

  // Oluklu mukavva: kahverengi baskın + oluk dokusu
  if (ratio("greenGlass") >= 0.14 && corrugated < 0.2) {
    scores.glassGreen += 2.2;
    scores.organic -= 1.6;
  }
  if (ratio("plant") >= 0.2 && corrugated > 0.16) {
    scores.organic += 1.4;
    scores.glassGreen -= 0.8;
  }
  if (ratio("kraft") >= 0.16) scores.cardboard += 1.2;

  let best = "cardboard";
  let bestScore = -1;
  let second = 0;
  for (const [key, value] of Object.entries(scores)) {
    if (value > bestScore) {
      second = bestScore;
      bestScore = value;
      best = key;
    } else if (value > second) {
      second = value;
    }
  }

  if (bestScore < 0.35) {
    if (ratio("kraft") + ratio("brown") > ratio("paper") && ratio("kraft") + ratio("brown") > 0.1) best = "cardboard";
    else if (ratio("paper") > 0.3) best = "paper";
    else if (ratio("blue") > 0.12) best = "pet";
    else if (ratio("plant") > 0.15) best = "organic";
    else if (ratio("dark") > 0.35) best = "organic";
    else best = "paper";
  }

  const preset = MATERIALS[best] || MATERIALS.cardboard;
  const margin = Math.max(0, bestScore - second);
  const confidence = Math.min(0.98, Math.max(0.72, 0.7 + margin * 0.18 + Math.min(0.12, bestScore * 0.08)));

  return {
    ...preset,
    confidence: Number(confidence.toFixed(2)),
    analysis_method: "Renk histogramı + oluk/doku analizi"
  };
}
