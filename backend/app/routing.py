FACILITIES = {
    "hazard": "FAC-03 (Bahçelievler)",
    "cardboard": "FAC-02 (Zeytinburnu)",
    "glass": "FAC-04 (İstinye)",
    "hdpe": "FAC-05 (Küçükçekmece)",
    "pet": "FAC-01 (Topkapı)",
    "default": "FAC-02 (Zeytinburnu)",
}


def recommend_facility(material: str) -> dict:
    m = (material or "").lower()
    if any(k in m for k in ("tehlikeli", "kimyasal", "hazard", "atıksu", "çamur")):
        return {
            "facility": FACILITIES["hazard"],
            "reason": "Tehlikeli atık lisanslı FAC-03 hattına yönlendirildi.",
        }
    if any(k in m for k in ("elektronik", "weee", "e-atık", "e-atik")):
        return {
            "facility": FACILITIES["hazard"],
            "reason": "WEEE / elektronik atık FAC-03 lisanslı ayırma hattına yönlendirildi.",
        }
    if any(k in m for k in ("mukavva", "karton", "kağıt", "kagit", "paper")):
        return {
            "facility": FACILITIES["cardboard"],
            "reason": "Kağıt/oluklu mukavva FAC-02 presleme hattına yönlendirildi.",
        }
    if "cam" in m or "glass" in m:
        return {
            "facility": FACILITIES["glass"],
            "reason": "Cam ambalaj FAC-04 kırma hattına yönlendirildi.",
        }
    if any(k in m for k in ("alüminyum", "aluminyum", "hurda", "demir", "çelik", "celik", "metal")):
        return {
            "facility": FACILITIES["pet"],
            "reason": "Metal fraksiyon FAC-01 haddahane/ayırma hattına yönlendirildi.",
        }
    if any(k in m for k in ("ahşap", "ahsap", "palet", "tekstil", "elyaf")):
        return {
            "facility": FACILITIES["cardboard"],
            "reason": "Ahşap/tekstil FAC-02 balyalama hattına yönlendirildi.",
        }
    if any(k in m for k in ("organik", "gıda", "gida", "biyobozunur")):
        return {
            "facility": FACILITIES["glass"],
            "reason": "Organik atık FAC-04 kompost hattına yönlendirildi.",
        }
    if any(k in m for k in ("lastik", "kauçuk", "kaucuk")):
        return {
            "facility": FACILITIES["hdpe"],
            "reason": "Lastik/kauçuk FAC-05 kırma ünitesine yönlendirildi.",
        }
    if "hdpe" in m or "pp plastik" in m or "sert plastik" in m:
        return {
            "facility": FACILITIES["hdpe"],
            "reason": "HDPE/PP FAC-05 polimer ayırma ünitesine yönlendirildi.",
        }
    if any(k in m for k in ("pet", "ldpe", "naylon", "polimer", "plastik")):
        return {
            "facility": FACILITIES["pet"],
            "reason": "PET/polimer FAC-01 yıkama-balya hattına yönlendirildi.",
        }
    return {
        "facility": FACILITIES["default"],
        "reason": "Karışık fraksiyon FAC-02 aktarma deposuna alındı.",
    }
