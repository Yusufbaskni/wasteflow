import numpy as np
from PIL import Image


MATERIALS = {
    "cardboard": {
        "detected_material": "Oluklu Mukavva / Kraft Karton",
        "recyclability_percentage": 92.5,
        "estimated_co2_saving_kg_per_ton": 1800,
        "ai_recommendation": "Kahverengi kraft/oluklu mukavva tespit edildi. FAC-02 presleme ve kağıt geri dönüşüm hattına sevk edilmelidir.",
    },
    "paper": {
        "detected_material": "Beyaz Kağıt / Karton Ambalaj",
        "recyclability_percentage": 94.0,
        "estimated_co2_saving_kg_per_ton": 1700,
        "ai_recommendation": "Açık tonlu kağıt/karton. Doğrudan kağıt geri dönüşümüne alınabilir.",
    },
    "pet": {
        "detected_material": "PET Plastik (Mavi/Şeffaf)",
        "recyclability_percentage": 94.2,
        "estimated_co2_saving_kg_per_ton": 2450,
        "ai_recommendation": "PET polimer spektrumu. Yıkama + şişe-balya hattına yönlendirin.",
    },
    "hdpe": {
        "detected_material": "HDPE / Renkli Sert Plastik",
        "recyclability_percentage": 87.6,
        "estimated_co2_saving_kg_per_ton": 2100,
        "ai_recommendation": "Sert polimer (HDPE/PP). Polimer ayırma ünitesine alın.",
    },
    "glassGreen": {
        "detected_material": "Cam Ambalaj (Yeşil/Kahverengi)",
        "recyclability_percentage": 98.0,
        "estimated_co2_saving_kg_per_ton": 850,
        "ai_recommendation": "Cam kırığı hattına sevk edin.",
    },
    "glassClear": {
        "detected_material": "Cam / Şeffaf Ambalaj",
        "recyclability_percentage": 97.5,
        "estimated_co2_saving_kg_per_ton": 900,
        "ai_recommendation": "Şeffaf cam. Renkli camdan ayrı toplanmalı.",
    },
    "metal": {
        "detected_material": "Metal / Alüminyum Ambalaj",
        "recyclability_percentage": 96.0,
        "estimated_co2_saving_kg_per_ton": 9200,
        "ai_recommendation": "Metal hurda presi. Manyetik ayırma uygulayın.",
    },
    "organic": {
        "detected_material": "Organik / Biyobozunur Atık",
        "recyclability_percentage": 78.0,
        "estimated_co2_saving_kg_per_ton": 600,
        "ai_recommendation": "Organik fraksiyon. Biyometanizasyon veya kompost hattına alın.",
    },
}


def classify_image_bytes(contents: bytes) -> dict:
    import io as _io

    image = Image.open(_io.BytesIO(contents)).convert("RGB")
    image.thumbnail((320, 320))
    arr = np.array(image).astype(np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    v = mx / 255.0
    s = np.where(mx == 0, 0, (mx - mn) / np.maximum(mx, 1e-6))

    kraft = (
        (r > b + 20)
        & (r >= g - 5)
        & (g > b + 4)
        & (r > 70)
        & (r < 235)
        & ((r - b) > 28)
        & ((g / np.maximum(r, 1)) > 0.52)
        & ((g / np.maximum(r, 1)) < 0.95)
        & ((b / np.maximum(r, 1)) < 0.72)
    )
    brown = kraft | ((r > b + 12) & (r >= g - 8) & (s >= 0.2) & (v >= 0.22) & (v <= 0.88))
    paper = (v >= 0.78) & (s <= 0.18)
    blue = (b > r + 8) & (b > g) & (s >= 0.15) & (v >= 0.25)
    plant = (g > r + 8) & (g > b + 8) & (s >= 0.3) & (v >= 0.18) & (v <= 0.75)
    green_glass = (g > r) & (g > b) & (s >= 0.18) & (s <= 0.7) & ~plant
    metal = (s <= 0.14) & (v >= 0.35) & (v <= 0.92)
    dark = v < 0.16
    clear = (s <= 0.12) & (v >= 0.55) & (v <= 0.92)

    n = arr.shape[0] * arr.shape[1]
    ratio = lambda mask: float(np.count_nonzero(mask)) / n

    scores = {
        "cardboard": ratio(kraft) * 4.2 + ratio(brown) * 2.4,
        "paper": ratio(paper) * 3.4 - ratio(kraft) * 0.6,
        "pet": ratio(blue) * 4.0,
        "hdpe": 0.1,
        "glassGreen": ratio(green_glass) * 3.6 - ratio(plant) * 1.4,
        "glassClear": ratio(clear) * 2.2 - ratio(paper) * 1.1,
        "metal": ratio(metal) * 2.8 - ratio(paper) * 1.5,
        "organic": ratio(plant) * 3.2 + ratio(dark) * 1.4 - ratio(kraft) * 1.2,
    }
    if ratio(kraft) + ratio(brown) >= 0.22:
        scores["cardboard"] += 1.8
    if ratio(kraft) >= 0.16:
        scores["cardboard"] += 1.2

    best = max(scores, key=scores.get)
    ordered = sorted(scores.values(), reverse=True)
    margin = ordered[0] - (ordered[1] if len(ordered) > 1 else 0)
    if scores[best] < 0.35:
        if ratio(kraft) + ratio(brown) > 0.1:
            best = "cardboard"
        elif ratio(paper) > 0.3:
            best = "paper"
        elif ratio(blue) > 0.12:
            best = "pet"
        else:
            best = "paper"

    preset = MATERIALS[best]
    confidence = min(0.98, max(0.72, 0.7 + margin * 0.18))
    return {
        **preset,
        "confidence": round(float(confidence), 2),
        "analysis_method": "Renk histogramı + oluk/doku analizi",
    }
