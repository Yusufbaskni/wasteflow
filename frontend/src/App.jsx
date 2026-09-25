import React, { useState, useEffect, useRef } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./styles.css";
import { classifyWasteImage } from "./classifyWasteImage.js";
import { apiFetch, allLocalUsers, createLotRemote, getApiBase, loginRequest, mapLot, patchLotRemote, resolveApiBase } from "./api.js";
import { DEFAULT_LOTS, esgFromLots, loadState, mergeLots, metricsFromLots, saveState } from "./storage.js";
import { applyRouting, FACILITY_OPTIONS, MATERIAL_OPTIONS, parseLotsCsv, recommendRoute } from "./routing.js";
import { canAccess, defaultTab } from "./roles.js";
import { fillForDepot, lotsForDepot, pinColor, DEPOTS } from "./depots.js";
import { COLLECTION_MATERIALS, COLLECTION_POINTS, groupCollectionByMaterial, sourcesForMaterial, withCollectionFill } from "./collectionPoints.js";
import { downloadExcelReport, printAuditPdf, printCarbonCertificate, printDriverManifest, printPdfReport, printWaybill } from "./report.js";
import { notifyCriticalBins } from "./alerts.js";
import DepotMap from "./DepotMap.jsx";
import LotQr, { lotQrPayload, printLotLabel } from "./LotQr.jsx";
import { sevenDayForecast, vehicleDispatchAdvice } from "./forecast.js";
import { planDailyRoutes } from "./collectionRoutes.js";
import { CIRCULARITY_TARGET, economicsFromLots } from "./economics.js";
import { ewcOf, LICENSE_NOTICE } from "./ewc.js";
import { makeWaybill, massBalance, mergeWaybills, nowClock, pushEvent, seedEvents } from "./chain.js";
import SignaturePad from "./SignaturePad.jsx";
import { fetchLiveFx, formatMoney, loadCachedFx } from "./fx.js";
import { compressImageFile } from "./imageThumb.js";
import QrScanner from "./QrScanner.jsx";
import JuryTour from "./JuryTour.jsx";
import FleetMap from "./FleetMap.jsx";
import { dispatchMessage, FLEET_DESTINATIONS, INITIAL_FLEET, smsHref, tickFleet, waHref } from "./fleet.js";
import { DEFAULT_INBOX, ownerOf, threadsFrom } from "./depotInbox.js";
import { DEFAULT_SITE_INBOX, siteContact, siteThreads } from "./collectionInbox.js";
import { DEFAULT_MANAGER_INBOX, DEFAULT_STAFF, formatTry, makeStaff, managerOf, managersForDepot, managerThreads, STAFF_DEPOTS, STAFF_TITLES, staffStats } from "./staff.js";
import { depotPerformance, payFor } from "./bonus.js";
import { BASER, STAR, compareKgPrices, makeSale, mergeSales, salesFor, soldLotIds, summarizeSales } from "./sales.js";
import SalesDesk from "./SalesDesk.jsx";

// --- Kurumsal Sözlük (TR / EN) ---
const dict = {
  tr: {
    title: "WASTEFLOW ENTERPRISE",
    subtitle: "Endüstriyel Atık Yönetimi ve Döngüsel Ekonomi Platformu",
    overview: "Gösterge Paneli",
    operations: "Operasyon & Rotalama",
    lots: "Envanter & Lot Yönetimi",
    aiVision: "Görsel Materyal Analizi",
    iotBins: "IoT Telemetri & Konteyner",
    esg: "ESG & Sürdürülebilirlik",
    audit: "Sistem Denetim Günlüğü",
    settings: "Sistem & Entegrasyon",
    connected: "SUNUCU BAĞLANTISI AKTİF",
    circularity: "Döngüsellik Endeksi",
    recycled: "Geri Dönüştürülen Hacim",
    reused: "Yeniden Kullanılan Hacim",
    landfilled: "Atık Depolama Hacmi",
    co2Savings: "Engellenen CO₂ Emisyonu",
    aiForecastTitle: "Kestirimci Analiz & Tesis Yük Uyarısı",
    newProduction: "Yeni Lot Kaydı Oluşturma",
    lotRouting: "AI Rotalama ve Karar Destek Motoru",
    bulkImport: "Toplu Veri Aktarımı (CSV)",
    saveToSystem: "Sisteme Kaydet",
    confirmRoute: "Rotalamayı Onayla",
    applyAi: "AI Kararını Uygula",
    searchPlaceholder: "Lot, COL, plaka, müdür, personel ara...",
    qrLabel: "Barkod / QR",
    printLabel: "Etiketi Yazdır",
    close: "Kapat",
    logout: "Oturumu Kapat",
    loginTitle: "WasteFlow Kurumsal Portalı",
    loginSubtitle: "Yetkili Personel Kimlik Doğrulama",
    loginBtn: "Sisteme Giriş Yap",
    loginError: "Kullanıcı adı veya parola hatalı.",
    loginHint: "Admin: yusuf.baskan / Istinye2026 · Operatör: operator / Operator2026 · Yönetici: yonetici / Yonetici2026",
    map: "Depo Haritası",
    reports: "Raporlar",
    collection: "Toplama Alanları",
    routes: "Toplama Rotası",
    fleet: "Araç & Sürücüler",
    inbox: "Depo Mesajları",
    siteInbox: "Toplama Mesajları",
    waybills: "İrsaliyeler",
    sales: "Satış · Başer",
    salesStar: "Satış · Star",
    priceCompare: "1 kg karşılaştır",
    managers: "Müdürler",
    staff: "Personel",
    hr: "İnsan Kaynakları"
  },
  en: {
    title: "WASTEFLOW ENTERPRISE",
    subtitle: "Industrial Waste Management Platform",
    overview: "Dashboard",
    operations: "Operations & Routing",
    lots: "Inventory & Lot Management",
    aiVision: "Visual Material Analytics",
    iotBins: "IoT Telemetry & Bins",
    esg: "ESG & Sustainability",
    audit: "System Audit Logs",
    settings: "System & Integration",
    connected: "SERVER LIVE",
    circularity: "Circularity Index",
    recycled: "Recycled Volume",
    reused: "Reused Volume",
    landfilled: "Landfilled Volume",
    co2Savings: "Avoided CO₂ Emissions",
    aiForecastTitle: "Predictive Analytics & Capacity Warning",
    newProduction: "Create New Lot Record",
    lotRouting: "AI Routing & Decision Support Engine",
    bulkImport: "Bulk Import (CSV)",
    saveToSystem: "Commit to System",
    confirmRoute: "Confirm Routing",
    applyAi: "Execute Recommendation",
    searchPlaceholder: "Search lot, COL, plate, manager or staff...",
    qrLabel: "Barcode / QR",
    printLabel: "Print Label",
    close: "Close",
    logout: "Sign Out",
    loginTitle: "WasteFlow Corporate Portal",
    loginSubtitle: "Authorized Personnel Authentication",
    loginBtn: "Authenticate",
    loginError: "Invalid username or password.",
    loginHint: "Admin: yusuf.baskan / Istinye2026 · Operator: operator / Operator2026 · Manager: yonetici / Yonetici2026",
    map: "Depot Map",
    reports: "Reports",
    collection: "Collection Sites",
    routes: "Pickup Routes",
    fleet: "Vehicles & Drivers",
    inbox: "Depot Inbox",
    siteInbox: "Collection Inbox",
    waybills: "Waybills",
    sales: "Sales · Başer",
    salesStar: "Sales · Star",
    priceCompare: "1 kg compare",
    managers: "Depot Managers",
    staff: "Staff",
    hr: "Human Resources"
  }
};

const LOGO_SRC = `${import.meta.env.BASE_URL}istinye-logo.svg`;

export default function App() {
  const saved = loadState();
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(saved.session));
  const [user, setUser] = useState(saved.session || { name: "", role: "" });
  const [lang, setLang] = useState("tr");
  const [tab, setTab] = useState("overview");
  const [apiBase, setApiBase] = useState(getApiBase());
  const docsUrl = `${apiBase.replace(/\/$/, "")}/docs`;
  const [serverLive, setServerLive] = useState(false);

  const [metrics, setMetrics] = useState(() => metricsFromLots(mergeLots([], saved.lots || [])));
  const [lots, setLots] = useState(() => mergeLots([], saved.lots || []).map(seedEvents));
  const [iotBins, setIotBins] = useState([
    { bin_id: "BIN-101", location: "FAC-01 Topkapı Deposu", fill_percentage: 86.4, battery_level: 91.0, last_updated: "4 dk önce" },
    { bin_id: "BIN-102", location: "FAC-02 Zeytinburnu Deposu", fill_percentage: 41.8, battery_level: 77.0, last_updated: "11 dk önce" },
    { bin_id: "BIN-103", location: "FAC-03 Bahçelievler Deposu", fill_percentage: 91.7, battery_level: 63.0, last_updated: "1 dk önce" },
    { bin_id: "BIN-104", location: "FAC-04 İstinye Deposu", fill_percentage: 63.2, battery_level: 82.0, last_updated: "8 dk önce" },
    { bin_id: "BIN-105", location: "FAC-05 Küçükçekmece Deposu", fill_percentage: 74.1, battery_level: 68.0, last_updated: "6 dk önce" }
  ]);
  const [esgData, setEsgData] = useState(() => esgFromLots(mergeLots([], saved.lots || [])));
  const [auditLogs, setAuditLogs] = useState(() => saved.auditLogs || [
    { id: 1, action: "LOT_REGISTRATION", detail: "LOT-8948 organik 318 kg COL-25 → FAC-04 kantarına düştü", timestamp: "07:52:11" },
    { id: 2, action: "WAYBILL_ISSUE", detail: "IRS-2026-0142 Cam 812 kg teslim, plaka 34 ISU 104", timestamp: "12:18:04" },
    { id: 3, action: "QUARANTINE", detail: "LOT-8943 EWC etiketi uyuşmazlığı, FAC-03 lisanslı kabin", timestamp: "10:12:33" },
    { id: 4, action: "CAPACITY_ALERT", detail: "BIN-103 doluluk %91.7 — öğleden önce boşaltma önerildi", timestamp: "08:06:19" }
  ]);

  const [newLot, setNewLot] = useState({ material: "PET Plastik", weight: "", facility: "FAC-01 (Topkapı)", purity: "90", sourceId: "COL-01" });
  const [searchTerm, setSearchTerm] = useState("");
  const [qrModalLot, setQrModalLot] = useState(null);

  // Görsel Analiz Durumları
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [routeMessage, setRouteMessage] = useState("");
  const [selectedDepot, setSelectedDepot] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [routeMaterials, setRouteMaterials] = useState(["PET Plastik", "Oluklu Mukavva"]);
  const [scanOpen, setScanOpen] = useState(false);
  const [tourStep, setTourStep] = useState(-1);
  const [newUser, setNewUser] = useState({ username: "", password: "", name: "", role: "Operatör" });
  const [extraUsers, setExtraUsers] = useState(() => saved.extraUsers || []);
  const [fx, setFx] = useState(() => loadCachedFx());
  const [fxBusy, setFxBusy] = useState(false);
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  const [selectedVehicleId, setSelectedVehicleId] = useState("AR-01");
  const [fleetDestId, setFleetDestId] = useState("BASER");
  const [dispatchNote, setDispatchNote] = useState("");
  const [depotMessages, setDepotMessages] = useState(() => (saved.depotMessages?.length ? saved.depotMessages : DEFAULT_INBOX));
  const [inboxDepot, setInboxDepot] = useState("FAC-03");
  const [inboxReply, setInboxReply] = useState("");
  const [siteMessages, setSiteMessages] = useState(() => (saved.siteMessages?.length ? saved.siteMessages : DEFAULT_SITE_INBOX));
  const [inboxSite, setInboxSite] = useState("COL-01");
  const [siteReply, setSiteReply] = useState("");
  const [waybills, setWaybills] = useState(() => mergeWaybills(saved.waybills));
  const [sales, setSales] = useState(() => mergeSales(saved.sales));
  const [saleDraft, setSaleDraft] = useState({ lotId: "", kg: "", plate: "" });
  const [starDraft, setStarDraft] = useState({ lotId: "", kg: "", plate: "" });
  const [saleNote, setSaleNote] = useState("");
  const [starNote, setStarNote] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState("SAT-2026-0110");
  const [selectedStarSaleId, setSelectedStarSaleId] = useState("SAT-2026-0206");
  const [ticketModal, setTicketModal] = useState(null);
  const [ticketForm, setTicketForm] = useState({ kg: "", plate: "", signer: "", signData: "" });
  const [wbDraft, setWbDraft] = useState({ lotId: "", kind: "TESLİM", kg: "", plate: "", signer: "", signData: "" });
  const [waybillNote, setWaybillNote] = useState("");
  const [opsNote, setOpsNote] = useState("");
  const [selectedWaybillId, setSelectedWaybillId] = useState("IRS-2026-0141");
  const [managerMessages, setManagerMessages] = useState(() => (saved.managerMessages?.length ? saved.managerMessages : DEFAULT_MANAGER_INBOX));
  const [inboxManager, setInboxManager] = useState("MGR-03A");
  const [managerReply, setManagerReply] = useState("");
  const [staffFilter, setStaffFilter] = useState("all");
  const [staffQuery, setStaffQuery] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("PER-000");
  const [staffRoster, setStaffRoster] = useState(() => (saved.staffRoster?.length ? saved.staffRoster : DEFAULT_STAFF));
  const [hrNote, setHrNote] = useState("");
  const [hireForm, setHireForm] = useState({
    name: "",
    age: "25",
    gender: "Erkek",
    title: "Saha operatörü",
    depotId: "FAC-04",
    salary: "36000",
    phone: "",
    address: "",
    shift: "Gündüz",
    plate: ""
  });
  const photoInputRef = useRef(null);
  const [photoLotId, setPhotoLotId] = useState("");
  const [alertBanner, setAlertBanner] = useState("");
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const t = dict[lang];

  const pushAudit = (action, detail) => {
    const entry = { id: Date.now(), action, detail, timestamp: new Date().toLocaleTimeString() };
    setAuditLogs((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      saveState({ auditLogs: next });
      return next;
    });
  };

  const persistLots = (nextLots) => {
    setLots(nextLots);
    setMetrics(metricsFromLots(nextLots));
    setEsgData(esgFromLots(nextLots));
    saveState({ lots: nextLots });
  };

  const persistInbox = (next) => {
    setDepotMessages(next);
    saveState({ depotMessages: next });
  };

  const persistSiteInbox = (next) => {
    setSiteMessages(next);
    saveState({ siteMessages: next });
  };

  const persistWaybills = (next) => {
    setWaybills(next);
    saveState({ waybills: next });
  };

  const persistSales = (next) => {
    setSales(next);
    saveState({ sales: next });
  };

  const persistManagers = (next) => {
    setManagerMessages(next);
    saveState({ managerMessages: next });
  };

  const persistStaff = (next) => {
    setStaffRoster(next);
    saveState({ staffRoster: next });
  };

  const hireStaff = (e) => {
    e.preventDefault();
    const name = String(hireForm.name || "").trim();
    if (!name) {
      setHrNote("Ad soyad gerekli.");
      return;
    }
    const row = makeStaff({ ...hireForm, name }, staffRoster);
    persistStaff([row, ...staffRoster]);
    setSelectedStaffId(row.id);
    setHireForm((prev) => ({ ...prev, name: "", phone: "", address: "", plate: "" }));
    setHrNote(`${row.name} işe alındı · ${row.id} · ${row.title} · ${formatTry(row.salary)}`);
    pushAudit("HR_HIRE", `${row.id} ${row.name} ${row.title} ${row.depotId}`);
  };

  const fireStaff = (id) => {
    const p = staffRoster.find((s) => s.id === id);
    if (!p) return;
    if (p.kind === "patron") {
      setHrNote("Patron kadrodan çıkarılamaz.");
      return;
    }
    persistStaff(staffRoster.filter((s) => s.id !== id));
    if (selectedStaffId === id) setSelectedStaffId(staffRoster.find((s) => s.id !== id)?.id || "PER-000");
    setHrNote(`${p.name} işten çıkarıldı (${p.id}).`);
    pushAudit("HR_FIRE", `${p.id} ${p.name}`);
  };

  const lotsRef = useRef(lots);
  lotsRef.current = lots;
  const depotMsgRef = useRef(depotMessages);
  depotMsgRef.current = depotMessages;
  const siteMsgRef = useRef(siteMessages);
  siteMsgRef.current = siteMessages;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const base = await resolveApiBase();
      if (cancelled) return;
      setApiBase(base);
      try {
        const [lotsRes, binsRes, auditRes] = await Promise.all([
          apiFetch("/api/v1/lots"),
          apiFetch("/api/v1/iot/bins"),
          apiFetch("/api/v1/audit")
        ]);
        const local = loadState();
        if (lotsRes.ok) {
          const remote = (await lotsRes.json()).map(mapLot);
          persistLots(mergeLots(remote, local.lots || lotsRef.current));
        }
        if (binsRes.ok) {
          const bins = await binsRes.json();
          if (Array.isArray(bins) && bins.length) setIotBins(bins);
        }
        if (auditRes.ok) {
          const remoteAudit = await auditRes.json();
          if (Array.isArray(remoteAudit) && remoteAudit.length) {
            setAuditLogs(remoteAudit);
            saveState({ auditLogs: remoteAudit });
          }
        }
        setServerLive(true);
      } catch {
        setServerLive(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const msg = notifyCriticalBins(iotBins);
    if (msg) {
      setAlertBanner(msg);
      pushAudit("CAPACITY_ALERT", `Doluluk %85+: ${msg}`);
    }
  }, [iotBins]);

  useEffect(() => {
    if (isLoggedIn && !canAccess(user.role, tab)) setTab(defaultTab(user.role));
  }, [isLoggedIn, user.role, tab]);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      setFxBusy(true);
      try {
        const next = await fetchLiveFx();
        if (!cancelled) setFx(next);
      } catch {
        if (!cancelled) {
          setFx((prev) => (prev ? { ...prev, live: false } : prev));
        }
      } finally {
        if (!cancelled) setFxBusy(false);
      }
    };
    pull();
    const timer = setInterval(pull, 45000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const onArrivals = (arrivals) => {
      if (!arrivals?.length) return;
      let nextLots = lotsRef.current;
      arrivals.forEach((arr) => {
        pushAudit("GEOFENCE", `${arr.plate} ${arr.destLabel} ulaştı · ${arr.km} km`);
        nextLots = nextLots.map((lot) => {
          const hit = lot.sourceId === arr.destId || String(lot.facility).startsWith(arr.destId);
          return hit
            ? pushEvent(lot, { type: "ULAŞTI", who: arr.driver, plate: arr.plate, detail: `${arr.destLabel} · ${arr.km} km` })
            : lot;
        });
        if (String(arr.destId).startsWith("COL")) {
          const next = [
            ...siteMsgRef.current,
            { id: Date.now() + Math.random(), siteId: arr.destId, direction: "in", time: nowClock(), read: false, body: `${arr.plate} / ${arr.driver} sahaya ulaştı (geofence, ${arr.km} km).` }
          ];
          persistSiteInbox(next);
        } else if (String(arr.destId).startsWith("FAC")) {
          const next = [
            ...depotMsgRef.current,
            { id: Date.now() + Math.random(), depotId: arr.destId, direction: "in", time: nowClock(), read: false, body: `${arr.plate} / ${arr.driver} tesise ulaştı (geofence, ${arr.km} km).` }
          ];
          persistInbox(next);
        }
      });
      persistLots(nextLots);
    };
    const timer = setInterval(() => {
      setFleet((prev) => {
        const { vehicles, arrivals } = tickFleet(prev);
        if (arrivals.length) queueMicrotask(() => onArrivals(arrivals));
        return vehicles;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const applyImageFile = (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      alert("Lütfen PNG, JPG, JPEG veya WEBP formatında bir görsel seçiniz.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert("Dosya boyutu 15 MB sınırını aşıyor.");
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setAiResult(null);
  };

  const fileFromBase64 = (picked) => {
    const binary = atob(picked.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], picked.name, { type: picked.mime || "image/jpeg" });
  };

  const pickImageFile = async () => {
    if (window.wasteflowDesktop?.openImage) {
      const picked = await window.wasteflowDesktop.openImage();
      if (picked) applyImageFile(fileFromBase64(picked));
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    applyImageFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    applyImageFile(e.dataTransfer.files?.[0]);
  };

  const handleCreateLot = async (e) => {
    e.preventDefault();
    if (!newLot.weight) {
      setOpsNote("Kilogram girin.");
      return;
    }
    setOpsNote("");
    const generatedId = `LOT-${Date.now().toString().slice(-6)}`;
    const sources = sourcesForMaterial(newLot.material);
    const lotObj = {
      id: generatedId,
      material: newLot.material,
      weight: parseFloat(newLot.weight),
      facility: newLot.facility,
      purity: parseFloat(newLot.purity),
      status: "YENİ KAYIT",
      sourceId: newLot.sourceId || sources[0]?.id || "",
      events: [{ at: new Date().toLocaleString("tr-TR"), type: "KAYIT", who: user.name, detail: `EWC ${ewcOf(newLot.material).code} · ${newLot.sourceId}` }]
    };
    persistLots([lotObj, ...lots]);
    pushAudit("LOT_CREATE", `${generatedId} kaydedildi (${lotObj.material}, ${lotObj.weight} kg).`);
    await createLotRemote(lotObj);
    setNewLot({ material: "PET Plastik", weight: "", facility: "FAC-01 (Topkapı)", purity: "90", sourceId: "COL-01" });
  };

  const issueWaybill = async ({ lot, kind, kg, plate, signer, signData }) => {
    if (!lot) return null;
    const status = kind === "ALINDI" || kind === "ALIM" ? "ALINDI" : "TESLİM EDİLDİ";
    const vehicle = fleet.find((v) => v.plate === plate) || fleet[0];
    const wb = makeWaybill({
      lot,
      kind: status === "ALINDI" ? "ALIM" : "TESLİM",
      kg,
      plate: plate || vehicle?.plate || "",
      driver: vehicle?.driver || "",
      signer,
      signData,
      user
    });
    persistWaybills([wb, ...waybills]);
    setSelectedWaybillId(wb.id);
    const next = lots.map((row) => {
      if (row.id !== lot.id) return row;
      return pushEvent(
        { ...row, status, weight: Number(kg || row.weight) },
        { type: status === "ALINDI" ? "ALIM" : "TESLİM", who: signer, plate: plate || vehicle?.plate, detail: `Tartım ${kg} kg · ${wb.id}` }
      );
    });
    persistLots(next);
    pushAudit("IRSALIYE", `${wb.id} ${wb.kind} · ${lot.id} · ${wb.kg} kg · ${wb.plate}`);
    await patchLotRemote({ ...lot, status, weight: kg });
    return wb;
  };

  const openTicket = (lot, kind) => {
    const v = fleet.find((x) => x.id === selectedVehicleId) || fleet[0];
    setTicketForm({ kg: lot.weight, plate: v?.plate || "", signer: user.name || "", signData: "" });
    setTicketModal({ lot, kind });
  };

  const confirmTicket = async (e) => {
    e.preventDefault();
    if (!ticketModal) return;
    await issueWaybill({
      lot: ticketModal.lot,
      kind: ticketModal.kind,
      kg: ticketForm.kg,
      plate: ticketForm.plate,
      signer: ticketForm.signer,
      signData: ticketForm.signData
    });
    setTicketModal(null);
  };

  const submitWaybillForm = async (e) => {
    e.preventDefault();
    const lot = lots.find((l) => l.id === (wbDraft.lotId || lots[0]?.id));
    if (!lot) {
      setWaybillNote("Önce envantere lot ekleyin.");
      return;
    }
    if (!wbDraft.kg && !lot.weight) {
      setWaybillNote("Kilogram girin.");
      return;
    }
    const wb = await issueWaybill({
      lot,
      kind: wbDraft.kind,
      kg: wbDraft.kg || lot.weight,
      plate: wbDraft.plate || fleet[0]?.plate,
      signer: wbDraft.signer || user.name,
      signData: wbDraft.signData
    });
    if (wb) setWaybillNote(`${wb.id} kesildi · ${wb.kind} · ${wb.kg} kg`);
  };

  const dispatchToBuyer = (plate, buyerId = "BASER") => {
    const dest = FLEET_DESTINATIONS.find((d) => d.id === buyerId);
    if (!dest) return;
    setFleet((prev) => prev.map((v) => (
      v.plate === plate
        ? { ...v, destId: dest.id, destLabel: dest.label, destLat: dest.lat, destLng: dest.lng, tripStartLat: v.lat, tripStartLng: v.lng, arrivedAck: false }
        : v
    )));
    setFleetDestId(buyerId);
    const hit = fleet.find((v) => v.plate === plate);
    if (hit) setSelectedVehicleId(hit.id);
  };

  const submitSaleTo = (buyer, draft, setNote, setSelected) => (e) => {
    e.preventDefault();
    const sold = soldLotIds(sales);
    const lot = lots.find((l) => l.id === draft.lotId)
      || lots.find((l) => ["İŞLENDİ", "TESLİM EDİLDİ", "ROTALANDI"].includes(l.status) && !sold.has(l.id));
    if (!lot) {
      setNote("Satılacak işlenmiş lot yok.");
      return;
    }
    if (sold.has(lot.id)) {
      setNote(`${lot.id} zaten satıldı.`);
      return;
    }
    const vehicle = fleet.find((v) => v.plate === (draft.plate || fleet[0]?.plate)) || fleet[0];
    const row = makeSale({
      lot,
      kg: draft.kg || lot.weight,
      plate: vehicle?.plate || "",
      driver: vehicle?.driver || "",
      user,
      buyer
    });
    persistSales([row, ...sales]);
    setSelected(row.id);
    dispatchToBuyer(row.plate, buyer.id);
    setNote(`${row.id} · ${row.kg} kg ${row.material} → ${buyer.name} (${buyer.district}) · ${formatTry(row.amount)} · tır ${row.plate}`);
    pushAudit("SATIS", `${row.id} ${lot.id} ${row.kg} kg ${row.material} ${formatTry(row.amount)} → ${buyer.name}`);
  };

  const setLotStatus = async (lot, status) => {
    openTicket(lot, status);
  };

  const handleLotPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !photoLotId) return;
    try {
      const photoThumb = await compressImageFile(file);
      persistLots(lots.map((row) => (row.id === photoLotId ? { ...row, photoThumb } : row)));
      pushAudit("SCALE_PHOTO", `${photoLotId} kantar/foto eklendi.`);
    } catch {
      alert("Fotoğraf küçültülemedi.");
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    const entry = {
      username: newUser.username.trim().toLowerCase(),
      password: newUser.password,
      name: newUser.name || newUser.username,
      role: newUser.role
    };
    const next = [...extraUsers, entry];
    setExtraUsers(next);
    saveState({ extraUsers: next });
    pushAudit("USER_CREATE", `${entry.username} eklendi (${entry.role}).`);
    setNewUser({ username: "", password: "", name: "", role: "Operatör" });
  };

  const sendFleetNotify = (channel) => {
    const vehicle = fleet.find((v) => v.id === selectedVehicleId);
    const dest = FLEET_DESTINATIONS.find((d) => d.id === fleetDestId);
    if (!vehicle || !dest) return;
    const text = dispatchMessage(vehicle, dest);
    setFleet((prev) => prev.map((v) => (
      v.id === vehicle.id
        ? { ...v, destId: dest.id, destLabel: dest.label, destLat: dest.lat, destLng: dest.lng, lastNotify: new Date().toLocaleTimeString("tr-TR"), tripStartLat: vehicle.lat, tripStartLng: vehicle.lng, arrivedAck: false }
        : v
    )));
    const href = channel === "wa" ? waHref(vehicle.phone, text) : smsHref(vehicle.phone, text);
    window.open(href, "_blank");
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(`WasteFlow · ${vehicle.plate}`, { body: text });
    } else if (typeof Notification !== "undefined" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    setDispatchNote(`${vehicle.plate} → ${dest.label} bildirimi ${channel === "wa" ? "WhatsApp" : "SMS"} olarak açıldı.`);
    pushAudit("FLEET_DISPATCH", `${vehicle.plate} ${vehicle.driver} hedef: ${dest.label}`);
  };

  const openInboxDepot = (depotId) => {
    setInboxDepot(depotId);
    persistInbox(depotMessages.map((m) => (
      m.depotId === depotId && m.direction === "in" ? { ...m, read: true } : m
    )));
  };

  const sendInboxReply = (e) => {
    e.preventDefault();
    if (!inboxReply.trim()) return;
    const owner = ownerOf(inboxDepot);
    persistInbox([
      ...depotMessages,
      {
        id: Date.now(),
        depotId: inboxDepot,
        direction: "out",
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        read: true,
        body: inboxReply.trim()
      }
    ]);
    pushAudit("DEPOT_REPLY", `${owner.depot} sahibine yanıt gönderildi.`);
    setInboxReply("");
  };

  const openInboxSite = (siteId) => {
    setInboxSite(siteId);
    persistSiteInbox(siteMessages.map((m) => (
      m.siteId === siteId && m.direction === "in" ? { ...m, read: true } : m
    )));
  };

  const sendSiteReply = (e) => {
    e.preventDefault();
    if (!siteReply.trim()) return;
    const site = siteContact(inboxSite);
    persistSiteInbox([
      ...siteMessages,
      {
        id: Date.now(),
        siteId: inboxSite,
        direction: "out",
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        read: true,
        body: siteReply.trim()
      }
    ]);
    pushAudit("SITE_REPLY", `${site.siteId} ${site.name} saha sorumlusuna yanıt gönderildi.`);
    setSiteReply("");
  };

  const openInboxManager = (managerId) => {
    setInboxManager(managerId);
    persistManagers(managerMessages.map((m) => (
      m.managerId === managerId && m.direction === "in" ? { ...m, read: true } : m
    )));
  };

  const sendManagerReply = (e) => {
    e.preventDefault();
    if (!managerReply.trim()) return;
    const mgr = managerOf(inboxManager);
    persistManagers([
      ...managerMessages,
      {
        id: Date.now(),
        managerId: inboxManager,
        direction: "out",
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        read: true,
        body: managerReply.trim()
      }
    ]);
    pushAudit("MGR_REPLY", `${mgr.name} (${mgr.depot}) müdürüne yanıt gönderildi.`);
    setManagerReply("");
  };

  const onQrFound = (id) => {
    setScanOpen(false);
    const lot = lots.find((row) => String(row.id).toLowerCase() === String(id).toLowerCase());
    if (!lot) {
      alert(`Lot bulunamadı: ${id}`);
      return;
    }
    setTab("lots");
    setQrModalLot(lot);
  };

  const handleApplyRouting = async () => {
    const next = applyRouting(lots);
    const changed = next.filter((lot, i) => lot.facility !== lots[i].facility || lot.status !== lots[i].status);
    persistLots(next);
    const msg = changed.length
      ? `${changed.length} lot rotalandı. ${changed[0].routeReason || ""}`
      : "Rotalanacak yeni lot yok (işlenen/karantina hariç).";
    setRouteMessage(msg);
    pushAudit("AI_ROUTING_EXEC", msg);
    await Promise.all(changed.map((lot) => patchLotRemote(lot)));
  };

  const ingestCsvText = async (text, sourceName) => {
    const imported = parseLotsCsv(text);
    if (!imported.length) {
      alert("CSV okunamadı. Beklenen sütunlar: id, material, weight, facility, purity");
      return;
    }
    const existing = new Set(lots.map((l) => l.id));
    const unique = imported.map((lot, idx) => (
      existing.has(lot.id) ? { ...lot, id: `${lot.id}-${idx + 1}` } : lot
    ));
    persistLots([...unique, ...lots]);
    pushAudit("CSV_IMPORT", `${unique.length} kayıt aktarıldı (${sourceName}).`);
    await Promise.all(unique.map((lot) => createLotRemote(lot)));
    alert(`${unique.length} lot CSV'den sisteme işlendi.`);
  };

  const handleCsvUpload = async () => {
    if (window.wasteflowDesktop?.openCsv) {
      const picked = await window.wasteflowDesktop.openCsv();
      if (picked?.text) await ingestCsvText(picked.text, picked.name);
      return;
    }
    csvInputRef.current?.click();
  };

  const handleCsvFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await ingestCsvText(await file.text(), file.name);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    try {
      const session = await loginRequest(loginUser, loginPass);
      setUser(session);
      setIsLoggedIn(true);
      setTab(defaultTab(session.role));
      saveState({ session });
      pushAudit("LOGIN", `${session.username || loginUser} oturum açtı.`);
    } catch (err) {
      setLoginError(err.message || t.loginError);
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    saveState({ session: null });
    setLoginPass("");
  };

  const handleAiAnalyze = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!selectedImage) {
      await pickImageFile();
      return;
    }
    setLoadingAi(true);
    setAiResult(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedImage, selectedImage.name);
      try {
        const res = await apiFetch("/api/v1/ai/classify", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data?.detected_material && !/polimer kompozit|varsayılan/i.test(data.detected_material)) {
            setAiResult(data);
            return;
          }
        }
      } catch {
        /* local classifier */
      }
      setAiResult(await classifyWasteImage(selectedImage));
    } catch (err) {
      setAiResult({
        detected_material: "Analiz tamamlanamadı",
        confidence: 0,
        recyclability_percentage: 0,
        estimated_co2_saving_kg_per_ton: 0,
        ai_recommendation: "Görsel okunamadı. Farklı bir JPG/PNG ile tekrar deneyin."
      });
    } finally {
      setLoadingAi(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#ffffff", color: "#111111", justifyContent: "center", alignItems: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "8px", border: "1px solid #e8e8e8", width: "360px" }}>
            <img src={LOGO_SRC} alt="İstinye Üniversitesi" style={{ width: "220px", height: "auto", marginBottom: "20px", display: "block", background: "#ffffff" }} />
          <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#111111", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>WASTEFLOW PLATFORM</div>
          <h2 style={{ color: "#111111", margin: "0 0 6px 0", fontSize: "20px", fontWeight: "600" }}>{t.loginTitle}</h2>
          <p style={{ color: "#444444", fontSize: "13px", marginBottom: "24px" }}>{t.loginSubtitle}</p>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Kullanıcı Kimliği</label>
              <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} autoComplete="username" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Erişim Parolası</label>
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} autoComplete="current-password" style={inputStyle} />
            </div>
            {loginError && <div style={{ color: "#111111", fontSize: "12px" }}>{loginError}</div>}
            <button type="submit" disabled={loginBusy} style={{ ...btnPrimary, width: "100%", marginTop: "10px" }}>
              {loginBusy ? "Doğrulanıyor..." : t.loginBtn}
            </button>
            <div style={{ color: "#444444", fontSize: "11px", lineHeight: 1.4 }}>{t.loginHint}</div>
          </form>
        </div>
      </div>
    );
  }

  const filteredLots = lots.filter((l) =>
    `${l.id} ${l.material} ${l.facility} ${l.status} ${l.sourceId || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const criticalBins = iotBins.filter((b) => Number(b.fill_percentage) >= 85);
  const openLotCount = lots.filter((l) => l.status !== "İŞLENDİ").length;
  const facilityChart = FACILITY_OPTIONS.map((fac) => ({
    tesis: fac.match(/FAC-\d+/)?.[0] || fac,
    kg: Math.round(lots.filter((l) => l.facility === fac).reduce((sum, l) => sum + Number(l.weight || 0), 0))
  }));
  const statusChart = [
    { name: lang === "en" ? "Processed" : "İşlendi", value: lots.filter((l) => l.status === "İŞLENDİ").length, fill: "#1B6B4A" },
    { name: lang === "en" ? "Routed" : "Rotalandı", value: lots.filter((l) => l.status === "ROTALANDI").length, fill: "#1E5A9C" },
    { name: lang === "en" ? "Picked up" : "Alındı", value: lots.filter((l) => l.status === "ALINDI").length, fill: "#0B2C5F" },
    { name: lang === "en" ? "Delivered" : "Teslim", value: lots.filter((l) => l.status === "TESLİM EDİLDİ").length, fill: "#3D7CC4" },
    { name: lang === "en" ? "Incoming" : "Yeni kayıt", value: lots.filter((l) => l.status === "YENİ KAYIT" || l.status === "CSV AKTARILDI").length, fill: "#C4A35A" },
    { name: lang === "en" ? "Quarantine" : "Karantina", value: lots.filter((l) => l.status === "KARANTİNADA").length, fill: "#C62828" }
  ].filter((d) => d.value > 0);
  const materialChart = Object.entries(
    lots.reduce((acc, lot) => {
      acc[lot.material] = (acc[lot.material] || 0) + Number(lot.weight || 0);
      return acc;
    }, {})
  )
    .map(([name, kg]) => ({ name: name.length > 18 ? `${name.slice(0, 16)}…` : name, kg: Math.round(kg) }))
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 5);
  const chartTooltip = { backgroundColor: "#ffffff", border: "1px solid #d0d0d0", borderRadius: 6, fontSize: 12, color: "#111111" };
  const forecast = sevenDayForecast(iotBins, lots);
  const forecastColors = { "FAC-01": "#0B2C5F", "FAC-02": "#1E5A9C", "FAC-03": "#C4A35A", "FAC-04": "#1B6B4A", "FAC-05": "#C62828" };
  const filledSites = withCollectionFill(lots);
  const visibleCollections = collectionFilter === "all"
    ? filledSites
    : filledSites.filter((p) => p.material === collectionFilter);
  const collectionGroups = groupCollectionByMaterial(visibleCollections);
  const dailyRoutes = planDailyRoutes(filledSites, routeMaterials);
  const plannedKm = dailyRoutes.reduce((s, r) => s + Number(r.km || 0), 0);
  const drivenKm = fleet.reduce((s, v) => s + Number(v.tripKm || 0), 0);
  const fleetKm = plannedKm + drivenKm;
  const econ = economicsFromLots(lots, fx, fleetKm);
  const salesBook = summarizeSales(sales, "BASER");
  const starBook = summarizeSales(sales, "STAR");
  const soldIds = soldLotIds(sales);
  const sellableLots = lots.filter((l) => ["İŞLENDİ", "TESLİM EDİLDİ", "ROTALANDI"].includes(l.status) && !soldIds.has(l.id));
  const baserSales = salesFor(sales, "BASER");
  const starSales = salesFor(sales, "STAR");
  const kgCompare = compareKgPrices();
  const compareChart = kgCompare.map((r) => ({ name: r.material.replace(" / ", "/"), Başer: r.baser, Star: r.star }));
  const mass = massBalance(lots);
  const dispatchAdvice = vehicleDispatchAdvice(forecast.warnings, filledSites);
  const inboxThreads = threadsFrom(depotMessages);
  const inboxUnread = depotMessages.filter((m) => m.direction === "in" && !m.read).length;
  const pickupThreads = siteThreads(siteMessages);
  const siteUnread = siteMessages.filter((m) => m.direction === "in" && !m.read).length;
  const managerThreadsList = managerThreads(managerMessages);
  const managerUnread = managerMessages.filter((m) => m.direction === "in" && !m.read).length;
  const visibleStaff = staffRoster.filter((p) => {
    const q = staffQuery.toLowerCase();
    const hit = `${p.name} ${p.title} ${p.depot} ${p.id} ${p.plate || ""}`.toLowerCase().includes(q);
    if (!hit) return false;
    if (staffFilter === "all") return true;
    if (staffFilter === "müdür") return p.kind === "müdür";
    if (staffFilter === "şoför") return p.kind === "şoför";
    if (staffFilter === "patron") return p.kind === "patron";
    return p.depotId === staffFilter;
  });
  const selectedStaff = staffRoster.find((p) => p.id === selectedStaffId) || visibleStaff[0] || staffRoster[0];
  const depotPerf = depotPerformance(lots, iotBins);
  const perfById = Object.fromEntries(depotPerf.map((d) => [d.id, d]));
  const hr = staffStats(staffRoster, depotPerf);
  const selectedPay = selectedStaff ? payFor(selectedStaff, perfById) : null;
  const staffHits = searchTerm.trim()
    ? staffRoster.filter((p) => `${p.name} ${p.title} ${p.depotId}`.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 6)
    : [];
  const taskedFleet = fleet.filter((v) => v.destId);
  const hotSites = filledSites.filter((s) => Number(s.fill) >= 80);
  const unreadBySite = siteMessages.reduce((acc, m) => {
    if (m.direction === "in" && !m.read) acc[m.siteId] = (acc[m.siteId] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", backgroundColor: "#ffffff", color: "#111111", margin: 0, padding: 0, overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Sol Kurumsal Navigasyon Paneli */}
      <div style={{ width: "250px", backgroundColor: "#ffffff", padding: "24px 16px", borderRight: "1px solid #e8e8e8", display: "flex", flexDirection: "column", height: "100vh", minHeight: 0, overflow: "hidden" }}>
        <div style={{ flexShrink: 0, padding: "0 8px", marginBottom: "16px" }}>
            <img src={LOGO_SRC} alt="İstinye Üniversitesi" style={{ width: "180px", height: "auto", marginBottom: "12px", display: "block", background: "#ffffff" }} />
            <div style={{ color: "#111111", fontSize: "16px", fontWeight: "700", letterSpacing: "0.5px" }}>{t.title}</div>
            <div style={{ color: "#444444", fontSize: "11px", marginTop: "2px" }}>OPERATIONAL OS v2.0</div>
        </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minHeight: 0, overflowY: "scroll", overflowX: "hidden", paddingRight: 4, scrollbarWidth: "thin", scrollbarColor: "#888888 #ffffff" }}>
            {[
              ["overview", t.overview],
              ["map", t.map],
              ["collection", t.collection],
              ["routes", t.routes],
              ["fleet", t.fleet],
              ["inbox", t.inbox],
              ["siteInbox", t.siteInbox],
              ["managers", t.managers],
              ["staff", t.staff],
              ["hr", t.hr],
              ["operations", t.operations],
              ["lots", t.lots],
              ["waybills", t.waybills],
              ["sales", t.sales],
              ["salesStar", t.salesStar],
              ["priceCompare", t.priceCompare],
              ["ai_vision", t.aiVision],
              ["iot", t.iotBins],
              ["esg", t.esg],
              ["reports", t.reports],
              ["audit", t.audit],
              ["settings", t.settings]
            ].filter(([id]) => canAccess(user.role, id)).map(([id, label]) => (
              <button key={id} onClick={() => { setTab(id); if (id === "inbox") openInboxDepot(inboxDepot); if (id === "siteInbox") openInboxSite(inboxSite); if (id === "managers") openInboxManager(inboxManager); }} style={btnNav(tab === id)}>
                {id === "inbox" && inboxUnread
                  ? `${label} (${inboxUnread})`
                  : id === "siteInbox" && siteUnread
                    ? `${label} (${siteUnread})`
                    : id === "managers" && managerUnread
                      ? `${label} (${managerUnread})`
                    : id === "fleet" && taskedFleet.length
                      ? `${label} (${taskedFleet.length})`
                      : id === "waybills" && waybills.length
                        ? `${label} (${waybills.length})`
                        : id === "sales" && baserSales.length
                          ? `${label} (${baserSales.length})`
                          : id === "salesStar" && starSales.length
                            ? `${label} (${starSales.length})`
                            : label}
              </button>
            ))}
          </nav>
        {/* Kullanıcı Oturumu ve Dil Seçimi */}
        <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: "16px", paddingLeft: "8px", paddingRight: "8px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#111111", fontWeight: "600" }}>{user.name}</div>
              <div style={{ fontSize: "10px", color: "#444444" }}>{user.role}</div>
            </div>
            <button onClick={() => { setTourStep(0); setTab("overview"); }} style={{ background: "#e8e8e8", color: "#111111", border: "1px solid #d0d0d0", borderRadius: "4px", padding: "3px 8px", cursor: "pointer", fontSize: "10px", fontWeight: "600" }}>
              Jüri turu
            </button>
            <button onClick={() => setLang(lang === "tr" ? "en" : "tr")} style={{ background: "#e8e8e8", color: "#444444", border: "1px solid #d0d0d0", borderRadius: "4px", padding: "3px 8px", cursor: "pointer", fontSize: "10px", fontWeight: "600" }}>
              {lang.toUpperCase()}
            </button>
          </div>
          <button onClick={handleLogout} style={{ background: "transparent", color: "#111111", border: "1px solid #cccccc", borderRadius: "4px", width: "100%", padding: "7px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>
            {t.logout}
          </button>
        </div>
      </div>

      {/* Ana Çalışma Alanı */}
      <div style={{ flex: 1, minWidth: 0, padding: "28px 36px", overflowY: "auto", backgroundColor: "#ffffff" }}>
        {alertBanner && (
          <div style={{ background: "#f4f4f4", border: "1px solid #111111", color: "#111111", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 12, fontWeight: 600 }}>
            UYARI · {alertBanner}
            {hotSites.length ? ` · ${hotSites.length} toplama alanı ≥%80` : ""}
            <button type="button" onClick={() => setAlertBanner("")} style={{ float: "right", background: "transparent", color: "#111111", border: "none", cursor: "pointer" }}>×</button>
          </div>
        )}
        
        {/* Üst Durum Çubuğu */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", paddingBottom: "16px", borderBottom: "1px solid #e8e8e8" }}>
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", cursor: "pointer" }}
          >
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: serverLive ? "#1B8A4A" : "#9CA3AF" }}></span>
            <span style={{ color: "#444444", fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" }}>{serverLive ? t.connected : "YEREL KAYIT AKTİF"}</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 11, color: fx?.live ? "#111111" : "#111111" }}>
              {fx?.usdTry ? `USD ${Number(fx.usdTry).toFixed(2)} ₺` : "kur —"} · {fx?.eurTry ? `EUR ${Number(fx.eurTry).toFixed(2)} ₺` : ""}
            </span>
            {inboxUnread > 0 && <button type="button" onClick={() => setTab("inbox")} style={linkBtn}>Depo {inboxUnread}</button>}
            {siteUnread > 0 && <button type="button" onClick={() => setTab("siteInbox")} style={linkBtn}>Toplama {siteUnread}</button>}
            {managerUnread > 0 && <button type="button" onClick={() => setTab("managers")} style={linkBtn}>Müdür {managerUnread}</button>}
            <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, width: "280px" }}
          />
          </div>
        </div>

        {/* TAB 1: GÖSTERGE PANELİ */}
        {tab === "overview" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.overview}</h2>
            <p style={{ color: "#444444", fontSize: "12px", margin: "8px 0 0 0" }}>
              {lots.length} lot · 5 depo · 10 müdür · {hr.count} personel · maaş {formatTry(hr.payroll)} · prim {formatTry(hr.bonus)} · Başer {formatTry(salesBook.amount)} · Star {formatTry(starBook.amount)}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", margin: "20px 0" }}>
              <Card title={t.circularity} value={`%${metrics?.circularity_rate ?? 0}`} color="#111111" />
              <div onClick={() => setTab("esg")} style={{ cursor: "pointer" }}><Card title="Giren kütle" value={`${mass.incomingKg} kg`} color="#111111" /></div>
              <div onClick={() => setTab("hr")} style={{ cursor: "pointer" }}><Card title="Aylık bordro" value={formatTry(hr.gross)} color="#111111" /></div>
              <div onClick={() => setTab("hr")} style={{ cursor: "pointer" }}><Card title="Performans primi" value={formatTry(hr.bonus)} color="#111111" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: 16 }}>
              <Card title={t.recycled} value={`${metrics?.recycled_tons ?? 0} TON`} color="#111111" />
              <Card title={t.landfilled} value={`${metrics?.landfilled_tons ?? 0} TON`} color="#111111" />
              <div onClick={() => setTab("waybills")} style={{ cursor: "pointer" }}><Card title="İrsaliye" value={waybills.length} color="#111111" /></div>
              <div onClick={() => setTab("sales")} style={{ cursor: "pointer" }}><Card title="Başer satışı" value={formatTry(salesBook.amount)} color="#111111" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: 16 }}>
              <div onClick={() => setTab("salesStar")} style={{ cursor: "pointer" }}><Card title="Star satışı" value={formatTry(starBook.amount)} color="#111111" /></div>
              <div onClick={() => setTab("priceCompare")} style={{ cursor: "pointer" }}><Card title="1 kg karşılaştır" value={`${kgCompare.filter((r) => r.winner !== "eşit").length} fark`} color="#111111" /></div>
              <div onClick={() => setTab("fleet")} style={{ cursor: "pointer" }}><Card title="Filo görevde" value={`${taskedFleet.length}/15`} color="#111111" /></div>
              <div onClick={() => setTab("staff")} style={{ cursor: "pointer" }}><Card title="Kadro" value={`${hr.managers} müdür · ${hr.drivers} şoför`} color="#111111" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: 16 }}>
              <div onClick={() => setTab("collection")} style={{ cursor: "pointer" }}><Card title="Kritik toplama" value={hotSites.length} color={hotSites.length ? "#111111" : "#111111"} /></div>
              <div onClick={() => setTab("managers")} style={{ cursor: "pointer" }}><Card title="Müdür mesajı" value={managerUnread} color={managerUnread ? "#111111" : "#111111"} /></div>
              <div onClick={() => setTab("inbox")} style={{ cursor: "pointer" }}><Card title="Depo / saha kutusu" value={`${inboxUnread} / ${siteUnread}`} color={(inboxUnread || siteUnread) ? "#111111" : "#111111"} /></div>
            </div>
            {staffHits.length ? (
              <div style={{ ...sectionBoxStyle, marginBottom: 16 }}>
                <h3 style={sectionTitleStyle}>Personel araması</h3>
                {staffHits.map((p) => (
                  <button key={p.id} type="button" onClick={() => { setSelectedStaffId(p.id); setTab("staff"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", borderTop: "1px solid #e8e8e8", color: "#111111", padding: "8px 0", cursor: "pointer", fontSize: 12 }}>
                    <strong style={{ color: "#111111" }}>{p.name}</strong> · {p.title} · {p.depotId} · {formatTry(p.salary)}
                  </button>
                ))}
              </div>
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
              {DEPOTS.map((depot) => {
                const mgrs = managersForDepot(depot.id);
                const row = hr.byDepot.find((d) => d.tesis === depot.id);
                const unread = managerThreadsList.filter((t) => t.depotId === depot.id).reduce((s, t) => s + t.unread, 0);
                const perf = perfById[depot.id];
                return (
                  <button
                    key={depot.id}
                    type="button"
                    onClick={() => setTab("hr")}
                    style={{
                      ...sectionBoxStyle,
                      textAlign: "left",
                      cursor: "pointer",
                      borderColor: (perf?.score || 0) < 45 ? "#111111" : unread ? "#111111" : "#e8e8e8",
                      color: "#111111"
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#444444", fontWeight: 700 }}>{depot.id} · skor {perf?.score ?? 0}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 8px" }}>{depot.name}</div>
                    <div style={{ fontSize: 11, color: "#444444", lineHeight: 1.5 }}>
                      {mgrs.map((m) => <div key={m.id}>{m.shift === "Gündüz" ? "G" : "C"} · {m.name}</div>)}
                      %{Math.round((perf?.rate || 0) * 100)} prim · {formatTry(row?.prim || 0)}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ ...sectionBoxStyle, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#444444", marginBottom: 6 }}>
                <span>Döngüsellik hedefi %{CIRCULARITY_TARGET}</span>
                <span style={{ color: (metrics?.circularity_rate ?? 0) >= CIRCULARITY_TARGET ? "#111111" : "#111111", fontWeight: 700 }}>
                  mevcut %{(metrics?.circularity_rate ?? 0)}
                </span>
              </div>
              <div style={{ height: 8, background: "#e8e8e8", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, metrics?.circularity_rate ?? 0)}%`, height: "100%", background: (metrics?.circularity_rate ?? 0) >= CIRCULARITY_TARGET ? "#1B6B4A" : "#C4A35A" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div style={sectionBoxStyle}>
                <h3 style={sectionTitleStyle}>Depo yükü (kg)</h3>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={facilityChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="tesis" stroke="#444444" tick={{ fill: "#444444", fontSize: 11 }} />
                      <YAxis stroke="#444444" tick={{ fill: "#444444", fontSize: 11 }} />
                      <Tooltip contentStyle={chartTooltip} />
                      <Bar dataKey="kg" fill="#0B2C5F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={sectionBoxStyle}>
                <h3 style={sectionTitleStyle}>Lot durum dağılımı</h3>
                <div style={{ height: 240 }}>
                  {statusChart.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                          {statusChart.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ color: "#444444", fontSize: 12 }}>Veri yok</div>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                  {statusChart.map((s) => (
                    <span key={s.name} style={{ fontSize: 11, color: "#444444" }}>
                      <span style={{ color: s.fill }}>●</span> {s.name} {s.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ ...sectionBoxStyle, marginBottom: "16px" }}>
              <h3 style={sectionTitleStyle}>7 günlük depo doluluk tahmini (%)</h3>
              <p style={{ color: "#444444", fontSize: 12, margin: "-8px 0 12px 0" }}>
                    Mevcut IoT doluluk + lot yükünden günlük artış. %95 üzeri günler kalın çerçeve uyarısı verir.
              </p>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecast.series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e8e8e8" strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke="#444444" tick={{ fill: "#444444", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} stroke="#444444" tick={{ fill: "#444444", fontSize: 11 }} />
                    <Tooltip contentStyle={chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#444444" }} />
                    {forecast.depots.map((depot) => (
                      <Line
                        key={depot.id}
                        type="monotone"
                        dataKey={depot.id}
                        name={`${depot.id} ${depot.name}`}
                        stroke={forecastColors[depot.id]}
                        strokeWidth={depot.id === "FAC-03" ? 3 : 2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {dispatchAdvice.length ? (
                <div style={{ marginTop: 12, fontSize: 12, color: "#111111" }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Araç çıkarma tavsiyesi</div>
                  {dispatchAdvice.slice(0, 6).map((line) => <div key={line}>{line}</div>)}
                </div>
              ) : null}
              {forecast.warnings.length ? (
                <div style={{ marginTop: 12, fontSize: 12, color: "#111111" }}>
                  {forecast.warnings.map((w) => (
                    <div key={w.depot.id}>
                      {w.depot.id} {w.depot.name}: {w.day} tarihinde tahmini %{w.fill} — toplama önerilir.
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: 12, fontSize: 12, color: "#444444" }}>7 gün içinde %95 aşımı beklenmiyor.</div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div style={sectionBoxStyle}>
                <h3 style={sectionTitleStyle}>Materyal kırılımı</h3>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={materialChart} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                      <XAxis type="number" stroke="#444444" tick={{ fill: "#444444", fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={110} stroke="#444444" tick={{ fill: "#111111", fontSize: 11 }} />
                      <Tooltip contentStyle={chartTooltip} />
                      <Bar dataKey="kg" fill="#1E5A9C" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={sectionBoxStyle}>
                <h3 style={sectionTitleStyle}>Depo primi (₺)</h3>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hr.byDepot} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="tesis" stroke="#444444" tick={{ fill: "#444444", fontSize: 11 }} />
                      <YAxis stroke="#444444" tick={{ fill: "#444444", fontSize: 11 }} />
                      <Tooltip contentStyle={chartTooltip} />
                      <Bar dataKey="prim" fill="#C4A35A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ fontSize: 11, color: "#444444", marginTop: 8 }}>Hacim + işlenen lot − karantina − doluluk. Boş/hazır depo küçük prim alır. A %18 · B %12 · C %7 · D %3 (skor ≥40)</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
              <div style={sectionBoxStyle}>
                <h3 style={sectionTitleStyle}>Son lot hareketleri</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>LOT</th>
                      <th style={thStyle}>MATERYAL</th>
                      <th style={thStyle}>KAYNAK</th>
                      <th style={thStyle}>TESİS</th>
                      <th style={thStyle}>DURUM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.slice(0, 6).map((lot) => (
                      <tr key={lot.id} style={{ borderTop: "1px solid #e8e8e8" }}>
                        <td style={{ ...tdStyle, color: "#111111", fontWeight: 600 }}>{lot.id}</td>
                        <td style={tdStyle}>{lot.material}</td>
                        <td style={tdStyle}>{lot.sourceId || "—"}</td>
                        <td style={tdStyle}>{lot.facility}</td>
                        <td style={{ ...tdStyle, color: "#111111", fontSize: 11, fontWeight: 700 }}>{lot.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ ...sectionBoxStyle, borderColor: criticalBins.length ? "#111111" : "#e8e8e8" }}>
                <div style={{ fontSize: "11px", color: criticalBins.length ? "#111111" : "#111111", fontWeight: "700", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  {criticalBins.length ? "SİSTEM UYARISI" : "SİSTEM NORMAL"}
                </div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#111111" }}>{t.aiForecastTitle}</div>
                <p style={{ color: "#444444", fontSize: "13px", margin: "8px 0 0 0", lineHeight: "1.5" }}>
                  {criticalBins.length
                    ? criticalBins.map((b) => `${b.location || b.bin_id} %${b.fill_percentage}`).join(" · ") + ". Yeni kabuller daha boş depolara kaydırılmalıdır."
                    : "Beş depoda kritik doluluk yok. Rotalama motoru mevcut lotları malzeme türüne göre dağıtmaya hazır."}
                  {hotSites.length ? ` Kritik toplama: ${hotSites.slice(0, 4).map((s) => `${s.id} %${s.fill}`).join(" · ")}.` : ""}
                  {managerUnread ? ` ${managerUnread} müdür mesajı bekliyor.` : ""}
                </p>
                <div style={{ marginTop: 16, fontSize: 12, color: "#444444" }}>
                  Bordro {formatTry(hr.gross)} (prim {formatTry(hr.bonus)}) · {hr.count} personel · su {(esgData.water_saved_liters || 0).toLocaleString("tr-TR")} L
                  {fx?.usdTry ? ` · USD ${Number(fx.usdTry).toFixed(2)} ₺` : ""}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  <button type="button" style={linkBtn} onClick={() => setTab("managers")}>Müdürler</button>
                  <button type="button" style={linkBtn} onClick={() => setTab("staff")}>Personel</button>
                  {canAccess(user.role, "hr") && <button type="button" style={linkBtn} onClick={() => setTab("hr")}>İnsan Kaynakları</button>}
                  <button type="button" style={linkBtn} onClick={() => setTab("fleet")}>Filo</button>
                  <button type="button" style={linkBtn} onClick={() => setTab("waybills")}>İrsaliye</button>
                  <button type="button" style={linkBtn} onClick={() => setTab("sales")}>Satış · Başer</button>
                  <button type="button" style={linkBtn} onClick={() => setTab("salesStar")}>Satış · Star</button>
                  <button type="button" style={linkBtn} onClick={() => setTab("priceCompare")}>1 kg karşılaştır</button>
                  <button type="button" style={linkBtn} onClick={() => setTab("reports")}>Kur / P&L</button>
                </div>
              </div>
            </div>
            <div style={{ ...sectionBoxStyle, marginTop: 16 }}>
              <h3 style={sectionTitleStyle}>Son mesajlar</h3>
              {[
                ...depotMessages.map((m) => ({ ...m, kind: "depo", label: m.depotId })),
                ...siteMessages.map((m) => ({ ...m, kind: "toplama", label: m.siteId })),
                ...managerMessages.map((m) => ({ ...m, kind: "müdür", label: managerOf(m.managerId).name }))
              ]
                .sort((a, b) => String(a.time || "").localeCompare(String(b.time || ""), "tr"))
                .slice(-6)
                .reverse()
                .map((m) => (
                  <div key={`${m.kind}-${m.id}`} style={{ borderTop: "1px solid #e8e8e8", padding: "8px 0", fontSize: 12, color: "#111111" }}>
                    <span style={{ color: m.kind === "müdür" ? "#111111" : m.kind === "depo" ? "#111111" : "#111111", fontWeight: 700 }}>{m.label}</span>
                    {" · "}{m.body}
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === "map" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.map}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px" }}>
              Büyük daireler 5 işleme deposu. Küçük noktalar 30 toplama. Yeşil pin Başer (Çerkezköy), mavi pin Star (Hadımköy).
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, minHeight: 440 }}>
              <div style={{ ...sectionBoxStyle, padding: 0, overflow: "hidden" }}>
                <DepotMap
                  bins={iotBins}
                  selectedId={selectedDepot?.id}
                  onSelect={(depot) => { setSelectedDepot(depot); setSelectedCollection(null); }}
                  collectionPoints={filledSites}
                  selectedCollectionId={selectedCollection?.id}
                  onSelectCollection={(point) => { setSelectedCollection(point); setSelectedDepot(null); }}
                />
              </div>
              <div style={sectionBoxStyle}>
                {selectedCollection ? (
                  <>
                    <h3 style={sectionTitleStyle}>{selectedCollection.id}</h3>
                    <div style={{ fontSize: 12, color: "#111111", fontWeight: 700, marginBottom: 8 }}>{selectedCollection.material}</div>
                    <div style={{ fontSize: 13, color: "#111111", marginBottom: 8 }}>{selectedCollection.name}</div>
                    <div style={{ fontSize: 12, color: "#444444", lineHeight: 1.5 }}>
                      {selectedCollection.district} · {selectedCollection.address}<br />
                      Teslim: {selectedCollection.facility}<br />
                      Doluluk %{selectedCollection.fill ?? "-"} · okunmamış {unreadBySite[selectedCollection.id] || 0}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      <button type="button" style={linkBtn} onClick={() => { openInboxSite(selectedCollection.id); setTab("siteInbox"); }}>Saha mesajı</button>
                      <button type="button" style={linkBtn} onClick={() => { setFleetDestId(selectedCollection.id); setTab("fleet"); }}>Filoya hedef</button>
                    </div>
                  </>
                ) : selectedDepot ? (
                  <>
                    <h3 style={sectionTitleStyle}>{selectedDepot.id} {selectedDepot.name}</h3>
                    <div style={{ fontSize: 12, color: pinColor(fillForDepot(selectedDepot, iotBins)), fontWeight: 700, marginBottom: 12 }}>
                      Doluluk %{fillForDepot(selectedDepot, iotBins)}
                    </div>
                    {lotsForDepot(selectedDepot, lots).length ? lotsForDepot(selectedDepot, lots).map((lot) => (
                      <div key={lot.id} style={{ borderTop: "1px solid #e8e8e8", padding: "8px 0", fontSize: 12, color: "#111111" }}>
                        <div style={{ color: "#111111", fontWeight: 700 }}>{lot.id}</div>
                        {lot.material} · {lot.weight} kg · {lot.status}{lot.sourceId ? ` · ${lot.sourceId}` : ""}
                      </div>
                    )) : <div style={{ color: "#444444", fontSize: 12 }}>Bu depoda lot yok.</div>}
                    <div style={{ fontSize: 12, color: "#111111", marginTop: 10, lineHeight: 1.5 }}>
                      {managersForDepot(selectedDepot.id).map((m) => (
                        <div key={m.id}>{m.title} ({m.shift}): {m.name}</div>
                      ))}
                      {hr.byDepot.find((d) => d.tesis === selectedDepot.id)?.kisi || 0} personel
                    </div>
                    {perfById[selectedDepot.id] && (
                      <div style={{ fontSize: 12, color: "#111111", marginTop: 8 }}>
                        Performans {perfById[selectedDepot.id].score} · {perfById[selectedDepot.id].label} · %{Math.round(perfById[selectedDepot.id].rate * 100)} prim
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      <button type="button" style={linkBtn} onClick={() => { openInboxDepot(selectedDepot.id); setTab("inbox"); }}>Depo mesajı</button>
                      <button type="button" style={linkBtn} onClick={() => { const m = managersForDepot(selectedDepot.id)[0]; if (m) openInboxManager(m.id); setTab("managers"); }}>Müdürler</button>
                      <button type="button" style={linkBtn} onClick={() => { setStaffFilter(selectedDepot.id); setTab("staff"); }}>Personel</button>
                      <button type="button" style={linkBtn} onClick={() => { setFleetDestId(selectedDepot.id); setTab("fleet"); }}>Filoya hedef</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 style={sectionTitleStyle}>Depo veya toplama alanı seçin</h3>
                    <div style={{ color: "#444444", fontSize: 12 }}>Yeşil / sarı / kırmızı: depo doluluğu. Toplama noktaları aynı ölçek. Mesaj ve filo ataması sağ panelden yapılır.</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "collection" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.collection}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px" }}>
              {COLLECTION_POINTS.length} toplama alanı · her materyal için 2 yer · %{80}+ dolu {hotSites.length} yer · okunmamış saha mesajı {siteUnread}
            </p>
            <div style={{ marginBottom: 16, maxWidth: 360 }}>
              <label style={labelStyle}>Materyal filtresi</label>
              <select value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} style={inputStyle}>
                <option value="all">Tüm materyaller (30 alan)</option>
                {COLLECTION_MATERIALS.map((mat) => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ ...sectionBoxStyle, padding: 0, overflow: "hidden", minHeight: 360 }}>
                <DepotMap
                  bins={iotBins}
                  selectedId={null}
                  collectionPoints={visibleCollections}
                  selectedCollectionId={selectedCollection?.id}
                  onSelectCollection={setSelectedCollection}
                />
              </div>
              <div style={sectionBoxStyle}>
                {selectedCollection ? (
                  <>
                    <h3 style={sectionTitleStyle}>{selectedCollection.name}</h3>
                    <div style={{ fontSize: 12, color: "#111111", fontWeight: 700 }}>{selectedCollection.material}</div>
                    <p style={{ fontSize: 12, color: "#444444", lineHeight: 1.6 }}>
                      {selectedCollection.district}<br />
                      {selectedCollection.address}<br />
                      Götürülecek tesis: {selectedCollection.facility}<br />
                      Doluluk %{selectedCollection.fill ?? "-"} · mesaj {unreadBySite[selectedCollection.id] || 0}
                    </p>
                    {siteContact(selectedCollection.id) && (
                      <div style={{ fontSize: 12, color: "#444444", marginBottom: 10 }}>
                        Saha: {siteContact(selectedCollection.id).contact} · {siteContact(selectedCollection.id).phone}
                      </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <button type="button" style={linkBtn} onClick={() => { openInboxSite(selectedCollection.id); setTab("siteInbox"); }}>Mesaj aç</button>
                      <button type="button" style={linkBtn} onClick={() => { setFleetDestId(selectedCollection.id); setTab("fleet"); }}>Araç gönder</button>
                    </div>
                  </>
                ) : (
                  <div style={{ color: "#444444", fontSize: 12 }}>Haritadaki noktaya tıklayın veya aşağıdaki listeden seçin.</div>
                )}
              </div>
            </div>
            {collectionGroups.map((group) => (
              <div key={group.material} style={{ ...sectionBoxStyle, marginBottom: 12 }}>
                <h3 style={{ ...sectionTitleStyle, marginBottom: 8 }}>{group.material} · {group.sites.length} yer</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {group.sites.map((site) => (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => setSelectedCollection(site)}
                      style={{
                        textAlign: "left",
                        background: selectedCollection?.id === site.id ? "#eeeeee" : "#ffffff",
                        border: "1px solid #e8e8e8",
                        borderRadius: 6,
                        padding: 12,
                        cursor: "pointer",
                        color: "#111111"
                      }}
                    >
                      <div style={{ fontSize: 11, color: "#111111", fontWeight: 700 }}>{site.id} · {site.district}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, margin: "4px 0" }}>{site.name}</div>
                      <div style={{ fontSize: 11, color: "#444444" }}>{site.address}</div>
                      <div style={{ fontSize: 11, color: Number(site.fill) >= 80 ? "#111111" : "#444444", marginTop: 6 }}>
                        Teslim: {site.facility} · Doluluk %{site.fill}
                        {(unreadBySite[site.id] || 0) > 0 ? ` · ${unreadBySite[site.id]} mesaj` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "routes" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.routes}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px" }}>
              Günlük tur: en yakın komşu sıra, çıkış FAC-01. 15 araçlı filo ve saha mesajları bu duraklara bağlanır.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {COLLECTION_MATERIALS.map((mat) => {
                const on = routeMaterials.includes(mat);
                return (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => setRouteMaterials((prev) => (on ? prev.filter((m) => m !== mat) : [...prev, mat]))}
                    style={{
                      background: on ? "#ffffff" : "#f4f4f4",
                      color: "#111111",
                      border: "1px solid #d0d0d0",
                      borderRadius: 99,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: 11
                    }}
                  >
                    {mat}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <button type="button" style={btnPrimary} onClick={() => printDriverManifest(dailyRoutes)}>
                Sürücü listesini yazdır
              </button>
              <button type="button" style={linkBtn} onClick={() => setTab("fleet")}>Filoda canlı konum</button>
              <button type="button" style={linkBtn} onClick={() => setTab("collection")}>Toplama dolulukları</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {dailyRoutes.map((route) => (
                <div key={route.id} style={sectionBoxStyle}>
                  <h3 style={sectionTitleStyle}>{route.id} · {route.name}</h3>
                  <div style={{ fontSize: 12, color: "#444444", marginBottom: 12 }}>{route.stops.length} durak · {route.km} km · {route.depot}</div>
                  {route.stops.map((stop) => (
                    <div key={stop.id} style={{ borderTop: "1px solid #e8e8e8", padding: "8px 0", fontSize: 12, color: "#111111", display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span><strong style={{ color: "#111111" }}>{stop.order}.</strong> {stop.id} {stop.name} · {stop.material} · %{stop.fill} · {stop.legKm} km</span>
                      <button type="button" style={{ ...linkBtn, padding: "4px 8px" }} onClick={() => { setFleetDestId(stop.id); setTab("fleet"); }}>Araç</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "fleet" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.fleet}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px" }}>
              15 araç canlı konum · 15 şoför. Depodan çıkan tırlar Başer / Çerkezköy (yeşil) veya Star / Hadımköy (mavi) kabulüne gider. Görevde {taskedFleet.length} · sürülen {drivenKm} km · plan {plannedKm} km.
            </p>
            {hotSites.length ? (
              <div style={{ ...sectionBoxStyle, marginBottom: 12, fontSize: 12, color: "#111111" }}>
                Kritik toplama: {hotSites.slice(0, 8).map((s) => s.id).join(" · ")}
                <button type="button" style={{ ...linkBtn, marginLeft: 10 }} onClick={() => { setFleetDestId(hotSites[0].id); }}>
                  İlk kritik hedefi seç
                </button>
              </div>
            ) : null}
            {dispatchNote && <div style={{ ...sectionBoxStyle, marginBottom: 12, color: "#111111", fontSize: 12 }}>{dispatchNote}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, minHeight: 440 }}>
              <div style={{ ...sectionBoxStyle, padding: 0, overflow: "hidden" }}>
                <FleetMap vehicles={fleet} selectedId={selectedVehicleId} onSelect={setSelectedVehicleId} />
              </div>
              <div style={sectionBoxStyle}>
                {(() => {
                  const v = fleet.find((x) => x.id === selectedVehicleId) || fleet[0];
                  if (!v) return null;
                  return (
                    <>
                      <h3 style={sectionTitleStyle}>{v.plate}</h3>
                      <div style={{ fontSize: 13, color: "#111111", marginBottom: 8 }}>{v.brand} {v.model}</div>
                      <div style={{ fontSize: 12, color: "#444444", lineHeight: 1.6 }}>
                        Sürücü: {v.driver}<br />
                        Tel: +{v.phone}<br />
                        Konum: {v.lat.toFixed(5)}, {v.lng.toFixed(5)}<br />
                        Hız ~{v.speedKmh} km/s · ping {v.lastPing}<br />
                        Hedef: {v.destLabel || "atanmadı"}
                      </div>
                      <label style={{ ...labelStyle, marginTop: 14 }}>Gidilecek yer</label>
                      <select value={fleetDestId} onChange={(e) => setFleetDestId(e.target.value)} style={inputStyle}>
                        {FLEET_DESTINATIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                      </select>
                      <button type="button" style={{ ...btnPrimary, width: "100%", marginTop: 10 }} onClick={() => sendFleetNotify("sms")}>
                        SMS ile telefona gönder
                      </button>
                      <button type="button" style={{ ...btnPrimary, width: "100%", marginTop: 8, backgroundColor: "#ffffff" }} onClick={() => sendFleetNotify("wa")}>
                        WhatsApp ile gönder
                      </button>
                      <button type="button" style={{ ...linkBtn, width: "100%", marginTop: 8 }} onClick={() => setTab("routes")}>Günlük tur durakları</button>
                      <button type="button" style={{ ...linkBtn, width: "100%", marginTop: 6 }} onClick={() => setTab("siteInbox")}>Saha mesajları</button>
                      <button
                        type="button"
                        style={{ ...linkBtn, width: "100%", marginTop: 6 }}
                        onClick={() => {
                          const p = staffRoster.find((s) => s.name === v.driver);
                          if (p) setSelectedStaffId(p.id);
                          setStaffFilter("şoför");
                          setTab("staff");
                        }}
                      >
                        Şoför özlüğü
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, backgroundColor: "#ffffff", border: "1px solid #e8e8e8", borderRadius: 6, overflow: "hidden" }}>
              <thead>
                <tr style={{ backgroundColor: "#e8e8e8" }}>
                  <th style={thStyle}>PLAKA</th>
                  <th style={thStyle}>MARKA</th>
                  <th style={thStyle}>MODEL</th>
                  <th style={thStyle}>SÜRÜCÜ</th>
                  <th style={thStyle}>KONUM</th>
                  <th style={thStyle}>HEDEF</th>
                  <th style={thStyle}>KM</th>
                </tr>
              </thead>
              <tbody>
                {fleet.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    style={{ borderTop: "1px solid #e8e8e8", cursor: "pointer", background: selectedVehicleId === v.id ? "#eeeeee" : "transparent" }}
                  >
                    <td style={{ ...tdStyle, color: "#111111", fontWeight: 700 }}>{v.plate}</td>
                    <td style={tdStyle}>{v.brand}</td>
                    <td style={tdStyle}>{v.model}</td>
                    <td style={tdStyle}>{v.driver}</td>
                    <td style={tdStyle}>{v.lat.toFixed(4)}, {v.lng.toFixed(4)}</td>
                    <td style={tdStyle}>{v.destLabel || "—"}</td>
                    <td style={tdStyle}>{Number(v.tripKm || 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "inbox" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.inbox}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px" }}>
              5 depo sahibinden gelen talepler. 10 müdür için ayrı <button type="button" onClick={() => setTab("managers")} style={{ background: "none", border: "none", color: "#111111", cursor: "pointer", padding: 0, fontSize: 12 }}>Müdürler</button> sekmesi.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, minHeight: 440 }}>
              <div style={{ ...sectionBoxStyle, padding: 0, overflow: "auto" }}>
                {inboxThreads.map((th) => (
                  <button
                    key={th.depotId}
                    type="button"
                    onClick={() => openInboxDepot(th.depotId)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      background: inboxDepot === th.depotId ? "#eeeeee" : "transparent",
                      border: "none",
                      borderBottom: "1px solid #e8e8e8",
                      color: "#111111",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{th.depot}</span>
                      {th.unread > 0 && (
                        <span style={{ background: "#ffffff", color: "#111111", borderRadius: 99, fontSize: 10, padding: "2px 7px", fontWeight: 700 }}>{th.unread}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#444444", marginTop: 4 }}>{th.owner}</div>
                    <div style={{ fontSize: 11, color: "#444444", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {th.last?.body || "Henüz mesaj yok"}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ ...sectionBoxStyle, display: "flex", flexDirection: "column" }}>
                {(() => {
                  const owner = ownerOf(inboxDepot);
                  const items = depotMessages.filter((m) => m.depotId === inboxDepot);
                  return (
                    <>
                      <h3 style={sectionTitleStyle}>{owner.depot}</h3>
                      <div style={{ fontSize: 12, color: "#444444", marginTop: -8, marginBottom: 12 }}>
                        Sahip: {owner.owner} · {owner.phone}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <button type="button" style={linkBtn} onClick={() => { setFleetDestId(inboxDepot); setTab("fleet"); }}>Filoya hedef</button>
                        <button type="button" style={linkBtn} onClick={() => setTab("map")}>Harita</button>
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", minHeight: 240, display: "flex", flexDirection: "column", gap: 8 }}>
                        {items.length ? items.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              alignSelf: m.direction === "out" ? "flex-end" : "flex-start",
                              maxWidth: "85%",
                              background: m.direction === "out" ? "#eeeeee" : "#e8e8e8",
                              border: "1px solid #d0d0d0",
                              borderRadius: 8,
                              padding: "10px 12px",
                              fontSize: 13,
                              color: "#111111"
                            }}
                          >
                            <div style={{ fontSize: 10, color: "#444444", marginBottom: 4 }}>
                              {m.direction === "in" ? owner.owner : "WasteFlow"} · {m.time}
                            </div>
                            {m.body}
                          </div>
                        )) : <div style={{ color: "#444444", fontSize: 12 }}>Bu depodan mesaj yok.</div>}
                      </div>
                      <form onSubmit={sendInboxReply} style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <input
                          value={inboxReply}
                          onChange={(e) => setInboxReply(e.target.value)}
                          placeholder="Sahibe yanıt yazın…"
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button type="submit" style={btnPrimary}>Gönder</button>
                      </form>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {tab === "siteInbox" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.siteInbox}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px" }}>
              30 toplama alanının saha sorumlularından gelen talepler. Okunmamış: {siteUnread}. Depo sahipleri için Depo Mesajları sekmesi ({inboxUnread}).
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, minHeight: 440 }}>
              <div style={{ ...sectionBoxStyle, padding: 0, overflow: "auto", maxHeight: 560 }}>
                {pickupThreads.map((th) => (
                  <button
                    key={th.siteId}
                    type="button"
                    onClick={() => openInboxSite(th.siteId)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      background: inboxSite === th.siteId ? "#eeeeee" : "transparent",
                      border: "none",
                      borderBottom: "1px solid #e8e8e8",
                      color: "#111111",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{th.siteId}</span>
                      {th.unread > 0 && (
                        <span style={{ background: "#ffffff", color: "#111111", borderRadius: 99, fontSize: 10, padding: "2px 7px", fontWeight: 700 }}>{th.unread}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#111111", marginTop: 2 }}>{th.material}</div>
                    <div style={{ fontSize: 11, color: "#444444", marginTop: 2 }}>{th.contact} · {th.district}</div>
                    <div style={{ fontSize: 11, color: "#444444", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {th.last?.body || "Henüz mesaj yok"}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ ...sectionBoxStyle, display: "flex", flexDirection: "column" }}>
                {(() => {
                  const site = siteContact(inboxSite);
                  const items = siteMessages.filter((m) => m.siteId === inboxSite);
                  return (
                    <>
                      <h3 style={sectionTitleStyle}>{site.siteId} · {site.name}</h3>
                      <div style={{ fontSize: 12, color: "#444444", marginTop: -8, marginBottom: 12 }}>
                        {site.material} · {site.district}<br />
                        Saha: {site.contact} · {site.phone}<br />
                        {site.address}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                        <button type="button" style={linkBtn} onClick={() => { setFleetDestId(site.siteId); setTab("fleet"); }}>Filoya hedef</button>
                        <button type="button" style={linkBtn} onClick={() => setTab("collection")}>Haritada gör</button>
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", minHeight: 240, display: "flex", flexDirection: "column", gap: 8 }}>
                        {items.length ? items.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              alignSelf: m.direction === "out" ? "flex-end" : "flex-start",
                              maxWidth: "85%",
                              background: m.direction === "out" ? "#eeeeee" : "#e8e8e8",
                              border: "1px solid #d0d0d0",
                              borderRadius: 8,
                              padding: "10px 12px",
                              fontSize: 13,
                              color: "#111111"
                            }}
                          >
                            <div style={{ fontSize: 10, color: "#444444", marginBottom: 4 }}>
                              {m.direction === "in" ? site.contact : "WasteFlow"} · {m.time}
                            </div>
                            {m.body}
                          </div>
                        )) : <div style={{ color: "#444444", fontSize: 12 }}>Bu toplama alanından mesaj yok. Soldan başka bir COL seçin veya ilk yanıtı siz yazın.</div>}
                      </div>
                      <form onSubmit={sendSiteReply} style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <input
                          value={siteReply}
                          onChange={(e) => setSiteReply(e.target.value)}
                          placeholder="Saha sorumlusuna yanıt yazın…"
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button type="submit" style={btnPrimary}>Gönder</button>
                      </form>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {tab === "managers" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.managers}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px" }}>
              Her depoda 2 müdür (gündüz + gece) · 10 kişi. Personel özlük bilgisi ayrı sekmede. Okunmamış: {managerUnread}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, minHeight: 440 }}>
              <div style={{ ...sectionBoxStyle, padding: 0, overflow: "auto", maxHeight: 560 }}>
                {managerThreadsList.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => openInboxManager(th.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      background: inboxManager === th.id ? "#eeeeee" : "transparent",
                      border: "none",
                      borderBottom: "1px solid #e8e8e8",
                      color: "#111111",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{th.name}</span>
                      {th.unread > 0 && (
                        <span style={{ background: "#ffffff", color: "#111111", borderRadius: 99, fontSize: 10, padding: "2px 7px", fontWeight: 700 }}>{th.unread}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#111111", marginTop: 2 }}>{th.depot} · {th.title}</div>
                    <div style={{ fontSize: 11, color: "#444444", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {th.last?.body || "Henüz mesaj yok"}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ ...sectionBoxStyle, display: "flex", flexDirection: "column" }}>
                {(() => {
                  const mgr = managerOf(inboxManager);
                  const items = managerMessages.filter((m) => m.managerId === inboxManager);
                  return (
                    <>
                      <h3 style={sectionTitleStyle}>{mgr.name}</h3>
                      <div style={{ fontSize: 12, color: "#444444", marginTop: -8, marginBottom: 12 }}>
                        {mgr.title} · {mgr.shift}<br />
                        {mgr.depot} · {mgr.phone}<br />
                        {mgr.address}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <button type="button" style={linkBtn} onClick={() => { setFleetDestId(mgr.depotId); setTab("fleet"); }}>Filoya hedef</button>
                        <button type="button" style={linkBtn} onClick={() => { setSelectedStaffId(staffRoster.find((p) => p.managerId === mgr.id)?.id || "PER-000"); setTab("staff"); }}>Özlük kartı</button>
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", minHeight: 240, display: "flex", flexDirection: "column", gap: 8 }}>
                        {items.length ? items.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              alignSelf: m.direction === "out" ? "flex-end" : "flex-start",
                              maxWidth: "85%",
                              background: m.direction === "out" ? "#eeeeee" : "#e8e8e8",
                              border: "1px solid #d0d0d0",
                              borderRadius: 8,
                              padding: "10px 12px",
                              fontSize: 13,
                              color: "#111111"
                            }}
                          >
                            <div style={{ fontSize: 10, color: "#444444", marginBottom: 4 }}>
                              {m.direction === "in" ? mgr.name : "WasteFlow"} · {m.time}
                            </div>
                            {m.body}
                          </div>
                        )) : <div style={{ color: "#444444", fontSize: 12 }}>Bu müdürden mesaj yok.</div>}
                      </div>
                      <form onSubmit={sendManagerReply} style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <input
                          value={managerReply}
                          onChange={(e) => setManagerReply(e.target.value)}
                          placeholder="Müdüre yanıt yazın…"
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button type="submit" style={btnPrimary}>Gönder</button>
                      </form>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {tab === "staff" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.staff}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px" }}>
              {staffRoster.length} personel · {hr.patrons} patron · {hr.managers} müdür · {hr.drivers} şoför · {staffRoster.length - hr.managers - hr.drivers - hr.patrons} saha/idari.
              {canAccess(user.role, "hr") ? " İşe alım / çıkış İnsan Kaynakları sekmesinde." : ""}
            </p>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} style={{ ...inputStyle, width: 220 }}>
                <option value="all">Tüm personel ({staffRoster.length})</option>
                <option value="patron">Patron</option>
                <option value="müdür">Müdürler ({hr.managers})</option>
                <option value="şoför">Şoförler ({hr.drivers})</option>
                <option value="FAC-01">FAC-01 Topkapı</option>
                <option value="FAC-02">FAC-02 Zeytinburnu</option>
                <option value="FAC-03">FAC-03 Bahçelievler</option>
                <option value="FAC-04">FAC-04 İstinye</option>
                <option value="FAC-05">FAC-05 Küçükçekmece</option>
              </select>
              <input value={staffQuery} onChange={(e) => setStaffQuery(e.target.value)} placeholder="Ad, unvan, plaka…" style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
              <div style={{ ...sectionBoxStyle, padding: 0, maxHeight: 520, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#e8e8e8" }}>
                      <th style={thStyle}>AD</th>
                      <th style={thStyle}>MEVKİ</th>
                      <th style={thStyle}>DEPO</th>
                      <th style={thStyle}>MAAŞ</th>
                      <th style={thStyle}>PRİM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStaff.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedStaffId(p.id)}
                        style={{ borderTop: "1px solid #e8e8e8", cursor: "pointer", background: selectedStaff?.id === p.id ? "#eeeeee" : "transparent" }}
                      >
                        <td style={{ ...tdStyle, color: "#111111", fontWeight: 600 }}>{p.name}</td>
                        <td style={tdStyle}>{p.title}</td>
                        <td style={tdStyle}>{p.depotId}</td>
                        <td style={tdStyle}>{formatTry(p.salary)}</td>
                        <td style={{ ...tdStyle, color: "#111111" }}>{formatTry(payFor(p, perfById).bonus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={sectionBoxStyle}>
                {selectedStaff && (
                  <>
                    <h3 style={sectionTitleStyle}>{selectedStaff.name}</h3>
                    <div style={{ fontSize: 13, color: "#111111", lineHeight: 1.8 }}>
                      {selectedStaff.id} · {selectedStaff.gender} · {selectedStaff.age} yaş<br />
                      Mevki: {selectedStaff.title}{selectedStaff.shift ? ` · ${selectedStaff.shift}` : ""}<br />
                      Çalıştığı yer: {selectedStaff.depot}<br />
                      Adres: {selectedStaff.address}<br />
                      Tel: {selectedStaff.phone}<br />
                      Maaş: {formatTry(selectedStaff.salary)}
                      {selectedPay ? <><br />Prim: {formatTry(selectedPay.bonus)} ({selectedPay.label} · %{Math.round(selectedPay.rate * 100)} · skor {selectedPay.score})<br />Toplam: {formatTry(selectedPay.total)}</> : null}
                      {selectedStaff.plate ? <><br />Plaka: {selectedStaff.plate}</> : null}
                      {selectedStaff.hiredAt ? <><br />İşe giriş: {selectedStaff.hiredAt}</> : null}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                      {selectedStaff.kind === "müdür" && selectedStaff.managerId && (
                        <button type="button" style={btnPrimary} onClick={() => { openInboxManager(selectedStaff.managerId); setTab("managers"); }}>
                          Müdürle yazış
                        </button>
                      )}
                      {canAccess(user.role, "hr") && (
                        <>
                          <button type="button" style={linkBtn} onClick={() => setTab("hr")}>İşe al / çıkar</button>
                          {selectedStaff.kind !== "patron" && (
                            <button type="button" style={{ ...linkBtn, borderColor: "#111111", color: "#111111" }} onClick={() => fireStaff(selectedStaff.id)}>
                              İşten çıkar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "hr" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.hr}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px" }}>
              İşe alım, çıkış ve depo primi. Maaş {formatTry(hr.payroll)} · prim {formatTry(hr.bonus)} · toplam {formatTry(hr.gross)}.
            </p>
            {hrNote ? <div style={{ ...sectionBoxStyle, marginBottom: 12, color: "#111111", fontSize: 13 }}>{hrNote}</div> : null}
            <div style={{ ...sectionBoxStyle, marginBottom: 16 }}>
              <h3 style={sectionTitleStyle}>Depo performans primi</h3>
              <p style={{ color: "#444444", fontSize: 12, marginTop: -6 }}>Hacim (40) + işlenen lot (40) + doluluk (20) + boş/hazır depo. Karantina ve %85+ doluluk primi düşürür. A ≥88 → %18 · B ≥75 → %12 · C ≥60 → %7 · D ≥40 → %3.</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>DEPO</th>
                    <th style={thStyle}>SKOR</th>
                    <th style={thStyle}>BAND</th>
                    <th style={thStyle}>ORAN</th>
                    <th style={thStyle}>KG</th>
                    <th style={thStyle}>DOLULUK</th>
                    <th style={thStyle}>PRİM HAVUZU</th>
                  </tr>
                </thead>
                <tbody>
                  {depotPerf.map((d) => {
                    const row = hr.byDepot.find((x) => x.tesis === d.id);
                    return (
                      <tr key={d.id} style={{ borderTop: "1px solid #e8e8e8" }}>
                        <td style={tdStyle}>{d.id} {d.name}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: d.score >= 75 ? "#111111" : d.score < 45 ? "#111111" : "#111111" }}>{d.score}</td>
                        <td style={tdStyle}>{d.band} · {d.label}</td>
                        <td style={tdStyle}>%{Math.round(d.rate * 100)}</td>
                        <td style={tdStyle}>{d.kg} kg</td>
                        <td style={tdStyle}>%{d.fill}</td>
                        <td style={{ ...tdStyle, color: "#111111" }}>{formatTry(row?.prim || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16, alignItems: "start" }}>
              <div style={sectionBoxStyle}>
                <h3 style={sectionTitleStyle}>Personel ekle</h3>
                <form onSubmit={hireStaff} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Ad soyad</label>
                    <input value={hireForm.name} onChange={(e) => setHireForm({ ...hireForm, name: e.target.value })} style={inputStyle} placeholder="Örn: Ayşe Kara" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Yaş</label>
                      <input type="number" value={hireForm.age} onChange={(e) => setHireForm({ ...hireForm, age: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Cinsiyet</label>
                      <select value={hireForm.gender} onChange={(e) => setHireForm({ ...hireForm, gender: e.target.value })} style={inputStyle}>
                        <option>Erkek</option>
                        <option>Kadın</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Mevki</label>
                    <select value={hireForm.title} onChange={(e) => setHireForm({ ...hireForm, title: e.target.value })} style={inputStyle}>
                      {STAFF_TITLES.map((title) => <option key={title}>{title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Depo</label>
                    <select value={hireForm.depotId} onChange={(e) => setHireForm({ ...hireForm, depotId: e.target.value })} style={inputStyle}>
                      {STAFF_DEPOTS.map((d) => <option key={d.depotId} value={d.depotId}>{d.depot}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Maaş (₺)</label>
                      <input type="number" value={hireForm.salary} onChange={(e) => setHireForm({ ...hireForm, salary: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Vardiya</label>
                      <select value={hireForm.shift} onChange={(e) => setHireForm({ ...hireForm, shift: e.target.value })} style={inputStyle}>
                        <option>Gündüz</option>
                        <option>Gece</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Telefon</label>
                    <input value={hireForm.phone} onChange={(e) => setHireForm({ ...hireForm, phone: e.target.value })} style={inputStyle} placeholder="0532 …" />
                  </div>
                  <div>
                    <label style={labelStyle}>Adres</label>
                    <input value={hireForm.address} onChange={(e) => setHireForm({ ...hireForm, address: e.target.value })} style={inputStyle} placeholder="Boş bırakılırsa otomatik doldurulur" />
                  </div>
                  {hireForm.title === "Şoför" && (
                    <div>
                      <label style={labelStyle}>Plaka</label>
                      <input value={hireForm.plate} onChange={(e) => setHireForm({ ...hireForm, plate: e.target.value })} style={inputStyle} placeholder="34 WF …" />
                    </div>
                  )}
                  <button type="submit" style={btnPrimary}>İşe al</button>
                </form>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Personel çıkar</h3>
                  <button type="button" style={linkBtn} onClick={() => { persistStaff(DEFAULT_STAFF); setHrNote("Kadro başlangıç listesine döndü."); pushAudit("HR_RESET", "Kadro seed yüklendi"); }}>
                    Seed kadro
                  </button>
                </div>
                <p style={{ color: "#444444", fontSize: 12, marginTop: 0 }}>Listeden seçip işten çıkar. Patron kilitlidir.</p>
                <div style={{ maxHeight: 420, overflow: "auto" }}>
                  {staffRoster.map((p) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", borderTop: "1px solid #e8e8e8", padding: "8px 0" }}>
                      <button type="button" onClick={() => setSelectedStaffId(p.id)} style={{ background: "none", border: "none", color: "#111111", textAlign: "left", cursor: "pointer", flex: 1, padding: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: p.id === selectedStaffId ? "#111111" : "#111111" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#444444" }}>{p.id} · {p.title} · {p.depotId} · {formatTry(p.salary)} + {formatTry(payFor(p, perfById).bonus)}</div>
                      </button>
                      {p.kind === "patron" ? (
                        <span style={{ fontSize: 11, color: "#444444" }}>kilitli</span>
                      ) : (
                        <button type="button" style={{ ...linkBtn, borderColor: "#111111", color: "#111111", flexShrink: 0 }} onClick={() => fireStaff(p.id)}>
                          Çıkar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.reports}</h2>
            <p style={{ color: "#444444", fontSize: 13, margin: "8px 0 20px" }}>
              ESG, kadro ({hr.count} kişi / {formatTry(hr.gross)} maaş+prim), 5 depo × 2 müdür, lot P&L ve canlı kur.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" style={btnPrimary} onClick={() => downloadExcelReport({ lots: lots.map((l) => ({ ...l, ewc: ewcOf(l.material).code })), bins: iotBins, esg: esgData, metrics, econ: { ...econ, mass, license: LICENSE_NOTICE }, fx })}>
                Excel indir (.csv)
              </button>
              <button
                type="button"
                style={{ ...btnPrimary, backgroundColor: "#d0d0d0" }}
                onClick={() => printPdfReport({ lots, bins: iotBins, esg: esgData, metrics, econ: { ...econ, mass, license: LICENSE_NOTICE }, fx })}
              >
                PDF yazdır
              </button>
              <button type="button" style={{ ...btnPrimary, backgroundColor: "#ffffff" }} onClick={() => printCarbonCertificate({ esg: esgData, mass, user: user.name })}>
                Karbon sertifikası
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: fx?.live ? "#111111" : "#111111", fontWeight: 700 }}>
                  {fx?.live ? "CANLI KUR" : "SON BİLİNEN KUR"}
                  {fxBusy ? " · güncelleniyor" : ""}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#111111", marginTop: 8 }}>
                  1 USD = {fx?.usdTry ? Number(fx.usdTry).toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : "—"} ₺
                </div>
                <div style={{ fontSize: 12, color: "#444444", marginTop: 6 }}>{fx?.source || "kaynak bekleniyor"}</div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: fx?.live ? "#111111" : "#111111", fontWeight: 700 }}>CANLI KUR</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#111111", marginTop: 8 }}>
                  1 EUR = {fx?.eurTry ? Number(fx.eurTry).toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : "—"} ₺
                </div>
                <div style={{ fontSize: 12, color: "#444444", marginTop: 6 }}>
                  {fx?.updatedAt ? new Date(fx.updatedAt).toLocaleString("tr-TR") : "henüz çekilmedi"} · 45 sn
                </div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#111111", fontWeight: 700 }}>FİLO YAKIT</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111111", marginTop: 8 }}>{econ.fleetKm} km · {econ.fuelTry.toLocaleString("tr-TR")} ₺</div>
                <div style={{ fontSize: 12, color: "#444444", marginTop: 6 }}>{econ.dieselPerKm} ₺/km · plan {plannedKm} + sürülen {drivenKm}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#111111", fontWeight: 700 }}>BORDRO</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111111", marginTop: 8 }}>{formatTry(hr.gross)}</div>
                <div style={{ fontSize: 12, color: "#444444", marginTop: 6 }}>maaş {formatTry(hr.payroll)} · prim {formatTry(hr.bonus)}</div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#444444" }}>GELİR</div>
                <div style={{ color: "#111111", fontWeight: 700, marginTop: 6 }}>{formatMoney(econ.totals.revenue.try, "TRY")}</div>
                <div style={{ fontSize: 12, color: "#444444" }}>{formatMoney(econ.totals.revenue.usd, "USD")} · {formatMoney(econ.totals.revenue.eur, "EUR")}</div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#111111" }}>BAŞER SATIŞI</div>
                <div style={{ color: "#111111", fontWeight: 700, marginTop: 6 }}>{formatTry(salesBook.amount)}</div>
                <div style={{ fontSize: 12, color: "#444444" }}>{salesBook.kg.toLocaleString("tr-TR")} kg · {salesBook.count} sevk · Çerkezköy</div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#111111" }}>STAR SATIŞI</div>
                <div style={{ color: "#111111", fontWeight: 700, marginTop: 6 }}>{formatTry(starBook.amount)}</div>
                <div style={{ fontSize: 12, color: "#444444" }}>{starBook.kg.toLocaleString("tr-TR")} kg · {starBook.count} sevk · Hadımköy</div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#444444" }}>GİDER</div>
                <div style={{ color: "#111111", fontWeight: 700, marginTop: 6 }}>{formatMoney(econ.totals.cost.try, "TRY")}</div>
                <div style={{ fontSize: 12, color: "#444444" }}>{formatMoney(econ.totals.cost.usd, "USD")} · {formatMoney(econ.totals.cost.eur, "EUR")}</div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#444444" }}>USD / EUR ÇAPRAZ</div>
                <div style={{ color: "#111111", fontWeight: 700, marginTop: 6 }}>
                  {fx?.usdTry && fx?.eurTry ? (fx.usdTry / fx.eurTry).toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : "—"}
                </div>
                <div style={{ fontSize: 12, color: "#444444" }}>1 USD = ? EUR</div>
              </div>
            </div>
            <div style={{ ...sectionBoxStyle, marginTop: 16 }}>
              <h3 style={sectionTitleStyle}>Materyal gelir / maliyet (₺, $, €)</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Materyal</th>
                    <th style={thStyle}>kg</th>
                    <th style={thStyle}>₺/kg</th>
                    <th style={thStyle}>Gelir ₺</th>
                    <th style={thStyle}>Gider ₺</th>
                    <th style={thStyle}>Marj ₺</th>
                    <th style={thStyle}>Marj $</th>
                    <th style={thStyle}>Marj €</th>
                  </tr>
                </thead>
                <tbody>
                  {econ.rows.map((row) => {
                    const usd = fx?.usdTry ? row.margin / fx.usdTry : 0;
                    const eur = fx?.eurTry ? row.margin / fx.eurTry : 0;
                    return (
                      <tr key={row.material} style={{ borderTop: "1px solid #e8e8e8" }}>
                        <td style={tdStyle}>{row.material}</td>
                        <td style={tdStyle}>{row.kg}</td>
                        <td style={tdStyle}>{row.price}</td>
                        <td style={tdStyle}>{row.revenue.toLocaleString("tr-TR")}</td>
                        <td style={tdStyle}>{row.cost.toLocaleString("tr-TR")}</td>
                        <td style={{ ...tdStyle, color: row.margin >= 0 ? "#111111" : "#111111" }}>{row.margin.toLocaleString("tr-TR")}</td>
                        <td style={tdStyle}>{usd.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={tdStyle}>{eur.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: OPERASYON & ROTALAMA */}
        {tab === "operations" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.operations}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 0" }}>
              16 materyal · kaynak COL · önerilen tesis. Kadro 120 kişi; müdür onayı Müdürler sekmesinde.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
              <div style={sectionBoxStyle}>
                <h3 style={sectionTitleStyle}>{t.newProduction}</h3>
                {opsNote ? <div style={{ color: "#111111", fontSize: 12, marginBottom: 8 }}>{opsNote}</div> : null}
                <form onSubmit={handleCreateLot} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Materyal Türü</label>
                    <select
                      value={newLot.material}
                      onChange={(e) => {
                        const material = e.target.value;
                        const first = sourcesForMaterial(material)[0];
                        setNewLot({ ...newLot, material, sourceId: first?.id || "", facility: first?.facility || newLot.facility });
                      }}
                      style={inputStyle}
                    >
                      {MATERIAL_OPTIONS.map((mat) => <option key={mat}>{mat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Ağırlık (Kilogram)</label>
                    <input type="number" value={newLot.weight} onChange={e => setNewLot({ ...newLot, weight: e.target.value })} placeholder="Örn: 500" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Kaynak toplama alanı</label>
                    <select
                      value={newLot.sourceId}
                      onChange={(e) => setNewLot({ ...newLot, sourceId: e.target.value })}
                      style={inputStyle}
                    >
                      {sourcesForMaterial(newLot.material).map((site) => (
                        <option key={site.id} value={site.id}>{site.id} · {site.district}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Hedef Tesis</label>
                    <select value={newLot.facility} onChange={e => setNewLot({ ...newLot, facility: e.target.value })} style={inputStyle}>
                      {FACILITY_OPTIONS.map((fac) => <option key={fac}>{fac}</option>)}
                    </select>
                  </div>
                  <button type="submit" style={{ ...btnPrimary, marginTop: "8px" }}>{t.saveToSystem}</button>
                  <div style={{ fontSize: 11, color: "#444444" }}>EWC {ewcOf(newLot.material).code} · {ewcOf(newLot.material).label}</div>
                </form>
              </div>

              <div style={sectionBoxStyle}>
                <h3 style={sectionTitleStyle}>{t.lotRouting}</h3>
                <p style={{ color: "#444444", fontSize: "13px", lineHeight: "1.5", marginBottom: "20px" }}>
                  {lots[0]
                    ? recommendRoute(lots[0].material).reason.replace("yönlendirildi", "önerilir") + ` Güncel lot: ${lots[0].id} (${lots[0].material}).`
                    : "Rotalanacak lot yok."}
                </p>
                {routeMessage && <p style={{ color: "#111111", fontSize: "12px" }}>{routeMessage}</p>}
                <button type="button" onClick={handleApplyRouting} style={btnPrimary}>{t.applyAi}</button>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <button type="button" style={linkBtn} onClick={() => setTab("collection")}>Kaynak alanlar</button>
                  <button type="button" style={linkBtn} onClick={() => setTab("lots")}>Envanter / QR</button>
                  <button type="button" style={linkBtn} onClick={() => setTab("managers")}>Müdür onayı</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOT ENVANTERİ & CSV */}
        {tab === "lots" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={pageHeaderStyle}>{t.lots}</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLotPhoto} />
                <button type="button" onClick={() => setScanOpen(true)} style={{ background: "#ffffff", color: "#111111", border: "1px solid #111111", borderRadius: "4px", padding: "8px 16px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                  QR okut
                </button>
                <input ref={csvInputRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleCsvFile} />
                <button onClick={handleCsvUpload} style={{ background: "#d0d0d0", color: "#111111", border: "1px solid #666666", borderRadius: "4px", padding: "8px 16px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                  {t.bulkImport}
                </button>
              </div>
            </div>
            <p style={{ color: "#444444", fontSize: 12, margin: "10px 0 0" }}>
              QR okutunca zincir açılır. Aldım/Teslim tartım fişi, plaka ve imza ile irsaliye keser.
            </p>
            <div style={{ overflowX: "auto", marginTop: "20px", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e8e8e8" }}>
            <table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#e8e8e8", textAlign: "left" }}>
                  <th style={thStyle}>LOT ID</th>
                  <th style={thStyle}>MATERYAL</th>
                  <th style={thStyle}>AĞIRLIK</th>
                  <th style={thStyle}>TESİS</th>
                  <th style={thStyle}>KAYNAK</th>
                  <th style={thStyle}>EWC</th>
                  <th style={thStyle}>SAFLIK</th>
                  <th style={thStyle}>DURUM</th>
                  <th style={thStyle}>EYLEM</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map(lot => (
                  <tr key={lot.id} style={{ borderBottom: "1px solid #e8e8e8" }}>
                    <td style={{ ...tdStyle, fontWeight: "600", color: "#111111" }}>{lot.id}</td>
                    <td style={tdStyle}>{lot.material}</td>
                    <td style={tdStyle}>{lot.weight} kg</td>
                    <td style={tdStyle}>{lot.facility}</td>
                    <td style={tdStyle}>{lot.sourceId || "—"}</td>
                    <td style={tdStyle}>{ewcOf(lot.material).code}</td>
                    <td style={tdStyle}>%{lot.purity}</td>
                    <td style={tdStyle}><span style={{ color: "#111111", fontSize: "11px", fontWeight: "700" }}>{lot.status}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {lot.photoThumb && <img src={lot.photoThumb} alt="" width={28} height={28} style={{ borderRadius: 4, objectFit: "cover" }} />}
                        <button onClick={() => setQrModalLot(lot)} style={{ background: "#e8e8e8", color: "#444444", border: "1px solid #d0d0d0", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "11px" }}>
                          {t.qrLabel}
                        </button>
                        <button type="button" onClick={() => setQrModalLot(lot)} style={{ background: "#e8e8e8", color: "#111111", border: "1px solid #d0d0d0", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "11px" }}>
                          Zincir
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPhotoLotId(lot.id); photoInputRef.current?.click(); }}
                          style={{ background: "#e8e8e8", color: "#444444", border: "1px solid #d0d0d0", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "11px" }}
                        >
                          Foto
                        </button>
                        <button type="button" onClick={() => setLotStatus(lot, "ALINDI")} style={{ background: "#e8e8e8", color: "#111111", border: "1px solid #d0d0d0", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "11px" }}>
                          Aldım
                        </button>
                        <button type="button" onClick={() => setLotStatus(lot, "TESLİM EDİLDİ")} style={{ background: "#e8e8e8", color: "#111111", border: "1px solid #d0d0d0", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "11px" }}>
                          Teslim
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {tab === "waybills" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.waybills}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px" }}>
              Bu sayfadan alım/teslim irsaliyesi kesin. Kg, plaka ve imza zorunlu değil; lot seçip kesebilirsiniz.
            </p>
            {waybillNote ? <div style={{ ...sectionBoxStyle, marginBottom: 12, color: "#111111", fontSize: 13 }}>{waybillNote}</div> : null}
            <form onSubmit={submitWaybillForm} style={{ ...sectionBoxStyle, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Lot</label>
                <select
                  value={wbDraft.lotId || lots[0]?.id || ""}
                  onChange={(e) => {
                    const lot = lots.find((l) => l.id === e.target.value);
                    setWbDraft({ ...wbDraft, lotId: e.target.value, kg: lot ? String(lot.weight) : wbDraft.kg });
                  }}
                  style={inputStyle}
                >
                  {lots.map((lot) => (
                    <option key={lot.id} value={lot.id}>{lot.id} · {lot.material} · {lot.weight} kg</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tür</label>
                <select value={wbDraft.kind} onChange={(e) => setWbDraft({ ...wbDraft, kind: e.target.value })} style={inputStyle}>
                  <option value="TESLİM">Teslim</option>
                  <option value="ALIM">Alım</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tartım (kg)</label>
                <input type="number" value={wbDraft.kg} onChange={(e) => setWbDraft({ ...wbDraft, kg: e.target.value })} placeholder="Lot ağırlığı" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Plaka</label>
                <select value={wbDraft.plate || fleet[0]?.plate || ""} onChange={(e) => setWbDraft({ ...wbDraft, plate: e.target.value })} style={inputStyle}>
                  {fleet.map((v) => <option key={v.id} value={v.plate}>{v.plate} · {v.driver}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>İmza adı</label>
                <input value={wbDraft.signer} onChange={(e) => setWbDraft({ ...wbDraft, signer: e.target.value })} placeholder={user.name || "Ad soyad"} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>İmza (isteğe bağlı)</label>
                <SignaturePad onChange={(signData) => setWbDraft((prev) => ({ ...prev, signData }))} height={72} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="submit" style={{ ...btnPrimary, width: "100%" }}>İrsaliye kes</button>
              </div>
            </form>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={sectionBoxStyle}>
                {waybills.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedWaybillId(doc.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: selectedWaybillId === doc.id ? "#eeeeee" : "transparent",
                      border: "none",
                      borderBottom: "1px solid #e8e8e8",
                      color: "#111111",
                      padding: "10px 0",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#111111" }}>{doc.id} · {doc.kind}</div>
                    <div style={{ fontSize: 12, color: "#444444" }}>{doc.lotId} · {doc.kg} kg · {doc.plate} · {doc.time}</div>
                  </button>
                ))}
              </div>
              <div style={sectionBoxStyle}>
                {(() => {
                  const doc = waybills.find((w) => w.id === selectedWaybillId) || waybills[0];
                  if (!doc) return <div style={{ color: "#444444", fontSize: 12 }}>İrsaliye yok. Lot envanterinden Aldım/Teslim alın.</div>;
                  return (
                    <>
                      <h3 style={sectionTitleStyle}>{doc.id}</h3>
                      <div style={{ fontSize: 13, color: "#111111", lineHeight: 1.7 }}>
                        {doc.kind} · {doc.lotId}<br />
                        {doc.material} · EWC {doc.ewc}<br />
                        Tartım {doc.kg} kg · {doc.time}<br />
                        {doc.sourceId} → {doc.facility}<br />
                        {doc.plate} · {doc.driver}<br />
                        İmza: {doc.signer || "—"}
                      </div>
                      {doc.signData ? <img src={doc.signData} alt="imza" style={{ marginTop: 12, height: 56, background: "#ffffff", borderRadius: 4 }} /> : null}
                      <button type="button" style={{ ...btnPrimary, marginTop: 16 }} onClick={() => printWaybill(doc)}>İrsaliyeyi yazdır</button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {tab === "sales" && (
          <SalesDesk
            buyer={BASER}
            book={salesBook}
            sales={baserSales}
            sellableLots={sellableLots}
            fleet={fleet}
            draft={saleDraft}
            setDraft={setSaleDraft}
            lots={lots}
            note={saleNote}
            onSubmit={submitSaleTo(BASER, saleDraft, setSaleNote, setSelectedSaleId)}
            selectedId={selectedSaleId}
            setSelectedId={setSelectedSaleId}
            onFleet={(buyerId, plate) => { if (plate) dispatchToBuyer(plate, buyerId); else setFleetDestId(buyerId); setTab("fleet"); }}
            formatTry={formatTry}
            sectionBoxStyle={sectionBoxStyle}
            sectionTitleStyle={sectionTitleStyle}
            pageHeaderStyle={pageHeaderStyle}
            labelStyle={labelStyle}
            inputStyle={inputStyle}
            btnPrimary={btnPrimary}
            linkBtn={linkBtn}
            chartTooltip={chartTooltip}
            onCompare={() => setTab("priceCompare")}
          />
        )}

        {tab === "salesStar" && (
          <SalesDesk
            buyer={STAR}
            book={starBook}
            sales={starSales}
            sellableLots={sellableLots}
            fleet={fleet}
            draft={starDraft}
            setDraft={setStarDraft}
            lots={lots}
            note={starNote}
            onSubmit={submitSaleTo(STAR, starDraft, setStarNote, setSelectedStarSaleId)}
            selectedId={selectedStarSaleId}
            setSelectedId={setSelectedStarSaleId}
            onFleet={(buyerId, plate) => { if (plate) dispatchToBuyer(plate, buyerId); else setFleetDestId(buyerId); setTab("fleet"); }}
            formatTry={formatTry}
            sectionBoxStyle={sectionBoxStyle}
            sectionTitleStyle={sectionTitleStyle}
            pageHeaderStyle={pageHeaderStyle}
            labelStyle={labelStyle}
            inputStyle={inputStyle}
            btnPrimary={btnPrimary}
            linkBtn={linkBtn}
            chartTooltip={chartTooltip}
            onCompare={() => setTab("priceCompare")}
          />
        )}

        {tab === "priceCompare" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.priceCompare}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 16px", lineHeight: 1.55 }}>
              Aynı 1 kg malzeme için Başer (Çerkezköy) ve Star (Hadımköy) alış fiyatı. Farklar küçük tutuldu; kalın satır daha yüksek teklifi (WasteFlow için daha iyi satış) gösterir.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#111111", fontWeight: 700 }}>BAŞER DAHA YÜKSEK</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#111111", marginTop: 8 }}>{kgCompare.filter((r) => r.winner === "BASER").length} malzeme</div>
                <div style={{ fontSize: 12, color: "#444444", marginTop: 6 }}>Çerkezköy teklifi önde</div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#111111", fontWeight: 700 }}>STAR DAHA YÜKSEK</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#111111", marginTop: 8 }}>{kgCompare.filter((r) => r.winner === "STAR").length} malzeme</div>
                <div style={{ fontSize: 12, color: "#444444", marginTop: 6 }}>Hadımköy teklifi önde</div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#444444", fontWeight: 700 }}>EŞİT / SATILMAZ</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#111111", marginTop: 8 }}>{kgCompare.filter((r) => r.winner === "eşit").length} malzeme</div>
                <div style={{ fontSize: 12, color: "#444444", marginTop: 6 }}>Tehlikeli atık 0 ₺/kg</div>
              </div>
            </div>
            <div style={{ ...sectionBoxStyle, marginBottom: 16 }}>
              <h3 style={sectionTitleStyle}>1 kg alış fiyatı (₺)</h3>
              <div style={{ height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compareChart} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
                    <CartesianGrid stroke="#e8e8e8" />
                    <XAxis dataKey="name" stroke="#444444" tick={{ fontSize: 10 }} interval={0} angle={-32} textAnchor="end" />
                    <YAxis stroke="#444444" />
                    <Tooltip contentStyle={chartTooltip} />
                    <Legend />
                    <Bar dataKey="Başer" fill="#1B6B4A" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Star" fill="#1E5A9C" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={sectionBoxStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Malzeme</th>
                    <th style={thStyle}>Başer ₺/kg</th>
                    <th style={thStyle}>Star ₺/kg</th>
                    <th style={thStyle}>Fark</th>
                    <th style={thStyle}>%</th>
                    <th style={thStyle}>Daha yüksek teklif</th>
                    <th style={thStyle}>1 ton fark</th>
                  </tr>
                </thead>
                <tbody>
                  {kgCompare.map((row) => (
                    <tr key={row.material} style={{ borderTop: "1px solid #e8e8e8" }}>
                      <td style={tdStyle}>{row.material}</td>
                      <td style={{ ...tdStyle, color: "#111111" }}>{row.baser.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ ...tdStyle, color: "#111111" }}>{row.star.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={tdStyle}>{row.delta > 0 ? "+" : ""}{row.delta.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={tdStyle}>{row.pct > 0 ? "+" : ""}{row.pct}%</td>
                      <td style={{ ...tdStyle, color: row.winner === "STAR" ? "#1E5A9C" : row.winner === "BASER" ? "#1B6B4A" : "#444444", fontWeight: 700 }}>
                        {row.winner === "STAR" ? "Star" : row.winner === "BASER" ? "Başer" : "eşit"}
                      </td>
                      <td style={tdStyle}>{formatTry(Math.round(row.delta * 1000))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button type="button" style={linkBtn} onClick={() => setTab("sales")}>Başer satış</button>
                <button type="button" style={linkBtn} onClick={() => setTab("salesStar")}>Star satış</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GÖRSEL MATERYAL ANALİZİ VE YÜKLEME ALANI */}
        {tab === "ai_vision" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.aiVision}</h2>
            <p style={{ color: "#444444", fontSize: "13px", marginBottom: "20px" }}>
              Görüntüden malzeme sınıfı. Sonuç 16 tür ve 30 COL kaynağıyla operasyon formuna taşınabilir. Sahada lot fotoğrafı envanterde saklanır.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={pickImageFile}
                style={{
                  padding: "24px",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  border: dragOver ? "2px solid #111111" : "2px dashed #d0d0d0",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer"
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  id="imageUploadInput"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
                <div style={{ color: "#111111", fontSize: "13px", fontWeight: "700", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  GÖRSEL DOSYASI SEÇİN VEYA SÜRÜKLEYİN
                </div>
                <div style={{ color: "#444444", fontSize: "11px" }}>
                  Desteklenen Formatlar: PNG, JPG, JPEG, WEBP (Maks: 15MB)
                </div>

                {selectedImage && (
                  <div style={{ marginTop: "16px", fontSize: "12px", color: "#111111", fontWeight: "600" }}>
                    SEÇİLEN DOSYA: {selectedImage.name} ({(selectedImage.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAiAnalyze}
                  disabled={loadingAi}
                  style={{
                    ...btnPrimary,
                    marginTop: "20px",
                    width: "100%",
                    opacity: loadingAi ? 0.6 : 1,
                    cursor: loadingAi ? "wait" : "pointer"
                  }}
                >
                  {loadingAi ? "ANALİZ EDİLİYOR..." : "GÖRSEL MATERYALİ ANALİZ ET"}
                </button>
              </div>

              {/* Önizleme Alanı */}
              <div style={{ padding: "20px", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e8e8e8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Atık Materyal Önizleme"
                    style={{ maxWidth: "100%", maxHeight: "220px", borderRadius: "4px", border: "1px solid #d0d0d0", objectFit: "contain" }}
                  />
                ) : (
                  <div style={{ color: "#444444", fontSize: "12px", textAlign: "center", lineHeight: "1.6" }}>
                    GÖRSEL ÖNİZLEME ALANI<br />
                    <span style={{ fontSize: "11px", color: "#666666" }}>Analiz edilecek dosya seçildiğinde burada görüntülenecektir.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Analiz Sonuç Kartı */}
            {aiResult && (
              <div style={{ marginTop: "24px", padding: "20px", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #111111" }}>
                <div style={{ fontSize: "11px", color: "#111111", fontWeight: "700", letterSpacing: "0.5px" }}>SPEKTROMETRE ANALİZ SONUCU</div>
                <h3 style={{ margin: "6px 0 16px 0", color: "#111111", fontSize: "18px" }}>{aiResult.detected_material}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", fontSize: "13px", color: "#444444" }}>
                  <div>Model Doğruluğu: <strong style={{ color: "#111111" }}>%{Math.round((aiResult.confidence || 0) * 100)}</strong></div>
                  <div>Geri Dönüştürülebilirlik: <strong style={{ color: "#111111" }}>%{aiResult.recyclability_percentage}</strong></div>
                  <div>Tahmini CO₂ Tasarrufu: <strong style={{ color: "#111111" }}>{aiResult.estimated_co2_saving_kg_per_ton} kg/Ton</strong></div>
                </div>
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e8e8e8", fontSize: "13px", color: "#111111" }}>
                  <strong>Sistem Tavsiyesi:</strong> {aiResult.ai_recommendation}
                </div>
                <button
                  type="button"
                  style={{ ...btnPrimary, marginTop: 14 }}
                  onClick={() => {
                    const material = aiResult.detected_material;
                    const first = sourcesForMaterial(material)[0];
                    setNewLot((prev) => ({ ...prev, material, sourceId: first?.id || prev.sourceId, facility: first?.facility || prev.facility }));
                    setTab("operations");
                  }}
                >
                  Operasyona aktar
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: IOT TELEMETRİ */}
        {tab === "iot" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.iotBins}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 0" }}>
              5 depo IoT + 30 toplama doluluğu. %{85}+ depo koyu çerçeve; %{80}+ COL filo hedefine alınır.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginTop: "20px" }}>
              {iotBins.map((bin) => (
                <div key={bin.bin_id} style={{ padding: "20px", backgroundColor: "#ffffff", borderRadius: "6px", border: bin.fill_percentage > 85 ? "1px solid #111111" : "1px solid #e8e8e8" }}>
                  <div style={{ fontSize: "11px", color: "#444444", fontWeight: "700" }}>{bin.bin_id}</div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#111111", margin: "4px 0 12px 0" }}>{bin.location}</div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: bin.fill_percentage > 85 ? "#111111" : "#111111" }}>%{bin.fill_percentage}</div>
                  <div style={{ fontSize: "12px", color: "#444444", marginTop: "8px" }}>Batarya Seviyesi: %{bin.battery_level} | Veri: {bin.last_updated}</div>
                  {bin.fill_percentage > 85 && (
                    <div style={{ marginTop: "12px", fontSize: "11px", color: "#111111", fontWeight: "700", letterSpacing: "0.5px" }}>KAPASİTE UYARISI: ROTALAMA GEREKİYOR</div>
                  )}
                </div>
              ))}
            </div>
            <h3 style={{ ...sectionTitleStyle, marginTop: 24 }}>Toplama alanı dolulukları</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {filledSites.slice().sort((a, b) => Number(b.fill) - Number(a.fill)).map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => { setSelectedCollection(site); setTab("collection"); }}
                  style={{
                    textAlign: "left",
                    padding: 14,
                    backgroundColor: "#ffffff",
                    borderRadius: 6,
                    border: Number(site.fill) >= 80 ? "1px solid #111111" : "1px solid #e8e8e8",
                    color: "#111111",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontSize: 11, color: "#444444", fontWeight: 700 }}>{site.id}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, margin: "4px 0" }}>{site.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: Number(site.fill) >= 80 ? "#111111" : "#111111" }}>%{site.fill}</div>
                  <div style={{ fontSize: 11, color: "#444444", marginTop: 6 }}>{site.material} · {site.facility}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ESG & SÜRDÜRÜLEBİLİRLİK */}
        {tab === "esg" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.esg}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 0" }}>
              Döngüsellik hedefi %{CIRCULARITY_TARGET}. {LICENSE_NOTICE}
            </p>
            <div style={{ marginTop: "20px", padding: "24px", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #111111" }}>
              <div style={{ fontSize: "11px", color: "#111111", fontWeight: "700", letterSpacing: "0.5px" }}>UYUMLULUK DERECESİ</div>
              <h3 style={{ margin: "4px 0 20px 0", color: "#111111", fontSize: "20px" }}>{esgData?.esg_compliance_score}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", fontSize: "14px", color: "#444444" }}>
                <div>Engellenen CO₂ Emisyonu: <strong style={{ color: "#111111" }}>{esgData?.co2_avoided_tons} Ton</strong></div>
                <div>Kurtarılan Ağaç Sayısı: <strong style={{ color: "#111111" }}>{esgData?.trees_saved} Adet</strong></div>
                <div>Tasarruf Edilen Su Hacmi: <strong style={{ color: "#111111" }}>{esgData?.water_saved_liters?.toLocaleString()} Litre</strong></div>
                <div>Toplam İşlenen Atık Hacmi: <strong style={{ color: "#111111" }}>{esgData?.total_waste_processed_tons} Ton</strong></div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#444444" }}>DÖNGÜSELLİK</div>
                <div style={{ color: "#111111", fontWeight: 700, marginTop: 6 }}>%{metrics?.circularity_rate ?? 0}</div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#444444" }}>NET MARJ</div>
                <div style={{ color: "#111111", fontWeight: 700, marginTop: 6 }}>{formatMoney(econ.totals.margin.try, "TRY")}</div>
                <div style={{ fontSize: 12, color: "#444444" }}>{formatMoney(econ.totals.margin.usd, "USD")} · {formatMoney(econ.totals.margin.eur, "EUR")}</div>
              </div>
              <div style={sectionBoxStyle}>
                <div style={{ fontSize: 11, color: "#444444" }}>SAHA</div>
                <div style={{ color: "#111111", fontWeight: 700, marginTop: 6 }}>{COLLECTION_POINTS.length} COL · 15 araç</div>
                <div style={{ fontSize: 12, color: "#444444" }}>{hr.count} personel · prim {formatTry(hr.bonus)}</div>
                <div style={{ fontSize: 12, color: "#444444" }}>{inboxUnread + siteUnread + managerUnread} okunmamış kutu</div>
              </div>
            </div>
            <div style={{ ...sectionBoxStyle, marginTop: 12 }}>
              <h3 style={sectionTitleStyle}>Kütle dengesi</h3>
              <div style={{ fontSize: 13, color: "#111111", lineHeight: 1.7 }}>
                Giren {mass.incomingKg} kg · geri dönüşüm/teslim {mass.recoveredKg} kg · karantina {mass.landfillKg} kg · yolda {mass.transitKg} kg
              </div>
              <div style={{ height: 10, background: "#e8e8e8", borderRadius: 99, overflow: "hidden", display: "flex", marginTop: 10 }}>
                <div style={{ width: `${mass.incomingKg ? (mass.recoveredKg / mass.incomingKg) * 100 : 0}%`, background: "#000" }} />
                <div style={{ width: `${mass.incomingKg ? (mass.landfillKg / mass.incomingKg) * 100 : 0}%`, background: "#000" }} />
                <div style={{ width: `${mass.incomingKg ? (mass.transitKg / mass.incomingKg) * 100 : 0}%`, background: "#000" }} />
              </div>
              <button type="button" style={{ ...btnPrimary, marginTop: 14 }} onClick={() => printCarbonCertificate({ esg: esgData, mass, user: user.name })}>Karbon sertifikası yazdır</button>
            </div>
          </div>
        )}

        {/* TAB 7: SİSTEM DENETİM GÜNLÜĞÜ */}
        {tab === "audit" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.audit}</h2>
            <p style={{ color: "#444444", fontSize: 12, margin: "8px 0 0" }}>
              Lot, rota, filo, depo / saha / müdür kutuları ve özlük işlemleri bu günlüğe yazılır.
            </p>
            <button type="button" style={{ ...btnPrimary, marginTop: 12 }} onClick={() => printAuditPdf(auditLogs)}>Denetim PDF yazdır</button>
            <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "6px", border: "1px solid #e8e8e8", marginTop: "20px" }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{ borderBottom: "1px solid #e8e8e8", padding: "10px 0", fontFamily: "monospace", fontSize: "12px" }}>
                  <span style={{ color: "#444444" }}>[{log.timestamp}] </span>
                  <span style={{ color: "#111111", fontWeight: "600" }}>{log.action}: </span>
                  <span style={{ color: "#111111" }}>{log.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: SİSTEM & ENTEGRASYON */}
        {tab === "settings" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.settings}</h2>
            <div style={{ padding: "20px", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e8e8e8", marginTop: "20px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#111111" }}>Aktif modüller</h4>
              <div style={{ fontSize: 13, color: "#444444", lineHeight: 1.7 }}>
                5 depo × 2 müdür · {hr.count} personel · İK işe al/çıkar · müdür kutusu · özlük · irsaliye · canlı kur
              </div>
            </div>
            <div style={{ padding: "20px", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e8e8e8", marginTop: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#111111" }}>Aktif Entegrasyon Noktası</h4>
              <div style={{ fontSize: "13px", color: "#444444" }}>
                API dokümantasyonu:{" "}
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#111111", background: "#e8e8e8", padding: "4px 8px", borderRadius: "4px", textDecoration: "none", fontFamily: "monospace", cursor: "pointer" }}
                >
                  {docsUrl}
                </a>
              </div>
            </div>
            <div style={{ padding: "20px", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e8e8e8", marginTop: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#111111" }}>Kullanıcı ekle</h4>
              <form onSubmit={handleAddUser} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input placeholder="kullanıcı" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} style={inputStyle} />
                <input placeholder="parola" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} style={inputStyle} />
                <input placeholder="ad soyad" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} style={inputStyle} />
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={inputStyle}>
                  <option>Sistem Yöneticisi</option>
                  <option>Yönetici</option>
                  <option>Operatör</option>
                </select>
                <button type="submit" style={{ ...btnPrimary, gridColumn: "1 / -1" }}>Kullanıcıyı kaydet</button>
              </form>
              <div style={{ marginTop: 12, fontSize: 12, color: "#444444" }}>
                Yerel kullanıcılar: {allLocalUsers().map((u) => u.username).join(", ")}
              </div>
            </div>
          </div>
        )}

      </div>

      {scanOpen && <QrScanner onFound={onQrFound} onClose={() => setScanOpen(false)} />}
      {tourStep >= 0 && (
        <JuryTour
          step={tourStep}
          onGo={(id) => setTab(id)}
          onNext={() => {
            const next = tourStep + 1;
            const tabs = ["overview", "managers", "staff", "hr", "fleet", "priceCompare", "esg"];
            setTab(tabs[next] || "lots");
            setTourStep(next);
          }}
          onSkip={() => setTourStep(-1)}
        />
      )}
      {qrModalLot && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "8px", border: "1px solid #d0d0d0", width: "440px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: "11px", color: "#444444", fontWeight: "700", marginBottom: "12px" }}>LOT ZİNCİRİ · {ewcOf(qrModalLot.material).code}</div>
            <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "4px", margin: "12px 0", textAlign: "center" }}>
              <LotQr lot={qrModalLot} size={160} />
              <div style={{ color: "#000000", fontWeight: "700", fontSize: "18px", letterSpacing: "1px", marginTop: 8 }}>{qrModalLot.id}</div>
              <div style={{ color: "#d0d0d0", fontSize: "12px", marginTop: "4px" }}>{qrModalLot.material} · {qrModalLot.weight} kg · {qrModalLot.sourceId} → {qrModalLot.facility}</div>
            </div>
            <div style={{ fontSize: 12, color: "#111111" }}>
              {(qrModalLot.events || lots.find((l) => l.id === qrModalLot.id)?.events || []).map((ev, i) => (
                <div key={`${ev.at}-${i}`} style={{ borderTop: "1px solid #e8e8e8", padding: "8px 0" }}>
                  <div style={{ color: "#111111", fontWeight: 700 }}>{ev.type} · {ev.at}</div>
                  <div style={{ color: "#444444" }}>{ev.who}{ev.plate ? ` · ${ev.plate}` : ""} · {ev.detail}</div>
                </div>
              ))}
            </div>
            <button onClick={() => printLotLabel(qrModalLot)} style={{ ...btnPrimary, width: "100%", marginTop: 12, marginBottom: "8px" }}>{t.printLabel}</button>
            <button onClick={() => setQrModalLot(null)} style={{ background: "transparent", color: "#444444", border: "1px solid #d0d0d0", borderRadius: "4px", width: "100%", padding: "8px", cursor: "pointer", fontSize: "12px" }}>{t.close}</button>
          </div>
        </div>
      )}
      {ticketModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 55 }}>
          <form onSubmit={confirmTicket} style={{ backgroundColor: "#ffffff", padding: 24, borderRadius: 8, border: "1px solid #d0d0d0", width: 420 }}>
            <div style={{ fontSize: 11, color: "#111111", fontWeight: 700 }}>{ticketModal.kind === "ALINDI" ? "ALIM TARTIM FİŞİ" : "TESLİM TARTIM FİŞİ"}</div>
            <h3 style={{ color: "#111111", margin: "8px 0 14px" }}>{ticketModal.lot.id} · EWC {ewcOf(ticketModal.lot.material).code}</h3>
            <label style={labelStyle}>kg</label>
            <input type="number" value={ticketForm.kg} onChange={(e) => setTicketForm({ ...ticketForm, kg: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
            <label style={labelStyle}>Plaka</label>
            <select value={ticketForm.plate} onChange={(e) => setTicketForm({ ...ticketForm, plate: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }}>
              {fleet.map((v) => <option key={v.id} value={v.plate}>{v.plate} · {v.driver}</option>)}
            </select>
            <label style={labelStyle}>İmza adı</label>
            <input value={ticketForm.signer} onChange={(e) => setTicketForm({ ...ticketForm, signer: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
            <label style={labelStyle}>İmza</label>
            <SignaturePad onChange={(signData) => setTicketForm((prev) => ({ ...prev, signData }))} />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button type="submit" style={{ ...btnPrimary, flex: 1 }}>İrsaliye kes</button>
              <button type="button" onClick={() => setTicketModal(null)} style={{ ...linkBtn, flex: 1 }}>Vazgeç</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// --- Kurumsal Stil Bilesenleri ---
const pageHeaderStyle = { margin: 0, fontSize: "20px", fontWeight: "600", color: "#111111", letterSpacing: "-0.3px" };
const sectionBoxStyle = { padding: "20px", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e8e8e8" };
const sectionTitleStyle = { margin: "0 0 16px 0", fontSize: "15px", fontWeight: "600", color: "#111111" };
const labelStyle = { display: "block", fontSize: "11px", color: "#444444", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase" };

const btnNav = (active) => ({
  padding: "9px 12px",
  backgroundColor: active ? "#eef2f8" : "transparent",
  color: active ? "#0B2C5F" : "#444444",
  border: "none",
  borderRadius: "4px",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: active ? "600" : "500",
  fontSize: "13px"
});

const btnPrimary = {
  backgroundColor: "#ffffff",
  color: "#0B2C5F",
  border: "1px solid #0B2C5F",
  borderRadius: "4px",
  padding: "9px 16px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "12px",
  letterSpacing: "0.3px"
};

const linkBtn = {
  ...btnPrimary,
  backgroundColor: "#ffffff",
  fontSize: 11,
  padding: "6px 10px"
};

const inputStyle = {
  backgroundColor: "#ffffff",
  color: "#111111",
  border: "1px solid #d0d0d0",
  borderRadius: "4px",
  padding: "8px 12px",
  width: "100%",
  boxSizing: "border-box",
  fontSize: "13px",
  userSelect: "text",
  WebkitUserSelect: "text",
  pointerEvents: "auto"
};

const Card = ({ title, value }) => (
  <div style={{ padding: "16px 20px", backgroundColor: "#ffffff", borderRadius: "6px", border: "1px solid #e8e8e8" }}>
    <div style={{ color: "#444444", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>{title}</div>
    <div style={{ margin: "8px 0 0 0", color: "#111111", fontSize: "20px", fontWeight: "700" }}>{value}</div>
  </div>
);

const thStyle = { padding: "12px 16px", color: "#444444", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" };
const tdStyle = { padding: "12px 16px", fontSize: "13px", color: "#111111" };
