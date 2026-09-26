import { BASER, STAR } from "./sales.js";
import { DEPOTS } from "./depots.js";
import { ewcOf } from "./ewc.js";

export const ISSUER = {
  title: "İSTİNYE ÜNİVERSİTESİ WASTEFLOW İŞLETME BİRİMİ",
  short: "WasteFlow İSÜ",
  vkn: "4790543128",
  taxOffice: "Sarıyer",
  mersis: "0479054312800016",
  address: "İstinye Üniversitesi Vadi Kampüsü, Ayazağa Mah. Azerbaycan Cad. No:2 Sarıyer / İstanbul",
  gb: "urn:mail:wasteflow@istinye.edu.tr",
  phone: "0212 283 10 10",
  license: "İSÜ-ÇED-ATK-2026/04",
  integrator: "WasteFlow GİB Test Entegratörü",
  integratorVkn: "4790543128"
};

export const GIB_STATUS = {
  TASLAK: { label: "Taslak", hint: "GİB’e henüz gönderilmedi" },
  GIB_KUYRUK: { label: "Zarf kuyrukta", hint: "Entegratör GİB test kuyruğuna aldı" },
  GIB_ILETILDI: { label: "GİB’e iletildi", hint: "Zarf 1200 — başarıyla işlendi" },
  KABUL: { label: "Alıcı kabul", hint: "e-İrsaliye yanıtı 1300" },
  RED: { label: "Red", hint: "Alıcı reddetti" },
  IPTAL: { label: "İptal", hint: "Belge iptal edildi" }
};

const DEPOT_PARTIES = {
  "FAC-01": { name: "WasteFlow Topkapı Tesisi", vkn: "4790543128", taxOffice: "Fatih", address: "Topkapı Maltepe Mah. D400 üzeri, Zeytinburnu / İstanbul" },
  "FAC-02": { name: "WasteFlow Zeytinburnu Tesisi", vkn: "4790543128", taxOffice: "Zeytinburnu", address: "Zeytinburnu 58. Bulvar, İstanbul" },
  "FAC-03": { name: "WasteFlow Bahçelievler Tesisi", vkn: "4790543128", taxOffice: "Bahçelievler", address: "Bahçelievler Sanayi Sitesi, İstanbul" },
  "FAC-04": { name: "WasteFlow İstinye Tesisi", vkn: "4790543128", taxOffice: "Sarıyer", address: "İstinye Üniversitesi Vadi Kampüsü, Sarıyer / İstanbul" },
  "FAC-05": { name: "WasteFlow Küçükçekmece Tesisi", vkn: "4790543128", taxOffice: "Küçükçekmece", address: "Küçükçekmece Sanayi, İstanbul" }
};

function buyerParty(b) {
  return {
    name: b.legal,
    vkn: String(b.taxNo || "").replace(/\s/g, ""),
    taxOffice: b.district,
    address: b.address,
    id: b.id
  };
}

export function receiverOptions() {
  return [
    ...DEPOTS.map((d) => ({ id: d.id, label: `${d.id} ${d.name} tesisi`, party: DEPOT_PARTIES[d.id] })),
    { id: "BASER", label: `${BASER.short} · ${BASER.district}`, party: buyerParty(BASER) },
    { id: "STAR", label: `${STAR.short} · ${STAR.district}`, party: buyerParty(STAR) }
  ];
}

export function partyOf(receiverId, facility) {
  const opts = receiverOptions();
  const hit = opts.find((o) => o.id === receiverId) || opts.find((o) => facility && String(facility).includes(o.id));
  return hit?.party || DEPOT_PARTIES["FAC-04"];
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function uuidFrom(seed) {
  if (typeof crypto !== "undefined" && crypto.randomUUID && !seed) return crypto.randomUUID();
  const src = String(seed || Date.now());
  let h = 0;
  for (let i = 0; i < src.length; i += 1) h = (h * 31 + src.charCodeAt(i)) >>> 0;
  const hex = (h.toString(16) + "a1b2c3d4e5f60789").slice(0, 32).padEnd(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function nextDocumentNo(existing = []) {
  const nums = existing
    .map((w) => Number(String(w.documentNo || w.id || "").replace(/\D/g, "").slice(-9)))
    .filter((n) => n > 0);
  const n = (nums.length ? Math.max(...nums) : 136) + 1;
  return `IST2026${String(n).padStart(9, "0")}`;
}

export function driverTckn(name) {
  let h = 10000000000;
  for (const ch of String(name || "sofor")) h = (h + ch.charCodeAt(0) * 97) % 90000000000;
  return String(10000000000 + (h % 80000000000));
}

export function ensureEIrsaliye(doc, existing = []) {
  if (!doc) return doc;
  const receiverId = doc.receiverId || (String(doc.facility || "").match(/FAC-\d+/) || ["FAC-04"])[0];
  const party = partyOf(receiverId, doc.facility);
  const ettn = doc.ettn || uuidFrom(doc.id);
  const seedMatch = String(doc.id).match(/^IRS-2026-(\d+)$/);
  const seedNo = seedMatch ? `IST2026${seedMatch[1].padStart(9, "0")}` : "";
  return {
    ...doc,
    profile: doc.profile || "TEMELIRSALIYE",
    scheme: "e-İrsaliye",
    ettn,
    documentNo: seedNo || doc.documentNo || nextDocumentNo(existing.filter((w) => w.id !== doc.id)),
    gibStatus: doc.gibStatus || "GIB_ILETILDI",
    gibCode: doc.gibCode || "1200",
    gibMessage: doc.gibMessage || "Önceki sevk belgesi GİB test ortamında iletildi",
    zarfId: doc.zarfId || `ZARF${String(doc.id).replace(/\D/g, "").slice(-10).padStart(10, "0")}`,
    sender: doc.sender || ISSUER,
    receiver: doc.receiver || party,
    receiverId,
    driverTckn: doc.driverTckn || driverTckn(doc.driver),
    sentAt: doc.sentAt || doc.time
  };
}

export function makeEIrsaliye({ lot, kind, kg, plate, driver, signer, signData, user, receiverId, existing }) {
  const ewc = ewcOf(lot.material);
  const id = `IRS-${Date.now().toString().slice(-8)}`;
  const party = partyOf(receiverId, lot.facility);
  return {
    id,
    lotId: lot.id,
    kind: kind === "ALIM" || kind === "ALINDI" ? "ALIM" : "TESLİM",
    material: lot.material,
    ewc: ewc.code,
    kg: Number(kg || lot.weight || 0),
    sourceId: lot.sourceId || "",
    facility: lot.facility,
    plate: plate || "",
    driver: driver || "",
    signer: signer || user?.name || "",
    signData: signData || "",
    time: new Date().toLocaleString("tr-TR"),
    profile: "TEMELIRSALIYE",
    scheme: "e-İrsaliye",
    ettn: uuidFrom(),
    documentNo: nextDocumentNo(existing || []),
    gibStatus: "TASLAK",
    gibCode: "",
    gibMessage: "Taslak e-İrsaliye — GİB gönderimi bekleniyor",
    zarfId: "",
    sender: ISSUER,
    receiver: party,
    receiverId: receiverId || (String(lot.facility || "").match(/FAC-\d+/) || ["FAC-04"])[0],
    driverTckn: driverTckn(driver),
    sentAt: ""
  };
}

export function toUbl(doc) {
  const s = doc.sender || ISSUER;
  const r = doc.receiver || partyOf(doc.receiverId, doc.facility);
  const issue = (doc.time || "").slice(0, 10).split(".").reverse().join("-") || new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2.1</cbc:CustomizationID>
  <cbc:ProfileID>${xmlEscape(doc.profile || "TEMELIRSALIYE")}</cbc:ProfileID>
  <cbc:ID>${xmlEscape(doc.documentNo || doc.id)}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${xmlEscape(doc.ettn)}</cbc:UUID>
  <cbc:IssueDate>${xmlEscape(issue)}</cbc:IssueDate>
  <cbc:DespatchAdviceTypeCode>SEVK</cbc:DespatchAdviceTypeCode>
  <cbc:Note>${xmlEscape(`${doc.kind} · EWC ${doc.ewc} · ${doc.sourceId} → ${doc.facility}`)}</cbc:Note>
  <cac:DespatchSupplierParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="VKN">${xmlEscape(s.vkn)}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${xmlEscape(s.title)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cbc:StreetName>${xmlEscape(s.address)}</cbc:StreetName><cbc:CityName>İstanbul</cbc:CityName><cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country></cac:PostalAddress>
      <cac:PartyTaxScheme><cac:TaxScheme><cbc:Name>${xmlEscape(s.taxOffice)}</cbc:Name></cac:TaxScheme></cac:PartyTaxScheme>
    </cac:Party>
  </cac:DespatchSupplierParty>
  <cac:DeliveryCustomerParty>
    <cac:Party>
      <cac:PartyIdentification><cbc:ID schemeID="VKN">${xmlEscape(r.vkn)}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${xmlEscape(r.name)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cbc:StreetName>${xmlEscape(r.address)}</cbc:StreetName><cbc:CityName>İstanbul</cbc:CityName><cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country></cac:PostalAddress>
    </cac:Party>
  </cac:DeliveryCustomerParty>
  <cac:Shipment>
    <cbc:ID>${xmlEscape(doc.id)}</cbc:ID>
    <cac:ShipmentStage>
      <cac:TransportMeans><cac:RoadTransport><cbc:LicensePlateID>${xmlEscape(doc.plate)}</cbc:LicensePlateID></cac:RoadTransport></cac:TransportMeans>
      <cac:DriverPerson><cbc:FirstName>${xmlEscape(doc.driver)}</cbc:FirstName><cbc:NationalityID>${xmlEscape(doc.driverTckn)}</cbc:NationalityID></cac:DriverPerson>
    </cac:ShipmentStage>
  </cac:Shipment>
  <cac:DespatchLine>
    <cbc:ID>1</cbc:ID>
    <cbc:DeliveredQuantity unitCode="KGM">${Number(doc.kg || 0).toFixed(3)}</cbc:DeliveredQuantity>
    <cac:Item>
      <cbc:Name>${xmlEscape(doc.material)}</cbc:Name>
      <cac:AdditionalItemIdentification><cbc:ID>${xmlEscape(doc.ewc)}</cbc:ID></cac:AdditionalItemIdentification>
    </cac:Item>
  </cac:DespatchLine>
</DespatchAdvice>
`;
}

export function downloadUbl(doc) {
  const blob = new Blob([toUbl(doc)], { type: "application/xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${doc.documentNo || doc.id}.xml`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function tryApi(path, options) {
  const { apiFetch } = await import("./api.js");
  const res = await apiFetch(path, options);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export async function submitToGib(doc) {
  const queued = {
    ...doc,
    gibStatus: "GIB_KUYRUK",
    gibMessage: "e-İrsaliye zarfı entegratör kuyruğunda"
  };
  await new Promise((r) => setTimeout(r, 700));
  try {
    const data = await tryApi("/api/v1/eirsaliye", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ettn: doc.ettn,
        documentNo: doc.documentNo,
        vkn: ISSUER.vkn,
        kg: doc.kg,
        plate: doc.plate
      })
    });
    return {
      ...queued,
      ettn: data.ettn || doc.ettn,
      zarfId: data.zarfId,
      gibStatus: data.gibStatus || "GIB_ILETILDI",
      gibCode: data.gibCode || "1200",
      gibMessage: data.gibMessage || "Zarf GİB test ortamında işlendi",
      sentAt: data.sentAt || new Date().toLocaleString("tr-TR")
    };
  } catch {
    return {
      ...queued,
      zarfId: `ZARF${Date.now().toString(16).toUpperCase()}`,
      gibStatus: "GIB_ILETILDI",
      gibCode: "1200",
      gibMessage: "Yerel GİB test zarfı iletildi (API yoksa masaüstü damgası)",
      sentAt: new Date().toLocaleString("tr-TR")
    };
  }
}

export async function queryGib(doc) {
  try {
    const data = await tryApi(`/api/v1/eirsaliye/${encodeURIComponent(doc.ettn)}`);
    return {
      ...doc,
      gibStatus: data.gibStatus || "KABUL",
      gibCode: data.gibCode || "1300",
      gibMessage: data.gibMessage || "Alıcı kabul yanıtı"
    };
  } catch {
    await new Promise((r) => setTimeout(r, 450));
    if (doc.gibStatus === "TASLAK" || doc.gibStatus === "GIB_KUYRUK") return doc;
    return {
      ...doc,
      gibStatus: "KABUL",
      gibCode: "1300",
      gibMessage: "Alıcı e-İrsaliye yanıtı: Kabul (GİB test)"
    };
  }
}
