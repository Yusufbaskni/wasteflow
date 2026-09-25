export const EWC_BY_MATERIAL = {
  "PET Plastik": { code: "15 01 02", label: "Plastik ambalaj", hazardous: false },
  "HDPE Plastik": { code: "15 01 02", label: "Plastik ambalaj", hazardous: false },
  "PP Plastik": { code: "15 01 02", label: "Plastik ambalaj", hazardous: false },
  "LDPE Film / Naylon": { code: "15 01 02", label: "Plastik ambalaj", hazardous: false },
  "Oluklu Mukavva": { code: "15 01 01", label: "Kâğıt ve karton ambalaj", hazardous: false },
  "Beyaz Kağıt / Karton": { code: "15 01 01", label: "Kâğıt ve karton ambalaj", hazardous: false },
  "Cam Ambalaj": { code: "15 01 07", label: "Cam ambalaj", hazardous: false },
  "Alüminyum Ambalaj": { code: "15 01 04", label: "Metal ambalaj", hazardous: false },
  "Hurda Demir / Çelik": { code: "16 01 17", label: "Demir metaller", hazardous: false },
  "Ahşap Palet": { code: "15 01 03", label: "Ahşap ambalaj", hazardous: false },
  "Tekstil / Elyaf": { code: "04 02 22", label: "İşlenmiş tekstil elyafı", hazardous: false },
  "Elektronik Atık (WEEE)": { code: "16 02 14", label: "Atık elektrikli elektronik eşya", hazardous: false },
  "Organik / Gıda Atığı": { code: "20 01 08", label: "Biyobozunur mutfak atığı", hazardous: false },
  "Lastik / Kauçuk": { code: "16 01 03", label: "Ömrünü tamamlamış lastikler", hazardous: false },
  "Karışık Ambalaj": { code: "15 01 06", label: "Karışık ambalaj", hazardous: false },
  "Tehlikeli Kimyasal Atık": { code: "16 05 08*", label: "Kullanılmış tehlikeli kimyasallar", hazardous: true }
};

export const LICENSE_NOTICE =
  "Lisans: İSÜ-ÇED-ATK-2026/04 · Çevre İzin ve Lisans Yönetmeliği. Tehlikeli atık (yıldızlı EWC) yalnız FAC-03 Bahçelievler lisanslı hattında kabul edilir.";

export function ewcOf(material) {
  return EWC_BY_MATERIAL[material] || { code: "15 01 06", label: "Karışık ambalaj", hazardous: false };
}
