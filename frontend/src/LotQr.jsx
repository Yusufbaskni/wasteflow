import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ewcOf } from "./ewc.js";

export function lotQrPayload(lot) {
  const ewc = ewcOf(lot.material);
  return JSON.stringify({
    sys: "WasteFlow",
    id: lot.id,
    material: lot.material,
    ewc: ewc.code,
    kg: lot.weight,
    facility: lot.facility,
    sourceId: lot.sourceId || "",
    purity: lot.purity,
    status: lot.status
  });
}

export default function LotQr({ lot, size = 196 }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!lot?.id) return;
    QRCode.toDataURL(lotQrPayload(lot), {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" }
    }).then(setSrc);
  }, [lot, size]);

  if (!src) return <div style={{ height: size, color: "#444444", fontSize: 12 }}>QR üretiliyor…</div>;
  return <img src={src} alt={`QR ${lot.id}`} width={size} height={size} style={{ display: "block", margin: "0 auto" }} />;
}

export async function printLotLabel(lot) {
  const src = await QRCode.toDataURL(lotQrPayload(lot), {
    width: 360,
    margin: 1,
    errorCorrectionLevel: "M"
  });
  const win = window.open("", "wasteflow-lot-label", "width=420,height=560");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${lot.id}</title>
    <style>body{font-family:system-ui,sans-serif;text-align:center;padding:24px;color:#111} img{width:240px;height:240px} .meta{font-size:13px;color:#444}</style>
    </head><body>
    <div style="font-size:11px;letter-spacing:1px;color:#444444;font-weight:700">WASTEFLOW LOT ETİKETİ</div>
    <h1 style="font-size:22px;margin:12px 0">${lot.id}</h1>
    <img src="${src}" alt="${lot.id}" />
    <p class="meta">${lot.material} · EWC ${ewcOf(lot.material).code} · ${lot.weight} kg</p>
    <p class="meta">${lot.sourceId || ""} → ${lot.facility} · ${lot.status}</p>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}
