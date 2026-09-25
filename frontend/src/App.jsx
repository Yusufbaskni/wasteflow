import "./styles.css";
import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Buluta taşındığında bu URL kolayca "https://api.wasteflow.com" olarak değiştirilir
const API_BASE = "http://127.0.0.1:8000";

const dict = {
  tr: {
    overview: "Genel Özet",
    operations: "İşlemler & Rotalama",
    lots: "Lot Envanteri",
    audit: "Denetim İzi (Audit Log)",
    settings: "Sistem & API Ayarları",
    downloadCsv: "CSV Raporu İndir",
    connected: "FastAPI Bağlı",
    circularity: "Döngüsellik Oranı",
    recycled: "Geri Dönüştürülen",
    reused: "Yeniden Kullanılan",
    landfilled: "Depolanan Atık",
    co2Savings: "CO₂ Tasarrufu (ESG)",
    aiForecastTitle: "AI Kestirimci Atık Tahmini & Tesis Doluluk Riskleri",
    newProduction: "Yeni Üretim Kaydı",
    lotRouting: "Lot Rotalama & AI Öneri Motoru",
    bulkImport: "Toplu Atık Kaydı Yükleme (Bulk Import)",
    saveToSystem: "Sisteme Kaydet",
    confirmRoute: "Rotalamayı Onayla",
    applyAi: "Öneriyi Uygula",
    searchPlaceholder: "Lot, Tesis veya Atık Ara...",
    qrLabel: "QR Etiket",
    printLabel: "Etiketi Yazdır",
    close: "Kapat",
    apiKeyTitle: "Aktif ERP ve Entegrasyon API Anahtarları",
    thresholdAlert: "UYARI: FAC-03 Tesis Kapasitesi %91 Seviyesinde! AI Rotalama Engin'i Yükü FAC-02'ye Yönlendiriyor.",
    logout: "Çıkış Yap"
  },
  en: {
    overview: "Overview",
    operations: "Operations & Routing",
    lots: "Lot Inventory",
    audit: "Audit Log",
    settings: "Settings & API Keys",
    downloadCsv: "Download CSV Report",
    connected: "FastAPI Connected",
    circularity: "Circularity Rate",
    recycled: "Recycled",
    reused: "Reused",
    landfilled: "Landfilled Waste",
    co2Savings: "CO₂ Savings (ESG)",
    aiForecastTitle: "AI Predictive Waste Forecast & Capacity Risks",
    newProduction: "New Production Event",
    lotRouting: "Lot Routing & AI Engine",
    bulkImport: "Bulk Waste Data Import",
    saveToSystem: "Save to System",
    confirmRoute: "Confirm Routing",
    applyAi: "Apply Recommendation",
    searchPlaceholder: "Search Lot, Facility or Waste...",
    qrLabel: "QR Label",
    printLabel: "Print Label",
    close: "Close",
    apiKeyTitle: "Active ERP & Integration API Keys",
    thresholdAlert: "WARNING: FAC-03 Facility Capacity at 91%! AI Engine is Routing Loads to FAC-02.",
    logout: "Log Out"
  }
};

const defaultMetrics = {
  circularity_rate: 60.23,
  recycled_tons: 34604,
  reused_tons: 9628,
  landfilled_tons: 9590
};

const monthlyTrendData = [
  { month: "Ocak", geridonusum: 2400, bertaraf: 800 },
  { month: "Şubat", geridonusum: 2800, bertaraf: 750 },
  { month: "Mart", geridonusum: 3200, bertaraf: 700 },
  { month: "Nisan", geridonusum: 3100, bertaraf: 650 },
  { month: "Mayıs", geridonusum: 3600, bertaraf: 600 },
  { month: "Haziran", geridonusum: 4100, bertaraf: 500 },
];

const facilityData = [
  { facility: "FAC-01", tons: 1240 },
  { facility: "FAC-02", tons: 980 },
  { facility: "FAC-03", tons: 1560 },
  { facility: "FAC-04", tons: 720 },
];

const aiForecastData = [
  { facility: "FAC-01", current: 1240, predicted: 1380, risk: "low", capacity: "%68" },
  { facility: "FAC-02", current: 980, predicted: 1050, risk: "low", capacity: "%52" },
  { facility: "FAC-03", current: 1560, predicted: 1890, risk: "high", capacity: "%91" },
  { facility: "FAC-04", current: 720, predicted: 810, risk: "medium", capacity: "%79" },
];

export default function App() {
  // Kullanıcı Oturum State'i
  const [user, setUser] = useState(() => localStorage.getItem("wf_user_email") || null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [lang, setLang] = useState("tr");
  const t = dict[lang];

  const [metrics, setMetrics] = useState(defaultMetrics);
  const [lots, setLots] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const [auditLogs, setAuditLogs] = useState([
    { timestamp: "2026-09-25 08:45:12", user: "operasyon_uzmani", action: "LOT_ROUTED", target: "LOT-001 -> FAC-02", status: "SUCCESS" },
    { timestamp: "2026-09-25 08:30:00", user: "system_cron", action: "METRICS_RECALCULATED", target: "System wide", status: "SUCCESS" },
    { timestamp: "2026-09-25 08:12:44", user: "erp_webhook", action: "LOT_CREATED", target: "LOT-F-IST-01", status: "SUCCESS" },
  ]);

  const [showApiKey, setShowApiKey] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQrLot, setSelectedQrLot] = useState(null);

  const [newLot, setNewLot] = useState({
    facility_code: "FAC-01",
    line_code: "L1-HAD",
    waste_code: "MET-FE",
    output_tons: 100,
    waste_tons: 8.5,
    erp_work_order: "WO-2026-01"
  });

  const [routeData, setRouteData] = useState({
    lot_code: "",
    destination_code: "FAC-02",
    notes: "Arayüzden manuel yönlendirildi"
  });

  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail.trim()) {
      localStorage.setItem("wf_user_email", loginEmail);
      setUser(loginEmail);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("wf_user_email");
    setUser(null);
  };

  const sendNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") new Notification(title, { body });
      });
    }
  };

  const fetchData = async () => {
    try {
      const resMetrics = await fetch(`${API_BASE}/api/v1/analytics/metrics`);
      if (resMetrics.ok) {
        const data = await resMetrics.json();
        if (data && Object.keys(data).length > 0) setMetrics(data);
      }

      const resLots = await fetch(`${API_BASE}/api/v1/lots`);
      if (resLots.ok) setLots(await resLots.json());
    } catch (err) {
      console.error("API Bağlantı Hatası:", err);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleLotCodeChange = (code) => {
    setRouteData({ ...routeData, lot_code: code });
    if (code.trim().length >= 3) {
      setAiRecommendation({
        suggestedFacility: "FAC-02",
        confidence: "%94",
        reason: "Tesis kapasitesi elverişli (%52 doluluk) ve en düşük lojistik CO₂ salınımı (1.1 t/ton) ile maksimum döngüsellik sağlıyor."
      });
    } else {
      setAiRecommendation(null);
    }
  };

  const applyAiRecommendation = () => {
    if (aiRecommendation) {
      setRouteData({
        ...routeData,
        destination_code: aiRecommendation.suggestedFacility,
        notes: `AI Otomatik Rotalama Engine (%94 Skor)`
      });
    }
  };

  const addAuditLog = (action, target) => {
    const newLog = {
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: user || "yonetici_user",
      action,
      target,
      status: "SUCCESS"
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const handleCreateLot = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/erp/production-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": "demo-erp-key" },
        body: JSON.stringify(newLot)
      });
      if (res.ok) {
        setStatusMsg({ type: "success", text: "Yeni üretim kaydı sisteme işlendi." });
        addAuditLog("PRODUCTION_EVENT_CREATED", `${newLot.facility_code} - ${newLot.waste_code}`);
        sendNotification("WasteFlow", "Yeni atık üretimi kaydedildi.");
        fetchData();
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "Bağlantı hatası oluştu." });
    }
  };

  const handleRouteLot = async (e) => {
    e.preventDefault();
    if (!routeData.lot_code) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/lots/${routeData.lot_code.trim()}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_code: routeData.destination_code,
          notes: routeData.notes
        })
      });
      if (res.ok) {
        setStatusMsg({ type: "success", text: `${routeData.lot_code} lotu başarıyla rotalandı.` });
        addAuditLog("LOT_ROUTED", `${routeData.lot_code} -> ${routeData.destination_code}`);
        sendNotification("WasteFlow Rotalama", `${routeData.lot_code} -> ${routeData.destination_code} tesisine yönlendirildi.`);
        fetchData();
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "Rotalama hatası." });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStatusMsg({ type: "success", text: `"${file.name}" başarıyla ayrıştırıldı. Toplu atık verileri sisteme işleniyor...` });
      addAuditLog("BULK_CSV_IMPORTED", file.name);
      setTimeout(() => fetchData(), 1000);
    }
  };

  const exportToCSV = () => {
    if (!lots || lots.length === 0) return alert("İndirilecek envanter kaydı bulunamadı.");
    const headers = ["Lot Kodu", "Tesis Kodu", "Atik Kodu", "Miktar (Ton)", "Durum"];
    const rows = lots.map(l => [l.lot_code, l.facility_code, l.waste_code, l.quantity_tons, l.status]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wasteflow_envanter_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLots = lots.filter(lot => {
    const matchesSearch =
      lot.lot_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.facility_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.waste_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayMetrics = metrics || defaultMetrics;

  // Oturum Açılmadıysa Giriş Ekranını Göster
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">WF</div>
            <h2 style={{ fontSize: "18px", fontWeight: 600 }}>WasteFlow Enterprise</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Döngüsel Ekonomi Operasyon Platformu</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="form-group">
              <label>Kurumsal E-posta</label>
              <input
                type="email"
                required
                placeholder="ornek@sirket.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Şifre</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: "10px", marginTop: "8px" }}>
              Giriş Yap
            </button>
          </form>

          <div style={{ fontSize: "11px", color: "var(--text-dim)", textAlign: "center", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
            Demo Oturumu: Herhangi bir e-posta ve şifre yazarak giriş yapabilirsiniz.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">WF</div>
          <span className="brand-title">WasteFlow</span>
        </div>

        <ul className="nav-list">
          <li className={`nav-item ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
            {t.overview}
          </li>
          <li className={`nav-item ${activeTab === "operations" ? "active" : ""}`} onClick={() => setActiveTab("operations")}>
            {t.operations}
          </li>
          <li className={`nav-item ${activeTab === "lots" ? "active" : ""}`} onClick={() => setActiveTab("lots")}>
            {t.lots}
          </li>
          <li className={`nav-item ${activeTab === "audit" ? "active" : ""}`} onClick={() => setActiveTab("audit")}>
            {t.audit}
          </li>
          <li className={`nav-item ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
            {t.settings}
          </li>
        </ul>

        <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis" }}>
            👤 {user}
          </div>
          <button className="btn-secondary btn-sm" onClick={handleLogout} style={{ width: "100%" }}>
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-area">
        <header className="top-header">
          <div className="header-breadcrumb">
            <span>Uygulama</span> / <span className="current">{activeTab}</span>
          </div>
          <div className="header-actions">
            <select
              className="select-input"
              value={lang}
              onChange={e => setLang(e.target.value)}
              style={{ padding: "3px 8px" }}
            >
              <option value="tr">TR (Türkçe)</option>
              <option value="en">EN (English)</option>
            </select>

            <button className="btn-secondary" onClick={exportToCSV}>{t.downloadCsv}</button>
            <div className="status-badge">
              <div className="status-dot"></div>
              <span>{t.connected}</span>
            </div>
          </div>
        </header>

        <div className="content-body">
          {statusMsg && (
            <div className={`alert-banner ${statusMsg.type}`}>
              <span>{statusMsg.text}</span>
              <button className="btn-secondary btn-sm" onClick={() => setStatusMsg(null)}>✕</button>
            </div>
          )}

          {activeTab === "overview" && (
            <>
              <div className="alert-banner warning">
                <span>⚠️ {t.thresholdAlert}</span>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">{t.circularity}</span>
                  <span className="kpi-value">%{displayMetrics.circularity_rate?.toFixed(1)}</span>
                  <span className="kpi-sub">Hedef: %65.0</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{t.recycled}</span>
                  <span className="kpi-value">{displayMetrics.recycled_tons?.toLocaleString()} t</span>
                  <span className="kpi-sub">Son 30 Gün</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{t.reused}</span>
                  <span className="kpi-value">{displayMetrics.reused_tons?.toLocaleString()} t</span>
                  <span className="kpi-sub">Doğrudan Transfer</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{t.landfilled}</span>
                  <span className="kpi-value">{displayMetrics.landfilled_tons?.toLocaleString()} t</span>
                  <span className="kpi-sub">Bertaraf Edilen</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{t.co2Savings}</span>
                  <span className="kpi-value">{(displayMetrics.recycled_tons * 1.85).toFixed(0)} t</span>
                  <span className="kpi-sub">Önlenen Emisyon</span>
                </div>
              </div>

              <div className="chart-grid">
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">Atık Oluşum & Geri Dönüşüm Trendi (Aylık)</span>
                  </div>
                  <div className="panel-body" style={{ height: "220px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                        <YAxis stroke="#71717a" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#121215", borderColor: "#27272a", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="geridonusum" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Geri Dönüştürülen (Ton)" />
                        <Area type="monotone" dataKey="bertaraf" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Bertaraf (Ton)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">Tesis Bazlı Atık Yükü</span>
                  </div>
                  <div className="panel-body" style={{ height: "220px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={facilityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="facility" stroke="#71717a" fontSize={11} />
                        <YAxis stroke="#71717a" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#121215", borderColor: "#27272a", fontSize: "12px" }} />
                        <Bar dataKey="tons" fill="#10b981" borderRadius={[4, 4, 0, 0]} name="Atık Miktarı (Ton)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">{t.aiForecastTitle}</span>
                </div>
                <div className="panel-body" style={{ padding: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Tesis Kodu</th>
                        <th>Mevcut Yük</th>
                        <th>Tahmini Yük</th>
                        <th>Kapasite</th>
                        <th>Risk Durumu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiForecastData.map((item, idx) => (
                        <tr key={idx}>
                          <td><span className="code-tag">{item.facility}</span></td>
                          <td>{item.current} t</td>
                          <td><strong>{item.predicted} t</strong> (+{(((item.predicted - item.current) / item.current) * 100).toFixed(1)}%)</td>
                          <td>{item.capacity}</td>
                          <td>
                            <span className={`risk-tag ${item.risk}`}>
                              {item.risk === "low" ? "Düşük Risk" : item.risk === "medium" ? "Orta Risk" : "Yüksek Risk"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "operations" && (
            <>
              <div className="form-grid">
                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">{t.newProduction}</span>
                  </div>
                  <div className="panel-body">
                    <form onSubmit={handleCreateLot}>
                      <div className="form-group">
                        <label>Tesis Kodu</label>
                        <input value={newLot.facility_code} onChange={e => setNewLot({...newLot, facility_code: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Atık Kodu</label>
                        <input value={newLot.waste_code} onChange={e => setNewLot({...newLot, waste_code: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Atık Miktarı (Ton)</label>
                        <input type="number" value={newLot.waste_tons} onChange={e => setNewLot({...newLot, waste_tons: Number(e.target.value)})} />
                      </div>
                      <button type="submit" className="btn-primary" style={{ marginTop: "8px", width: "100%" }}>{t.saveToSystem}</button>
                    </form>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <span className="panel-title">{t.lotRouting}</span>
                  </div>
                  <div className="panel-body">
                    <form onSubmit={handleRouteLot}>
                      <div className="form-group">
                        <label>Hedef Lot Kodu</label>
                        <input
                          placeholder="Örn: LOT-001"
                          value={routeData.lot_code}
                          onChange={e => handleLotCodeChange(e.target.value)}
                        />
                      </div>

                      {aiRecommendation && (
                        <div className="ai-recommend-box">
                          <div className="ai-header">
                            <span>AI Rotalama Önerisi</span>
                            <span>Skor: {aiRecommendation.confidence}</span>
                          </div>
                          <div className="ai-desc">
                            Önerilen Hedef: <strong>{aiRecommendation.suggestedFacility}</strong><br />
                            {aiRecommendation.reason}
                          </div>
                          <button type="button" className="ai-action-btn" onClick={applyAiRecommendation}>
                            {t.applyAi} ({aiRecommendation.suggestedFacility})
                          </button>
                        </div>
                      )}

                      <div className="form-group" style={{ marginTop: "12px" }}>
                        <label>Hedef Tesis Kodu</label>
                        <input value={routeData.destination_code} onChange={e => setRouteData({...routeData, destination_code: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Notlar</label>
                        <input value={routeData.notes} onChange={e => setRouteData({...routeData, notes: e.target.value})} />
                      </div>
                      <button type="submit" className="btn-primary" style={{ marginTop: "8px", width: "100%" }}>{t.confirmRoute}</button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">{t.bulkImport}</span>
                </div>
                <div className="panel-body">
                  <label className="dropzone">
                    <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileUpload} />
                    <span style={{ fontWeight: 600, color: "var(--text-main)" }}>Toplu Veri Dosyasını Seçin veya Sürükleyin</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Desteklenen Formatlar: .CSV, .XLSX</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {activeTab === "lots" && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Tüm Lot Envanteri ({filteredLots.length})</span>
                <div className="toolbar-grid">
                  <input
                    className="search-input"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <select
                    className="select-input"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="in_transit">Transitte (in_transit)</option>
                    <option value="classified">Sınıflandırılmış (classified)</option>
                    <option value="closed">Kapanmış (closed)</option>
                  </select>
                </div>
              </div>

              <div className="panel-body" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Lot Kodu</th>
                      <th>Tesis Kodu</th>
                      <th>Atık Tipi</th>
                      <th>Miktar (Ton)</th>
                      <th>Durum</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLots.length > 0 ? (
                      filteredLots.map((lot, idx) => (
                        <tr key={idx}>
                          <td><span className="code-tag">{lot.lot_code}</span></td>
                          <td>{lot.facility_code}</td>
                          <td>{lot.waste_code}</td>
                          <td>{lot.quantity_tons} t</td>
                          <td><span className="badge-status active">{lot.status}</span></td>
                          <td>
                            <button
                              className="btn-secondary btn-sm"
                              onClick={() => setSelectedQrLot(lot)}
                            >
                              {t.qrLabel}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                          Aramaya veya filtreye uygun lot bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Sistem Denetim İzi & Hareket Geçmişi ({auditLogs.length})</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Zaman Damgası</th>
                      <th>Kullanıcı</th>
                      <th>Eylem (Action)</th>
                      <th>Hedef / Detay</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td><span className="code-tag">{log.timestamp}</span></td>
                        <td>{log.user}</td>
                        <td><strong>{log.action}</strong></td>
                        <td>{log.target}</td>
                        <td><span className="badge-status active">{log.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t.apiKeyTitle}</span>
              </div>
              <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Demo ERP Entegrasyon Key (X-API-Key)
                  </label>
                  <div className="key-box">
                    <span>{showApiKey ? "demo-erp-key-9f8e7d6c5b4a3210" : "••••••••••••••••••••••••••••"}</span>
                    <button className="btn-secondary btn-sm" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? "Gizle" : "Göster"}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Webhook Gizli Anahtarı (Secret Key)
                  </label>
                  <div className="key-box">
                    <span>whsec_wf_live_8839210394821</span>
                  </div>
                </div>

                <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                  <button className="btn-primary" onClick={() => sendNotification("Test Bildirimi", "macOS bildirim entegrasyonu aktif!")}>
                    Mac Masaüstü Test Bildirimi Gönder
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* QR Modal */}
      {selectedQrLot && (
        <div className="modal-overlay" onClick={() => setSelectedQrLot(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
              Saha Fiziksel Konteyner Etiketi
            </span>
            <h3 style={{ margin: 0, fontFamily: "var(--font-mono)" }}>{selectedQrLot.lot_code}</h3>
            
            <div className="qr-box">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${selectedQrLot.lot_code}`}
                alt="Lot QR Code"
              />
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "left", width: "100%", background: "var(--bg-root)", padding: "10px", borderRadius: "6px" }}>
              <div><strong>Tesis:</strong> {selectedQrLot.facility_code}</div>
              <div><strong>Atık Tipi:</strong> {selectedQrLot.waste_code}</div>
              <div><strong>Miktar:</strong> {selectedQrLot.quantity_tons} Ton</div>
            </div>

            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => alert("Yazıcıya gönderildi.")}>{t.printLabel}</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedQrLot(null)}>{t.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
