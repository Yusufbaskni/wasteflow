export const DEPOT_MANAGERS = [
  { id: "MGR-01A", depotId: "FAC-01", depot: "FAC-01 (Topkapı)", title: "Depo Müdürü", shift: "Gündüz", name: "Kemal Yılmaz", gender: "Erkek", age: 46, phone: "0532 410 0101", salary: 108500, address: "Maltepe Mah. Hadımköy Cad. No:18 Fatih / İstanbul" },
  { id: "MGR-01B", depotId: "FAC-01", depot: "FAC-01 (Topkapı)", title: "Vardiya Müdürü", shift: "Gece", name: "Leyla Acar", gender: "Kadın", age: 39, phone: "0532 410 0102", salary: 86500, address: "Sulukule Cad. No:7 Fatih / İstanbul" },
  { id: "MGR-02A", depotId: "FAC-02", depot: "FAC-02 (Zeytinburnu)", title: "Depo Müdürü", shift: "Gündüz", name: "Selin Arslan", gender: "Kadın", age: 44, phone: "0532 410 0201", salary: 106000, address: "Seyitnizam Mah. Abay Cad. No:22 Zeytinburnu / İstanbul" },
  { id: "MGR-02B", depotId: "FAC-02", depot: "FAC-02 (Zeytinburnu)", title: "Vardiya Müdürü", shift: "Gece", name: "Baran Kılıç", gender: "Erkek", age: 41, phone: "0532 410 0202", salary: 84800, address: "Kazlıçeşme Mah. Kennedy Cad. No:41 Zeytinburnu / İstanbul" },
  { id: "MGR-03A", depotId: "FAC-03", depot: "FAC-03 (Bahçelievler)", title: "Depo Müdürü", shift: "Gündüz", name: "Murat Koç", gender: "Erkek", age: 48, phone: "0532 410 0301", salary: 111200, address: "Şirinevler Mah. Eski Londra Asfaltı No:56 Bahçelievler / İstanbul" },
  { id: "MGR-03B", depotId: "FAC-03", depot: "FAC-03 (Bahçelievler)", title: "Vardiya Müdürü", shift: "Gece", name: "Nilüfer Şen", gender: "Kadın", age: 37, phone: "0532 410 0302", salary: 87200, address: "Yenibosna Mah. Kuyumcular Sok. No:9 Bahçelievler / İstanbul" },
  { id: "MGR-04A", depotId: "FAC-04", depot: "FAC-04 (İstinye)", title: "Depo Müdürü", shift: "Gündüz", name: "Pınar Aydın", gender: "Kadın", age: 43, phone: "0532 410 0401", salary: 109800, address: "İstinye Mah. Akgün Sok. No:12 Sarıyer / İstanbul" },
  { id: "MGR-04B", depotId: "FAC-04", depot: "FAC-04 (İstinye)", title: "Vardiya Müdürü", shift: "Gece", name: "Cemre Usta", gender: "Erkek", age: 36, phone: "0532 410 0402", salary: 85900, address: "Vadi Kampüs Lojmanları No:4 Sarıyer / İstanbul" },
  { id: "MGR-05A", depotId: "FAC-05", depot: "FAC-05 (Küçükçekmece)", title: "Depo Müdürü", shift: "Gündüz", name: "Hakan Demir", gender: "Erkek", age: 51, phone: "0532 410 0501", salary: 107400, address: "Halkalı Merkez Mah. Atatürk Cad. No:88 Küçükçekmece / İstanbul" },
  { id: "MGR-05B", depotId: "FAC-05", depot: "FAC-05 (Küçükçekmece)", title: "Vardiya Müdürü", shift: "Gece", name: "Gökhan Bal", gender: "Erkek", age: 40, phone: "0532 410 0502", salary: 84100, address: "İkitelli OSB Mah. Entegre Cad. No:15 Küçükçekmece / İstanbul" }
];

const ROLES = [
  { title: "Kantar operatörü", salary: 36500 },
  { title: "Pres operatörü", salary: 38200 },
  { title: "Ayırma hattı operatörü", salary: 34800 },
  { title: "Forklift operatörü", salary: 40100 },
  { title: "Bakım teknisyeni", salary: 44800 },
  { title: "Saha operatörü", salary: 33600 },
  { title: "Güvenlik görevlisi", salary: 31200 },
  { title: "İdari personel", salary: 39400 },
  { title: "Çevre uzmanı", salary: 52100 },
  { title: "Vardiya amiri", salary: 61200 }
];

const DISTRICTS = {
  "FAC-01": { district: "Fatih", streets: ["Topkapı Maltepe Cad.", "Davutpaşa Cad.", "Vatan Cad.", "Adnan Menderes Bulvarı"] },
  "FAC-02": { district: "Zeytinburnu", streets: ["Abay Cad.", "Prof. Muammer Aksoy Cad.", "58. Bulvar", "Kazlıçeşme Sok."] },
  "FAC-03": { district: "Bahçelievler", streets: ["Şirinevler Cad.", "Mehmet Akif Cad.", "Kocasinan Bulvarı", "Yenibosna Merkez Cad."] },
  "FAC-04": { district: "Sarıyer", streets: ["İstinye Bayırı", "Akgün Sok.", "Büyükdere Cad.", "Tarabya Cad."] },
  "FAC-05": { district: "Küçükçekmece", streets: ["Halkalı Cad.", "Atatürk Cad.", "İkitelli Cad.", "Söğütlüçeşme Sok."] }
};

const MEN = ["Ali", "Mehmet", "Mustafa", "Ahmet", "Hüseyin", "Hasan", "İbrahim", "Yusuf", "Ömer", "Emre", "Burak", "Can", "Onur", "Serkan", "Volkan", "Kerem", "Tolga", "Oğuz", "Rıza", "Taner"];
const WOMEN = ["Ayşe", "Fatma", "Emine", "Hatice", "Zeynep", "Elif", "Merve", "Elif Nur", "Seda", "Gizem", "Derya", "Cansu", "Hazal", "Beste", "Hande", "Nazlı", "Pelin", "İrem", "Melis", "Sibel"];
const SURNAMES = ["Yıldız", "Kaya", "Demir", "Şahin", "Çelik", "Yılmaz", "Aydın", "Öztürk", "Aslan", "Doğan", "Koç", "Kurt", "Özdemir", "Polat", "Ersoy", "Aksoy", "Güneş", "Taş", "Avcı", "Karaca", "Tekin", "Sönmez", "Ulu", "Bilgin", "Çakır"];

const DRIVERS = [
  { name: "Ahmet Yıldız", plate: "34 WF 101" },
  { name: "Mehmet Kaya", plate: "34 WF 102" },
  { name: "Ayşe Demir", plate: "34 WF 103" },
  { name: "Can Özkan", plate: "34 ISU 104" },
  { name: "Elif Şahin", plate: "34 WF 105" },
  { name: "Burak Aydın", plate: "34 WF 106" },
  { name: "Zeynep Arslan", plate: "34 WF 107" },
  { name: "Hakan Çelik", plate: "34 WF 108" },
  { name: "Selin Koç", plate: "34 WF 109" },
  { name: "Okan Yılmaz", plate: "34 WF 110" },
  { name: "Fatma Aksoy", plate: "34 WF 111" },
  { name: "Emre Güneş", plate: "34 WF 112" },
  { name: "Deniz Acar", plate: "34 WF 113" },
  { name: "Merve Uçar", plate: "34 WF 114" },
  { name: "Yusuf Eren", plate: "34 WF 115" }
];

const DEPOT_LIST = [
  { depotId: "FAC-01", depot: "FAC-01 (Topkapı)" },
  { depotId: "FAC-02", depot: "FAC-02 (Zeytinburnu)" },
  { depotId: "FAC-03", depot: "FAC-03 (Bahçelievler)" },
  { depotId: "FAC-04", depot: "FAC-04 (İstinye)" },
  { depotId: "FAC-05", depot: "FAC-05 (Küçükçekmece)" }
];

function addr(depotId, i) {
  const loc = DISTRICTS[depotId];
  const street = loc.streets[i % loc.streets.length];
  return `${street} No:${12 + (i % 86)} ${loc.district} / İstanbul`;
}

function person({ id, name, gender, age, title, depotId, depot, salary, address, phone, extra }) {
  return { id, name, gender, age, title, depotId, depot, salary, address, phone, ...extra };
}

export const STAFF_TITLES = ["Patron", "Depo Müdürü", "Vardiya Müdürü", "Şoför", ...ROLES.map((r) => r.title)];

export const STAFF_DEPOTS = DEPOT_LIST;

export function nextStaffId(roster) {
  const nums = roster.map((p) => Number(String(p.id || "").replace(/\D/g, ""))).filter((n) => Number.isFinite(n));
  return `PER-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
}

export function makeStaff(partial, roster = []) {
  const depot = DEPOT_LIST.find((d) => d.depotId === partial.depotId) || DEPOT_LIST[3];
  const kind = partial.kind || (partial.title === "Patron" ? "patron" : partial.title === "Şoför" ? "şoför" : /müdür/i.test(partial.title || "") ? "müdür" : "personel");
  return person({
    id: partial.id || nextStaffId(roster),
    name: String(partial.name || "").trim(),
    gender: partial.gender || "Erkek",
    age: Number(partial.age || 25),
    title: partial.title || "Saha operatörü",
    depotId: depot.depotId,
    depot: depot.depot,
    salary: Number(partial.salary || 0),
    address: partial.address || addr(depot.depotId, roster.length + 7),
    phone: partial.phone || `0532 700 ${String(1000 + roster.length).slice(-4)}`,
    extra: {
      kind,
      shift: partial.shift || "Gündüz",
      plate: partial.plate || "",
      hiredAt: partial.hiredAt || new Date().toLocaleString("tr-TR")
    }
  });
}

export const DEFAULT_STAFF = (() => {
  const rows = [];
  DEPOT_MANAGERS.forEach((m, i) => {
    rows.push(person({
      id: `PER-${String(i + 1).padStart(3, "0")}`,
      name: m.name,
      gender: m.gender,
      age: m.age,
      title: m.title,
      depotId: m.depotId,
      depot: m.depot,
      salary: m.salary,
      address: m.address,
      phone: m.phone,
      extra: { managerId: m.id, shift: m.shift, kind: "müdür" }
    }));
  });
  DRIVERS.forEach((d, i) => {
    const depot = DEPOT_LIST[i % 5];
    const woman = ["Ayşe", "Elif", "Zeynep", "Selin", "Fatma", "Merve"].some((n) => d.name.startsWith(n));
    rows.push(person({
      id: `PER-${String(11 + i).padStart(3, "0")}`,
      name: d.name,
      gender: woman ? "Kadın" : "Erkek",
      age: 28 + (i * 2) % 22,
      title: "Şoför",
      depotId: depot.depotId,
      depot: depot.depot,
      salary: 44500 + (i % 8) * 650,
      address: addr(depot.depotId, i + 20),
      phone: `0532 511 ${String(2001 + i).slice(-4)}`,
      extra: { plate: d.plate, kind: "şoför" }
    }));
  });
  let n = rows.length;
  let i = 0;
  while (n < 120) {
    const depot = DEPOT_LIST[i % 5];
    const role = ROLES[i % ROLES.length];
    const woman = i % 3 !== 1;
    const first = woman ? WOMEN[i % WOMEN.length] : MEN[i % MEN.length];
    const last = SURNAMES[(i * 3) % SURNAMES.length];
    rows.push(person({
      id: `PER-${String(n + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      gender: woman ? "Kadın" : "Erkek",
      age: 23 + ((i * 5) % 35),
      title: role.title,
      depotId: depot.depotId,
      depot: depot.depot,
      salary: role.salary + (i % 11) * 400,
      address: addr(depot.depotId, i + 40),
      phone: `0212 600 ${String(30 + (i % 50)).padStart(2, "0")} ${String(10 + (i % 80)).padStart(2, "0")}`,
      extra: { kind: "personel", shift: i % 2 ? "Gündüz" : "Gece" }
    }));
    n += 1;
    i += 1;
  }
  rows.unshift(person({
    id: "PER-000",
    name: "Yusuf Başkani",
    gender: "Erkek",
    age: 20,
    title: "Patron",
    depotId: "FAC-04",
    depot: "Merkez · FAC-04 (İstinye)",
    salary: 780000,
    address: "İstinye Üniversitesi Vadi Kampüsü, Sarıyer / İstanbul",
    phone: "0532 000 2026",
    extra: { kind: "patron", shift: "Gündüz" }
  }));
  return rows;
})();

export function managerOf(id) {
  return DEPOT_MANAGERS.find((m) => m.id === id) || DEPOT_MANAGERS[0];
}

export function managersForDepot(depotId) {
  return DEPOT_MANAGERS.filter((m) => m.depotId === depotId);
}

export function staffStats(roster = DEFAULT_STAFF, perfList = []) {
  const payroll = roster.reduce((s, p) => s + Number(p.salary || 0), 0);
  const women = roster.filter((p) => p.gender === "Kadın").length;
  const perfById = Object.fromEntries((perfList || []).map((d) => [d.id, d]));
  const bonus = roster.reduce((s, p) => s + Math.round(Number(p.salary || 0) * Number(perfById[p.depotId]?.rate || 0)), 0);
  const byDepot = ["FAC-01", "FAC-02", "FAC-03", "FAC-04", "FAC-05"].map((id) => {
    const people = roster.filter((p) => p.depotId === id);
    const maas = people.reduce((s, p) => s + Number(p.salary || 0), 0);
    const rate = Number(perfById[id]?.rate || 0);
    return {
      tesis: id,
      kisi: people.length,
      maas,
      prim: Math.round(maas * rate),
      skor: perfById[id]?.score || 0,
      oran: rate,
      mudur: people.filter((p) => p.kind === "müdür").length,
      sofor: people.filter((p) => p.kind === "şoför").length
    };
  });
  return {
    count: roster.length,
    payroll,
    bonus,
    gross: payroll + bonus,
    women,
    men: roster.length - women,
    managers: roster.filter((p) => p.kind === "müdür").length,
    drivers: roster.filter((p) => p.kind === "şoför").length,
    patrons: roster.filter((p) => p.kind === "patron").length,
    byDepot
  };
}

export const DEFAULT_MANAGER_INBOX = [
  { id: 1, managerId: "MGR-03A", direction: "in", time: "08:40", read: false, body: "FAC-03 lisanslı hat bu sabah mührü kontrol etti. WEEE kabini için imza bekliyoruz." },
  { id: 2, managerId: "MGR-01B", direction: "in", time: "09:05", read: false, body: "Gece vardiyasında PET rampa kuyruğu oluştu. Gündüz ekibinden 1 forklift rica ederim." },
  { id: 3, managerId: "MGR-04A", direction: "in", time: "09:22", read: false, body: "İSÜ Vadi cam iglosu doldu. Kampüs güvenlik COL-13 için ek konteyner istiyor." },
  { id: 4, managerId: "MGR-02A", direction: "in", time: "09:48", read: true, body: "Mukavva presi hazır. 11:00–13:00 arası araç kabulü açık." },
  { id: 5, managerId: "MGR-05B", direction: "in", time: "10:11", read: false, body: "Gece lastik kırma bakımı bitti. Sabah 07:00’den itibaren FAC-05 kabul açık." },
  { id: 6, managerId: "MGR-01A", direction: "in", time: "10:36", read: false, body: "Kantar kalibrasyonu tamam. LOT tartımlarını yeni fiş seri IRS-2026 ile kesin." },
  { id: 7, managerId: "MGR-03B", direction: "in", time: "11:02", read: true, body: "Tehlikeli atık kabini gece mühürlendi. Lisanslı şoför belgesi olmadan teslim yok." },
  { id: 8, managerId: "MGR-04B", direction: "in", time: "11:28", read: false, body: "Organik konteyner sızdırıyor, gece ekibi hortum değiştirdi. Sabah kontrol istendi." }
];

export function managerThreads(messages) {
  return DEPOT_MANAGERS.map((mgr) => {
    const items = messages.filter((m) => m.managerId === mgr.id);
    const unread = items.filter((m) => m.direction === "in" && !m.read).length;
    const last = items[items.length - 1];
    return { ...mgr, items, unread, last };
  }).sort((a, b) => b.unread - a.unread || a.id.localeCompare(b.id));
}

export function formatTry(n) {
  return `${Number(n || 0).toLocaleString("tr-TR")} ₺`;
}
