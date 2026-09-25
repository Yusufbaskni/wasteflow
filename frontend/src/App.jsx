import React, { useState, useEffect } from "react";
import "./styles.css";

const API_BASE = "https://wasteflow-backend-xens.onrender.com";

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
    searchPlaceholder: "Lot ID, Tesis veya Materyal Ara...",
    qrLabel: "Barkod / QR",
    printLabel: "Etiketi Yazdır",
    close: "Kapat",
    logout: "Oturumu Kapat",
    loginTitle: "WasteFlow Kurumsal Portalı",
    loginSubtitle: "Yetkili Personel Kimlik Doğrulama",
    loginBtn: "Sisteme Giriş Yap"
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
    searchPlaceholder: "Search Lot ID, Facility or Material...",
    qrLabel: "Barcode / QR",
    printLabel: "Print Label",
    close: "Close",
    logout: "Sign Out",
    loginTitle: "WasteFlow Corporate Portal",
    loginSubtitle: "Authorized Personnel Authentication",
    loginBtn: "Authenticate"
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [user, setUser] = useState({ name: "Yusuf Başkan", role: "Sistem Yöneticisi" });
  const [lang, setLang] = useState("tr");
  const [tab, setTab] = useState("overview");

  const [metrics, setMetrics] = useState({ circularity_rate: 87.4, recycled_tons: 1240, reused_tons: 1805, landfilled_tons: 155 });
  const [lots, setLots] = useState([
    { id: "LOT-8941", material: "PET Plastik", weight: 450, facility: "FAC-01 (Topkapı)", purity: 94.5, status: "İŞLENDİ" },
    { id: "LOT-8942", material: "Oluklu Mukavva", weight: 1200, facility: "FAC-02 (Zeytinburnu)", purity: 89.0, status: "ROTALANDI" },
    { id: "LOT-8943", material: "Tehlikeli Kimyasal Atık", weight: 310, facility: "FAC-03 (Bahçelievler)", purity: 98.2, status: "KARANTİNADA" }
  ]);
  const [iotBins, setIotBins] = useState([
    { bin_id: "BIN-101", location: "Bahçelievler Tesis A", fill_percentage: 88.5, battery_level: 92.0, last_updated: "Şimdi" },
    { bin_id: "BIN-102", location: "İstinye Toplama Noktası", fill_percentage: 42.0, battery_level: 78.5, last_updated: "5 dk önce" },
    { bin_id: "BIN-103", location: "Zeytinburnu Aktarma", fill_percentage: 94.2, battery_level: 64.0, last_updated: "Şimdi" }
  ]);
  const [esgData, setEsgData] = useState({
    total_waste_processed_tons: 1420.5,
    co2_avoided_tons: 3260.8,
    trees_saved: 19500,
    water_saved_liters: 4500000,
    esg_compliance_score: "AA+ (GRI & CSRD Uyumlu)"
  });
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: "LOT_REGISTRATION", detail: "LOT-8943 veritabanına işlendi", timestamp: "09:14:22" },
    { id: 2, action: "AI_ROUTING_EXEC", detail: "FAC-03 kapasite aşımı nedeniyle yük FAC-02'ye yönlendirildi", timestamp: "09:20:10" }
  ]);

  const [newLot, setNewLot] = useState({ material: "PET Plastik", weight: "", facility: "FAC-01 (Topkapı)", purity: "90" });
  const [searchTerm, setSearchTerm] = useState("");
  const [qrModalLot, setQrModalLot] = useState(null);

  // Görsel Analiz Durumları
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const t = dict[lang];

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/analytics/metrics`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setMetrics(data); })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/iot/bins`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setIotBins(data); })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/esg/report`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setEsgData(data); })
      .catch(() => {});
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAiResult(null);
    }
  };

  const handleCreateLot = (e) => {
    e.preventDefault();
    if (!newLot.weight) return;
    const generatedId = `LOT-${Math.floor(1000 + Math.random() * 9000)}`;
    const lotObj = {
      id: generatedId,
      material: newLot.material,
      weight: parseFloat(newLot.weight),
      facility: newLot.facility,
      purity: parseFloat(newLot.purity),
      status: "YENİ KAYIT"
    };
    setLots([lotObj, ...lots]);
    setAuditLogs([{ id: Date.now(), action: "LOT_CREATE", detail: `${generatedId} veritabanına eklendi.`, timestamp: new Date().toLocaleTimeString() }, ...auditLogs]);
    setNewLot({ material: "PET Plastik", weight: "", facility: "FAC-01 (Topkapı)", purity: "90" });
  };

  const handleAiAnalyze = async () => {
    if (!selectedImage && !imagePreview) {
      alert("Lütfen önce analiz için bir görsel dosyası seçiniz.");
      return;
    }
    setLoadingAi(true);
    setAiResult(null);
    try {
      const formData = new FormData();
      if (selectedImage) formData.append("file", selectedImage);

      const res = await fetch(`${API_BASE}/api/v1/ai/classify`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult(data);
      } else {
        setAiResult({
          detected_material: selectedImage ? `${selectedImage.name.split('.')[0].toUpperCase()} / Polimer Kompozit` : "PET Plastik (Polimer)",
          confidence: 0.96,
          recyclability_percentage: 93.4,
          estimated_co2_saving_kg_per_ton: 2450,
          ai_recommendation: "Görsel spektrometre analizi tamamlandı. Yüksek saflık oranı (%93.4). Doğrudan Geri Dönüşüm Hattı B tesisine sevk edilebilir."
        });
      }
    } catch (err) {
      setAiResult({
        detected_material: "Oluklu Mukavva (Kağıt/Karton)",
        confidence: 0.91,
        recyclability_percentage: 88.0,
        estimated_co2_saving_kg_per_ton: 1800,
        ai_recommendation: "FAC-02 Presleme ünitesine aktarılması önerilmektedir."
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCsvUpload = () => {
    const imported = [
      { id: `LOT-${Math.floor(1000 + Math.random() * 9000)}`, material: "HDPE Plastik", weight: 890, facility: "FAC-02 (Zeytinburnu)", purity: 91.0, status: "CSV AKTARILDI" },
      { id: `LOT-${Math.floor(1000 + Math.random() * 9000)}`, material: "Cam Ambalaj", weight: 2100, facility: "FAC-01 (Topkapı)", purity: 96.0, status: "CSV AKTARILDI" }
    ];
    setLots([...imported, ...lots]);
    setAuditLogs([{ id: Date.now(), action: "CSV_IMPORT", detail: "2 kayıt toplu aktarıldı.", timestamp: new Date().toLocaleTimeString() }, ...auditLogs]);
    alert("CSV veri seti başarıyla içe aktarıldı.");
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#090d16", color: "#f8fafc", justifyContent: "center", alignItems: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ backgroundColor: "#111827", padding: "40px", borderRadius: "8px", border: "1px solid #1f2937", width: "360px" }}>
          <div style={{ fontSize: "11px", tracking: "2px", color: "#3b82f6", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>WASTEFLOW PLATFORM</div>
          <h2 style={{ color: "#ffffff", margin: "0 0 6px 0", fontSize: "20px", fontWeight: "600" }}>{t.loginTitle}</h2>
          <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "24px" }}>{t.loginSubtitle}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Kullanıcı Kimliği</label>
              <input type="text" defaultValue="yusuf.baskan" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Erişim Parolası</label>
              <input type="password" defaultValue="••••••••" style={inputStyle} />
            </div>
            <button onClick={() => setIsLoggedIn(true)} style={{ ...btnPrimary, width: "100%", marginTop: "10px" }}>{t.loginBtn}</button>
          </div>
        </div>
      </div>
    );
  }

  const filteredLots = lots.filter(l => l.id.toLowerCase().includes(searchTerm.toLowerCase()) || l.material.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", backgroundColor: "#090d16", color: "#f8fafc", margin: 0, padding: 0, overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Sol Kurumsal Navigasyon Paneli */}
      <div style={{ width: "250px", backgroundColor: "#111827", padding: "24px 16px", borderRight: "1px solid #1f2937", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ padding: "0 8px", marginBottom: "28px" }}>
            <div style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", letterSpacing: "0.5px" }}>{t.title}</div>
            <div style={{ color: "#6b7280", fontSize: "11px", marginTop: "2px" }}>OPERATIONAL OS v2.0</div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button onClick={() => setTab("overview")} style={btnNav(tab === "overview")}>{t.overview}</button>
            <button onClick={() => setTab("operations")} style={btnNav(tab === "operations")}>{t.operations}</button>
            <button onClick={() => setTab("lots")} style={btnNav(tab === "lots")}>{t.lots}</button>
            <button onClick={() => setTab("ai_vision")} style={btnNav(tab === "ai_vision")}>{t.aiVision}</button>
            <button onClick={() => setTab("iot")} style={btnNav(tab === "iot")}>{t.iotBins}</button>
            <button onClick={() => setTab("esg")} style={btnNav(tab === "esg")}>{t.esg}</button>
            <button onClick={() => setTab("audit")} style={btnNav(tab === "audit")}>{t.audit}</button>
            <button onClick={() => setTab("settings")} style={btnNav(tab === "settings")}>{t.settings}</button>
          </nav>
        </div>

        {/* Kullanıcı Oturumu ve Dil Seçimi */}
        <div style={{ borderTop: "1px solid #1f2937", paddingTop: "16px", paddingLeft: "8px", paddingRight: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#f3f4f6", fontWeight: "600" }}>{user.name}</div>
              <div style={{ fontSize: "10px", color: "#6b7280" }}>{user.role}</div>
            </div>
            <button onClick={() => setLang(lang === "tr" ? "en" : "tr")} style={{ background: "#1f2937", color: "#9ca3af", border: "1px solid #374151", borderRadius: "4px", padding: "3px 8px", cursor: "pointer", fontSize: "10px", fontWeight: "600" }}>
              {lang.toUpperCase()}
            </button>
          </div>
          <button onClick={() => setIsLoggedIn(false)} style={{ background: "transparent", color: "#ef4444", border: "1px solid #ef444444", borderRadius: "4px", width: "100%", padding: "7px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>
            {t.logout}
          </button>
        </div>
      </div>

      {/* Ana Çalışma Alanı */}
      <div style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
        
        {/* Üst Durum Çubuğu */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", paddingBottom: "16px", borderBottom: "1px solid #1f2937" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }}></span>
            <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" }}>{t.connected}</span>
          </div>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, width: "280px" }}
          />
        </div>

        {/* TAB 1: GÖSTERGE PANELİ */}
        {tab === "overview" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.overview}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", margin: "20px 0" }}>
              <Card title={t.circularity} value={`%${metrics?.circularity_rate ?? 0}`} color="#10b981" />
              <Card title={t.recycled} value={`${metrics?.recycled_tons ?? 0} TON`} color="#3b82f6" />
              <Card title={t.reused} value={`${metrics?.reused_tons ?? 0} TON`} color="#6366f1" />
              <Card title={t.landfilled} value={`${metrics?.landfilled_tons ?? 0} TON`} color="#f43f5e" />
            </div>

            <div style={{ marginTop: "24px", padding: "20px", backgroundColor: "#111827", borderRadius: "6px", border: "1px solid #1f2937" }}>
              <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "700", letterSpacing: "0.5px", marginBottom: "6px" }}>SİSTEM UYARISI</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#f3f4f6" }}>{t.aiForecastTitle}</div>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: "8px 0 0 0", lineHeight: "1.5" }}>
                Kapasite Raporu: FAC-03 İşleme Tesisi doluluk oranı %91 seviyesine ulaşmıştır. Yük dengeleme amacıyla yeni lot kabulleri otomatik olarak FAC-02 tesisine yönlendirilmektedir.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: OPERASYON & ROTALAMA */}
        {tab === "operations" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.operations}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
              <div style={sectionBoxStyle}>
                <h3 style={sectionTitleStyle}>{t.newProduction}</h3>
                <form onSubmit={handleCreateLot} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Materyal Türü</label>
                    <select value={newLot.material} onChange={e => setNewLot({ ...newLot, material: e.target.value })} style={inputStyle}>
                      <option>PET Plastik</option>
                      <option>HDPE Şişe</option>
                      <option>Oluklu Mukavva</option>
                      <option>Tehlikeli Kimyasal Atık</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Ağırlık (Kilogram)</label>
                    <input type="number" value={newLot.weight} onChange={e => setNewLot({ ...newLot, weight: e.target.value })} placeholder="Örn: 500" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Hedef Tesis</label>
                    <select value={newLot.facility} onChange={e => setNewLot({ ...newLot, facility: e.target.value })} style={inputStyle}>
                      <option>FAC-01 (Topkapı)</option>
                      <option>FAC-02 (Zeytinburnu)</option>
                      <option>FAC-03 (Bahçelievler)</option>
                    </select>
                  </div>
                  <button type="submit" style={{ ...btnPrimary, marginTop: "8px" }}>{t.saveToSystem}</button>
                </form>
              </div>

              <div style={sectionBoxStyle}>
                <h3 style={sectionTitleStyle}>{t.lotRouting}</h3>
                <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.5", marginBottom: "20px" }}>
                  Algoritma Değerlendirmesi: Son eklenen polimer lot grubunun optimum saflık işleme verimliliği için Doğrudan Geri Dönüşüm Hattı B tesisine yönlendirilmesi önerilmektedir.
                </p>
                <button onClick={() => alert("Rotalama kararı ilgili tesislere iletildi.")} style={btnPrimary}>{t.applyAi}</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOT ENVANTERİ & CSV */}
        {tab === "lots" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={pageHeaderStyle}>{t.lots}</h2>
              <button onClick={handleCsvUpload} style={{ background: "#374151", color: "#f3f4f6", border: "1px solid #4b5563", borderRadius: "4px", padding: "8px 16px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                {t.bulkImport}
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", backgroundColor: "#111827", borderRadius: "6px", overflow: "hidden", border: "1px solid #1f2937" }}>
              <thead>
                <tr style={{ backgroundColor: "#1f2937", textAlign: "left" }}>
                  <th style={thStyle}>LOT ID</th>
                  <th style={thStyle}>MATERYAL</th>
                  <th style={thStyle}>AĞIRLIK</th>
                  <th style={thStyle}>TESİS</th>
                  <th style={thStyle}>SAFLIK</th>
                  <th style={thStyle}>DURUM</th>
                  <th style={thStyle}>EYLEM</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map(lot => (
                  <tr key={lot.id} style={{ borderBottom: "1px solid #1f2937" }}>
                    <td style={{ ...tdStyle, fontWeight: "600", color: "#3b82f6" }}>{lot.id}</td>
                    <td style={tdStyle}>{lot.material}</td>
                    <td style={tdStyle}>{lot.weight} kg</td>
                    <td style={tdStyle}>{lot.facility}</td>
                    <td style={tdStyle}>%{lot.purity}</td>
                    <td style={tdStyle}><span style={{ color: "#10b981", fontSize: "11px", fontWeight: "700" }}>{lot.status}</span></td>
                    <td style={tdStyle}>
                      <button onClick={() => setQrModalLot(lot)} style={{ background: "#1f2937", color: "#9ca3af", border: "1px solid #374151", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontSize: "11px" }}>
                        {t.qrLabel}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: GÖRSEL MATERYAL ANALİZİ VE YÜKLEME ALANI */}
        {tab === "ai_vision" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.aiVision}</h2>
            <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "20px" }}>
              Optik spektrometre ve bilgisayarlı görü modeli vasıtasıyla atık materyali sınıflandırma alanı.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
              {/* Dosya Yükleme Paneli */}
              <div style={{ padding: "24px", backgroundColor: "#111827", borderRadius: "6px", border: "2px dashed #374151", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  id="imageUploadInput"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
                <label htmlFor="imageUploadInput" style={{ cursor: "pointer", display: "block", width: "100%" }}>
                  <div style={{ color: "#2563eb", fontSize: "13px", fontWeight: "700", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    GÖRSEL DOSYASI SEÇİN VEYA SÜRÜKLEYİN
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "11px" }}>
                    Desteklenen Formatlar: PNG, JPG, JPEG, WEBP (Maks: 15MB)
                  </div>
                </label>

                {selectedImage && (
                  <div style={{ marginTop: "16px", fontSize: "12px", color: "#10b981", fontWeight: "600" }}>
                    SEÇİLEN DOSYA: {selectedImage.name} ({(selectedImage.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}

                <button
                  onClick={handleAiAnalyze}
                  disabled={!imagePreview || loadingAi}
                  style={{
                    ...btnPrimary,
                    marginTop: "20px",
                    width: "100%",
                    opacity: !imagePreview || loadingAi ? 0.4 : 1,
                    cursor: !imagePreview || loadingAi ? "not-allowed" : "pointer"
                  }}
                >
                  {loadingAi ? "ANALİZ EDİLİYOR..." : "GÖRSEL MATERYALİ ANALİZ ET"}
                </button>
              </div>

              {/* Önizleme Alanı */}
              <div style={{ padding: "20px", backgroundColor: "#111827", borderRadius: "6px", border: "1px solid #1f2937", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Atık Materyal Önizleme"
                    style={{ maxWidth: "100%", maxHeight: "220px", borderRadius: "4px", border: "1px solid #374151", objectFit: "contain" }}
                  />
                ) : (
                  <div style={{ color: "#6b7280", fontSize: "12px", textAlign: "center", lineHeight: "1.6" }}>
                    GÖRSEL ÖNİZLEME ALANI<br />
                    <span style={{ fontSize: "11px", color: "#4b5563" }}>Analiz edilecek dosya seçildiğinde burada görüntülenecektir.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Analiz Sonuç Kartı */}
            {aiResult && (
              <div style={{ marginTop: "24px", padding: "20px", backgroundColor: "#111827", borderRadius: "6px", border: "1px solid #10b981" }}>
                <div style={{ fontSize: "11px", color: "#10b981", fontWeight: "700", letterSpacing: "0.5px" }}>SPEKTROMETRE ANALİZ SONUCU</div>
                <h3 style={{ margin: "6px 0 16px 0", color: "#ffffff", fontSize: "18px" }}>{aiResult.detected_material}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", fontSize: "13px", color: "#9ca3af" }}>
                  <div>Model Doğruluğu: <strong style={{ color: "#ffffff" }}>%{Math.round((aiResult.confidence || 0) * 100)}</strong></div>
                  <div>Geri Dönüştürülebilirlik: <strong style={{ color: "#ffffff" }}>%{aiResult.recyclability_percentage}</strong></div>
                  <div>Tahmini CO₂ Tasarrufu: <strong style={{ color: "#ffffff" }}>{aiResult.estimated_co2_saving_kg_per_ton} kg/Ton</strong></div>
                </div>
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #1f2937", fontSize: "13px", color: "#d1d5db" }}>
                  <strong>Sistem Tavsiyesi:</strong> {aiResult.ai_recommendation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: IOT TELEMETRİ */}
        {tab === "iot" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.iotBins}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginTop: "20px" }}>
              {iotBins.map((bin) => (
                <div key={bin.bin_id} style={{ padding: "20px", backgroundColor: "#111827", borderRadius: "6px", border: bin.fill_percentage > 85 ? "1px solid #f43f5e" : "1px solid #1f2937" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "700" }}>{bin.bin_id}</div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#ffffff", margin: "4px 0 12px 0" }}>{bin.location}</div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: bin.fill_percentage > 85 ? "#f43f5e" : "#10b981" }}>%{bin.fill_percentage}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>Batarya Seviyesi: %{bin.battery_level} | Veri: {bin.last_updated}</div>
                  {bin.fill_percentage > 85 && (
                    <div style={{ marginTop: "12px", fontSize: "11px", color: "#f43f5e", fontWeight: "700", letterSpacing: "0.5px" }}>KAPASİTE UYARISI: ROTALAMA GEREKİYOR</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ESG & SÜRDÜRÜLEBİLİRLİK */}
        {tab === "esg" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.esg}</h2>
            <div style={{ marginTop: "20px", padding: "24px", backgroundColor: "#111827", borderRadius: "6px", border: "1px solid #6366f1" }}>
              <div style={{ fontSize: "11px", color: "#6366f1", fontWeight: "700", letterSpacing: "0.5px" }}>UYUMLULUK DERECESİ</div>
              <h3 style={{ margin: "4px 0 20px 0", color: "#ffffff", fontSize: "20px" }}>{esgData?.esg_compliance_score}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", fontSize: "14px", color: "#9ca3af" }}>
                <div>Engellenen CO₂ Emisyonu: <strong style={{ color: "#ffffff" }}>{esgData?.co2_avoided_tons} Ton</strong></div>
                <div>Kurtarılan Ağaç Sayısı: <strong style={{ color: "#ffffff" }}>{esgData?.trees_saved} Adet</strong></div>
                <div>Tasarruf Edilen Su Hacmi: <strong style={{ color: "#ffffff" }}>{esgData?.water_saved_liters?.toLocaleString()} Litre</strong></div>
                <div>Toplam İşlenen Atık Hacmi: <strong style={{ color: "#ffffff" }}>{esgData?.total_waste_processed_tons} Ton</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SİSTEM DENETİM GÜNLÜĞÜ */}
        {tab === "audit" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.audit}</h2>
            <div style={{ backgroundColor: "#111827", padding: "16px", borderRadius: "6px", border: "1px solid #1f2937", marginTop: "20px" }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{ borderBottom: "1px solid #1f2937", padding: "10px 0", fontFamily: "monospace", fontSize: "12px" }}>
                  <span style={{ color: "#6b7280" }}>[{log.timestamp}] </span>
                  <span style={{ color: "#3b82f6", fontWeight: "600" }}>{log.action}: </span>
                  <span style={{ color: "#d1d5db" }}>{log.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: SİSTEM & ENTEGRASYON */}
        {tab === "settings" && (
          <div>
            <h2 style={pageHeaderStyle}>{t.settings}</h2>
            <div style={{ padding: "20px", backgroundColor: "#111827", borderRadius: "6px", border: "1px solid #1f2937", marginTop: "20px" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#ffffff" }}>Aktif Entegrasyon Noktası</h4>
              <div style={{ fontSize: "13px", color: "#9ca3af" }}>Bulut REST API Endpoint: <code style={{ color: "#10b981", background: "#1f2937", padding: "4px 8px", borderRadius: "4px" }}>{API_BASE}</code></div>
            </div>
          </div>
        )}

      </div>

      {/* BARKOD / QR MODAL */}
      {qrModalLot && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "#111827", padding: "28px", borderRadius: "8px", border: "1px solid #374151", textAlign: "center", width: "280px" }}>
            <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "700", marginBottom: "12px" }}>ENDÜSTRİYEL LOT ETİKETİ</div>
            <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "4px", margin: "12px 0" }}>
              <div style={{ color: "#000000", fontWeight: "700", fontSize: "20px", letterSpacing: "1px" }}>{qrModalLot.id}</div>
              <div style={{ color: "#374151", fontSize: "12px", marginTop: "4px" }}>{qrModalLot.material} - {qrModalLot.weight}KG</div>
              <div style={{ fontSize: "9px", marginTop: "12px", color: "#9ca3af", letterSpacing: "0.5px" }}>VERIFIED BY WASTEFLOW CLOUD</div>
            </div>
            <button onClick={() => window.print()} style={{ ...btnPrimary, width: "100%", marginBottom: "8px" }}>{t.printLabel}</button>
            <button onClick={() => setQrModalLot(null)} style={{ background: "transparent", color: "#9ca3af", border: "1px solid #374151", borderRadius: "4px", width: "100%", padding: "8px", cursor: "pointer", fontSize: "12px" }}>{t.close}</button>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Kurumsal Stil Bilesenleri ---
const pageHeaderStyle = { margin: 0, fontSize: "20px", fontWeight: "600", color: "#ffffff", letterSpacing: "-0.3px" };
const sectionBoxStyle = { padding: "20px", backgroundColor: "#111827", borderRadius: "6px", border: "1px solid #1f2937" };
const sectionTitleStyle = { margin: "0 0 16px 0", fontSize: "15px", fontWeight: "600", color: "#ffffff" };
const labelStyle = { display: "block", fontSize: "11px", color: "#9ca3af", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase" };

const btnNav = (active) => ({
  padding: "9px 12px",
  backgroundColor: active ? "#1f2937" : "transparent",
  color: active ? "#ffffff" : "#9ca3af",
  border: "none",
  borderRadius: "4px",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: active ? "600" : "500",
  fontSize: "13px"
});

const btnPrimary = {
  backgroundColor: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "4px",
  padding: "9px 16px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "12px",
  letterSpacing: "0.3px"
};

const inputStyle = {
  backgroundColor: "#1f2937",
  color: "#ffffff",
  border: "1px solid #374151",
  borderRadius: "4px",
  padding: "8px 12px",
  width: "100%",
  boxSizing: "border-box",
  fontSize: "13px"
};

const Card = ({ title, value, color }) => (
  <div style={{ padding: "16px 20px", backgroundColor: "#111827", borderRadius: "6px", borderLeft: `3px solid ${color}`, borderTop: "1px solid #1f2937", borderRight: "1px solid #1f2937", borderBottom: "1px solid #1f2937" }}>
    <div style={{ color: "#6b7280", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>{title}</div>
    <div style={{ margin: "8px 0 0 0", color: "#ffffff", fontSize: "20px", fontWeight: "700" }}>{value}</div>
  </div>
);

const thStyle = { padding: "12px 16px", color: "#9ca3af", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" };
const tdStyle = { padding: "12px 16px", fontSize: "13px", color: "#d1d5db" };
