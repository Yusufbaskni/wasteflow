function stamp() {
  return new Date().toISOString().slice(0, 10);
}

export function downloadExcelReport({ lots, bins, esg, metrics, econ, fx }) {
  const usd = fx?.usdTry ? Number(fx.usdTry).toFixed(4) : "";
  const eur = fx?.eurTry ? Number(fx.eurTry).toFixed(4) : "";
  const lines = [
    "WasteFlow Günlük Rapor",
    `Tarih,${stamp()}`,
    `USD/TRY,${usd}`,
    `EUR/TRY,${eur}`,
    `Kur kaynağı,${fx?.source || ""}`,
    `Kur saati,${fx?.updatedAt || ""}`,
    "",
    "ESG",
    `Döngüsellik %,${metrics?.circularity_rate ?? ""}`,
    `İşlenen ton,${esg?.total_waste_processed_tons ?? ""}`,
    `CO2 t,${esg?.co2_avoided_tons ?? ""}`,
    `Su L,${esg?.water_saved_liters ?? ""}`,
    `Ağaç,${esg?.trees_saved ?? ""}`,
    "",
    "Gelir Gider TRY",
    `Gelir,${econ?.revenue ?? ""}`,
    `Gider,${econ?.cost ?? ""}`,
    `Marj,${econ?.margin ?? ""}`,
    `Gelir USD,${econ?.totals?.revenue?.usd ?? ""}`,
    `Gider USD,${econ?.totals?.cost?.usd ?? ""}`,
    `Marj USD,${econ?.totals?.margin?.usd ?? ""}`,
    `Gelir EUR,${econ?.totals?.revenue?.eur ?? ""}`,
    `Gider EUR,${econ?.totals?.cost?.eur ?? ""}`,
    `Marj EUR,${econ?.totals?.margin?.eur ?? ""}`,
    `Filo km,${econ?.fleetKm ?? ""}`,
    `Yakıt ₺,${econ?.fuelTry ?? ""}`,
    `Dizel ₺/km,${econ?.dieselPerKm ?? ""}`,
    "",
    "Depolar",
    "Konteyner,Konum,Doluluk %,Batarya %",
    ...bins.map((b) => [b.bin_id, `"${b.location || ""}"`, b.fill_percentage, b.battery_level].join(",")),
    "",
    "Lotlar",
    "ID,Materyal,EWC,Kg,Tesis,Kaynak,Saflık,Durum",
    ...lots.map((l) => [l.id, `"${l.material}"`, l.ewc || "", l.weight, `"${l.facility}"`, l.sourceId || "", l.purity, l.status].join(","))
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `wasteflow-rapor-${stamp()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function printPdfReport({ lots, bins, esg, metrics, econ, fx }) {
  const usd = fx?.usdTry ? Number(fx.usdTry).toFixed(4) : "-";
  const eur = fx?.eurTry ? Number(fx.eurTry).toFixed(4) : "-";
  const n = (v, d = 2) => Number(v || 0).toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>WasteFlow Rapor</title>
  <style>
    body{font-family:system-ui,sans-serif;padding:32px;color:#111}
    h1{font-size:20px;margin:0 0 8px}
    table{border-collapse:collapse;width:100%;margin:12px 0 24px;font-size:12px}
    th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
    th{background:#f4f4f4;color:#111}
  </style></head><body>
  <h1>WasteFlow haftalık ESG, kur ve gelir-gider raporu</h1>
  <p>${stamp()} · İstinye Üniversitesi</p>
  <h2>Canlı kur</h2>
  <table><tbody>
    <tr><th>1 USD</th><td>${usd} ₺</td></tr>
    <tr><th>1 EUR</th><td>${eur} ₺</td></tr>
    <tr><th>Kaynak</th><td>${fx?.source || "-"} · ${fx?.updatedAt || ""}</td></tr>
  </tbody></table>
  <h2>Gelir / gider</h2>
  <table><thead><tr><th></th><th>TRY</th><th>USD</th><th>EUR</th></tr></thead><tbody>
    <tr><th>Gelir</th><td>${n(econ?.totals?.revenue?.try, 0)}</td><td>${n(econ?.totals?.revenue?.usd)}</td><td>${n(econ?.totals?.revenue?.eur)}</td></tr>
    <tr><th>Gider</th><td>${n(econ?.totals?.cost?.try, 0)}</td><td>${n(econ?.totals?.cost?.usd)}</td><td>${n(econ?.totals?.cost?.eur)}</td></tr>
    <tr><th>Marj</th><td>${n(econ?.totals?.margin?.try, 0)}</td><td>${n(econ?.totals?.margin?.usd)}</td><td>${n(econ?.totals?.margin?.eur)}</td></tr>
  </tbody></table>
  <h2>Filo yakıt</h2>
  <p>${econ?.fleetKm ?? 0} km · ${n(econ?.fuelTry, 0)} ₺ · ${econ?.dieselPerKm ?? ""} ₺/km</p>
  <p>${econ?.license || ""}</p>
  <h2>Kütle dengesi</h2>
  <table><tbody>
    <tr><th>Giren</th><td>${econ?.mass?.incomingKg ?? "-"} kg</td></tr>
    <tr><th>Geri dönüşüm / teslim</th><td>${econ?.mass?.recoveredKg ?? "-"} kg</td></tr>
    <tr><th>Depolama / karantina</th><td>${econ?.mass?.landfillKg ?? "-"} kg</td></tr>
    <tr><th>Yolda</th><td>${econ?.mass?.transitKg ?? "-"} kg</td></tr>
  </tbody></table>
  <h2>ESG</h2>
  <table><tbody>
    <tr><th>Döngüsellik</th><td>%${metrics?.circularity_rate ?? "-"}</td></tr>
    <tr><th>İşlenen</th><td>${esg?.total_waste_processed_tons ?? "-"} ton</td></tr>
    <tr><th>CO₂</th><td>${esg?.co2_avoided_tons ?? "-"} t</td></tr>
    <tr><th>Su</th><td>${esg?.water_saved_liters ?? "-"} L</td></tr>
    <tr><th>Ağaç</th><td>${esg?.trees_saved ?? "-"}</td></tr>
  </tbody></table>
  <h2>Depolar</h2>
  <table><thead><tr><th>ID</th><th>Konum</th><th>Doluluk</th><th>Batarya</th></tr></thead><tbody>
  ${bins.map((b) => `<tr><td>${b.bin_id}</td><td>${b.location || ""}</td><td>%${b.fill_percentage}</td><td>%${b.battery_level}</td></tr>`).join("")}
  </tbody></table>
  <h2>Lotlar</h2>
  <table><thead><tr><th>ID</th><th>Materyal</th><th>kg</th><th>Tesis</th><th>Kaynak</th><th>Durum</th></tr></thead><tbody>
  ${lots.map((l) => `<tr><td>${l.id}</td><td>${l.material}</td><td>${l.weight}</td><td>${l.facility}</td><td>${l.sourceId || ""}</td><td>${l.status}</td></tr>`).join("")}
  </tbody></table>
  </body></html>`;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 250);
}

function printHtml(title, htmlBody) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:system-ui,sans-serif;padding:28px;color:#111} table{border-collapse:collapse;width:100%;font-size:12px;margin-top:12px} th,td{border:1px solid #ddd;padding:6px 8px} th{background:#f4f4f4;color:#111} h1{font-size:18px}</style>
    </head><body>${htmlBody}</body></html>`);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 250);
}

export function printAuditPdf(logs) {
  printHtml(
    "WasteFlow Denetim",
    `<h1>Sistem denetim günlüğü</h1><p>${stamp()} · İstinye Üniversitesi</p>
    <table><thead><tr><th>Saat</th><th>İşlem</th><th>Detay</th></tr></thead><tbody>
    ${(logs || []).map((l) => `<tr><td>${l.timestamp || ""}</td><td>${l.action || ""}</td><td>${l.detail || ""}</td></tr>`).join("")}
    </tbody></table>`
  );
}

export function printDriverManifest(routes) {
  const blocks = (routes || []).map((r) => `
    <h2>${r.id} · ${r.name} · ${r.km} km</h2>
    <p>Çıkış: ${r.depot}</p>
    <table><thead><tr><th>#</th><th>Kod</th><th>Nokta</th><th>Materyal</th><th>Doluluk</th><th>Etap km</th></tr></thead><tbody>
    ${r.stops.map((s) => `<tr><td>${s.order}</td><td>${s.id}</td><td>${s.name}</td><td>${s.material}</td><td>%${s.fill ?? "-"}</td><td>${s.legKm}</td></tr>`).join("")}
    </tbody></table>`).join("");
  printHtml("Sürücü listesi", `<h1>WasteFlow günlük toplama listesi</h1><p>${stamp()}</p>${blocks}`);
}

export function printCarbonCertificate({ esg, mass, user }) {
  printHtml(
    "Karbon sertifikası",
    `<div style="border:2px solid #111111;padding:36px;text-align:center">
      <div style="font-size:11px;letter-spacing:2px;color:#444444;font-weight:700">İSTİNYE ÜNİVERSİTESİ · WASTEFLOW</div>
      <h1 style="font-size:22px;margin:16px 0 8px">Karbon Kaçınma Sertifikası</h1>
      <p>Tarih ${stamp()} · Düzenleyen ${user || "Sistem"}</p>
      <p style="font-size:42px;font-weight:800;margin:28px 0;color:#111111">${esg?.co2_avoided_tons ?? 0} t CO₂</p>
      <p>Lot kütlesi ${mass?.incomingTons ?? 0} ton işlenmiş atığa karşılık gelen tahmini emisyon kaçınması.</p>
      <p style="font-size:12px;color:#666666;margin-top:24px">Lisans: İSÜ-ÇED-ATK-2026/04 · GRI / CSRD uyum çerçevesi · Jüri demo belgesi</p>
    </div>`
  );
}

export function printWaybill(doc) {
  if (!doc) return;
  const s = doc.sender || {};
  const r = doc.receiver || {};
  const sign = doc.signData ? `<img src="${doc.signData}" alt="imza" style="height:64px" />` : `<p>${doc.signer || "—"}</p>`;
  printHtml(
    `e-İrsaliye ${doc.documentNo || doc.id}`,
    `<div style="display:flex;justify-content:space-between;gap:16px">
      <div>
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#555">GİB e-İrsaliye · ${doc.profile || "TEMELIRSALIYE"}</div>
        <h1>e-İrsaliye</h1>
        <p>${s.title || "İstinye Üniversitesi WasteFlow"}</p>
      </div>
      <div style="text-align:right;font-size:12px">
        <div><b>Belge no</b> ${doc.documentNo || doc.id}</div>
        <div><b>ETTN</b> ${doc.ettn || "—"}</div>
        <div><b>Zarf</b> ${doc.zarfId || "—"}</div>
        <div><b>Durum</b> ${doc.gibStatus || "TASLAK"} ${doc.gibCode ? `(${doc.gibCode})` : ""}</div>
      </div>
    </div>
    <p style="font-size:11px;color:#666">GİB test / jüri entegratör simülasyonu — canlı mükellef GİB bağlantısı değildir.</p>
    <table><tbody>
      <tr><th>Gönderici VKN</th><td>${s.vkn || ""}</td><th>Alıcı</th><td>${r.name || doc.facility || ""}</td></tr>
      <tr><th>Gönderici adres</th><td>${s.address || ""}</td><th>Alıcı VKN</th><td>${r.vkn || ""}</td></tr>
      <tr><th>Tür</th><td>${doc.kind}</td><th>Lot</th><td>${doc.lotId}</td></tr>
      <tr><th>Materyal / EWC</th><td>${doc.material} · ${doc.ewc}</td><th>Tartım</th><td>${doc.kg} kg</td></tr>
      <tr><th>Kaynak</th><td>${doc.sourceId}</td><th>Tesis</th><td>${doc.facility}</td></tr>
      <tr><th>Plaka / sürücü</th><td>${doc.plate} · ${doc.driver}</td><th>TCKN</th><td>${doc.driverTckn || "—"}</td></tr>
      <tr><th>Düzenleme</th><td>${doc.time}</td><th>Gönderim</th><td>${doc.sentAt || "—"}</td></tr>
      <tr><th>İmza</th><td colspan="3">${sign}<div>${doc.signer || ""}</div></td></tr>
    </tbody></table>
    <p style="font-size:11px;color:#444444">Lisans: ${s.license || "İSÜ-ÇED-ATK-2026/04"} · UBL-TR DespatchAdvice</p>`
  );
}
