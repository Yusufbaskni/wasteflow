export const DEPOT_OWNERS = [
  { depotId: "FAC-01", depot: "FAC-01 (Topkapı)", owner: "Kemal Yılmaz", phone: "0212 455 01 01" },
  { depotId: "FAC-02", depot: "FAC-02 (Zeytinburnu)", owner: "Selin Arslan", phone: "0212 455 02 02" },
  { depotId: "FAC-03", depot: "FAC-03 (Bahçelievler)", owner: "Murat Koç", phone: "0212 455 03 03" },
  { depotId: "FAC-04", depot: "FAC-04 (İstinye)", owner: "Pınar Aydın", phone: "0212 455 04 04" },
  { depotId: "FAC-05", depot: "FAC-05 (Küçükçekmece)", owner: "Hakan Demir", phone: "0212 455 05 05" }
];

export const DEFAULT_INBOX = [
  { id: 1, depotId: "FAC-03", direction: "in", time: "09:18", read: false, body: "BIN-103 doluluk %94. Öğleden önce acil boşaltma istiyoruz, saha girişinde kuyruk oluştu." },
  { id: 2, depotId: "FAC-01", direction: "in", time: "09:41", read: false, body: "PET balyaları hazır. 12:00 sonrası rampa müsait. Araç plakasını yazarsanız güvenlik listesine alıyoruz." },
  { id: 3, depotId: "FAC-05", direction: "in", time: "10:05", read: true, body: "Lastik kırma hattı bakıma alındı, yarın 14:00'e kadar kabul yok. Rotaları FAC-02'ye kaydırın." },
  { id: 4, depotId: "FAC-02", direction: "in", time: "10:22", read: true, body: "Mukavva presi arızalı değil, yanlış alarmdı. Toplama planı aynı kalsın." },
  { id: 5, depotId: "FAC-04", direction: "in", time: "11:03", read: false, body: "İSÜ Vadi cam iglosu doldu. Kampüs güvenliği COL-13 için ek konteyner talep ediyor." },
  { id: 6, depotId: "FAC-03", direction: "in", time: "11:40", read: false, body: "WEEE kabini mühürlü. Lisans belgesi fotokopisini sisteme yükledik, teyit bekliyoruz." }
];

export function ownerOf(depotId) {
  return DEPOT_OWNERS.find((o) => o.depotId === depotId) || DEPOT_OWNERS[0];
}

export function threadsFrom(messages) {
  return DEPOT_OWNERS.map((owner) => {
    const items = messages.filter((m) => m.depotId === owner.depotId);
    const unread = items.filter((m) => m.direction === "in" && !m.read).length;
    const last = items[items.length - 1];
    return { ...owner, items, unread, last };
  }).sort((a, b) => b.unread - a.unread);
}
