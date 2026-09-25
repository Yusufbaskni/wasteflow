import { COLLECTION_POINTS } from "./collectionPoints.js";

const CONTACTS = [
  "Ali Korkmaz", "Ece Yaman", "Barış Tekin", "Nilay Sönmez", "Kerem Ulu",
  "Derya Akın", "Onur Polat", "Seda Karaca", "Taner Bilgin", "İrem Çakır",
  "Volkan Ersoy", "Gizem Tan", "Serkan Ates", "Melis Doğan", "Umut Sezer",
  "Cansu Işık", "Rıza Güler", "Hazal Koçak", "Levent Sarı", "Beste Aksoy",
  "Yasin Demirtaş", "Pelin Arı", "Tolga Şen", "Nazlı Er", "Oğuz Kılıç",
  "Sibel Oral", "Emre Taş", "Hande Yüce", "Kaan Avcı", "Elif Nur"
];

export const SITE_CONTACTS = COLLECTION_POINTS.map((point, i) => ({
  siteId: point.id,
  name: point.name,
  material: point.material,
  district: point.district,
  address: point.address,
  contact: CONTACTS[i] || `Saha ${i + 1}`,
  phone: `0212 600 ${String(20 + i).padStart(2, "0")} ${String(40 + i).padStart(2, "0")}`
}));

export const DEFAULT_SITE_INBOX = [
  { id: 1, siteId: "COL-01", direction: "in", time: "08:52", read: false, body: "PET konteyner ağzına kadar doldu. Öğleden önce araç yoksa taşma riski var." },
  { id: 2, siteId: "COL-09", direction: "in", time: "09:10", read: false, body: "Mukavva presi hazır, 1,5 ton balya bekliyor. Rampa 11:00–13:00 açık." },
  { id: 3, siteId: "COL-13", direction: "in", time: "09:27", read: false, body: "İSÜ Vadi cam iglosu kırmızı. Kampüs güvenliği ikinci iglo istiyor." },
  { id: 4, siteId: "COL-23", direction: "in", time: "10:14", read: true, body: "WEEE kabini dolu. E-atık evrakı imzalandı, tır için kapı kodu: 4471." },
  { id: 5, siteId: "COL-25", direction: "in", time: "10:48", read: false, body: "Yemekhane organik konteyneri sızdırıyor. Bugün içindeki yük alınmazsa hijyen cezası yazılır." },
  { id: 6, siteId: "COL-19", direction: "in", time: "11:05", read: true, body: "Liman palet sahası dolu. 14:00 gemi yanaşması var, sahayı boşaltın." },
  { id: 7, siteId: "COL-07", direction: "in", time: "11:33", read: false, body: "Naylon film rulo halinde bağlandı. Araç 7.5 tondan kısa olursa yüklenemez." },
  { id: 8, siteId: "COL-29", direction: "in", time: "12:01", read: false, body: "Tehlikeli atık kabini mühür bekliyor. Lisanslı şoför belgesi olmadan teslim yok." }
];

export function siteContact(siteId) {
  return SITE_CONTACTS.find((s) => s.siteId === siteId) || SITE_CONTACTS[0];
}

export function siteThreads(messages) {
  return SITE_CONTACTS.map((site) => {
    const items = messages.filter((m) => m.siteId === site.siteId);
    const unread = items.filter((m) => m.direction === "in" && !m.read).length;
    const last = items[items.length - 1];
    return { ...site, items, unread, last };
  }).sort((a, b) => b.unread - a.unread || a.siteId.localeCompare(b.siteId));
}
