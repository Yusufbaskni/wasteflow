import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MATERIALS, salePriceKg } from "./sales.js";

export default function SalesDesk({
  buyer,
  book,
  sales,
  sellableLots,
  fleet,
  draft,
  setDraft,
  lots,
  note,
  onSubmit,
  selectedId,
  setSelectedId,
  onFleet,
  formatTry,
  sectionBoxStyle,
  sectionTitleStyle,
  pageHeaderStyle,
  labelStyle,
  inputStyle,
  btnPrimary,
  linkBtn,
  chartTooltip,
  onCompare
}) {
  const doc = sales.find((s) => s.id === selectedId) || sales[0];
  const quoteLot = lots.find((l) => l.id === (draft.lotId || sellableLots[0]?.id));
  const quoteKg = Number(draft.kg || quoteLot?.weight || 0);
  const quotePrice = quoteLot ? salePriceKg(quoteLot.material, buyer.id) : 0;
  const quoteTry = Math.round(quoteKg * quotePrice * 100) / 100;

  return (
    <div>
      <h2 style={pageHeaderStyle}>Satış · {buyer.name}</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "8px 0 16px", lineHeight: 1.55 }}>
        Çerçeve sözleşme {buyer.contract}. Depodan çıkan tır {buyer.district} kabul sahasına gider.
        Asgari sevk {buyer.minTon} ton. {buyer.spec}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ ...sectionBoxStyle, borderColor: buyer.color }}>
          <div style={{ fontSize: 11, color: buyer.colorDim, fontWeight: 700 }}>ALICI FİRMA</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", marginTop: 8 }}>{buyer.legal}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.65 }}>
            {buyer.address}<br />
            {buyer.contact} ({buyer.title}) · {buyer.phone}<br />
            {buyer.email}<br />
            VKN {buyer.taxNo} · MERSİS {buyer.mersis}<br />
            Lisans {buyer.license}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <button type="button" style={linkBtn} onClick={() => onFleet(buyer.id)}>Tırı {buyer.short}’a gönder</button>
            {onCompare ? <button type="button" style={linkBtn} onClick={onCompare}>1 kg fiyat karşılaştır</button> : null}
          </div>
        </div>
        <div style={sectionBoxStyle}>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>SATILAN</div>
          <div style={{ color: "var(--text-main)", fontWeight: 700, marginTop: 8, fontSize: 22 }}>{book.kg.toLocaleString("tr-TR")} kg</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{book.count} sevk / e-fatura</div>
        </div>
        <div style={sectionBoxStyle}>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>CİRO</div>
          <div style={{ color: "var(--text-main)", fontWeight: 700, marginTop: 8, fontSize: 22 }}>{formatTry(book.amount)}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{buyer.terms}</div>
        </div>
        <div style={sectionBoxStyle}>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>BEKLEYEN STOK</div>
          <div style={{ color: "var(--text-main)", fontWeight: 700, marginTop: 8, fontSize: 22 }}>{sellableLots.length} lot</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>işlendi / teslim, henüz satılmadı</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={sectionBoxStyle}>
          <div style={{ fontSize: 11, color: buyer.colorDim, fontWeight: 700 }}>KABUL</div>
          <div style={{ fontSize: 12, color: "var(--text-main)", marginTop: 6, lineHeight: 1.55 }}>{buyer.hours}<br />{buyer.gate}</div>
        </div>
        <div style={sectionBoxStyle}>
          <div style={{ fontSize: 11, color: buyer.colorDim, fontWeight: 700 }}>ÖDEME</div>
          <div style={{ fontSize: 12, color: "var(--text-main)", marginTop: 6, lineHeight: 1.55 }}>{buyer.iban}<br />{buyer.terms}</div>
        </div>
        <div style={sectionBoxStyle}>
          <div style={{ fontSize: 11, color: buyer.colorDim, fontWeight: 700 }}>SÖZLEŞME</div>
          <div style={{ fontSize: 12, color: "var(--text-main)", marginTop: 6, lineHeight: 1.55 }}>{buyer.contract}<br />Fiyat listesi 1 kg bazında kilitli</div>
        </div>
        <div style={sectionBoxStyle}>
          <div style={{ fontSize: 11, color: buyer.colorDim, fontWeight: 700 }}>KONUM</div>
          <div style={{ fontSize: 12, color: "var(--text-main)", marginTop: 6, lineHeight: 1.55 }}>{buyer.district} / {buyer.city}<br />{buyer.lat.toFixed(4)}, {buyer.lng.toFixed(4)}</div>
        </div>
      </div>

      {note ? <div style={{ ...sectionBoxStyle, marginBottom: 12, color: "var(--text-main)", fontSize: 13 }}>{note}</div> : null}

      <form onSubmit={onSubmit} style={{ ...sectionBoxStyle, marginBottom: 16, display: "grid", gridTemplateColumns: "1.5fr 0.8fr 1.2fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Lot (depodan çıkan)</label>
          <select
            value={draft.lotId || sellableLots[0]?.id || ""}
            onChange={(e) => {
              const lot = lots.find((l) => l.id === e.target.value);
              setDraft({ ...draft, lotId: e.target.value, kg: lot ? String(lot.weight) : draft.kg });
            }}
            style={inputStyle}
          >
            {sellableLots.length ? sellableLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.id} · {lot.material} · {lot.weight} kg · {salePriceKg(lot.material, buyer.id)} ₺/kg
              </option>
            )) : <option value="">Satılacak lot yok</option>}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Kg</label>
          <input type="number" value={draft.kg} onChange={(e) => setDraft({ ...draft, kg: e.target.value })} placeholder="Lot ağırlığı" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Tır / plaka</label>
          <select value={draft.plate || fleet[0]?.plate || ""} onChange={(e) => setDraft({ ...draft, plate: e.target.value })} style={inputStyle}>
            {fleet.map((v) => <option key={v.id} value={v.plate}>{v.plate} · {v.driver}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Teklif {quoteKg ? `${quoteKg.toLocaleString("tr-TR")} kg × ${quotePrice} ₺ = ${formatTry(quoteTry)}` : "lot seçin"}
          </div>
          <button type="submit" style={{ ...btnPrimary, width: "100%" }} disabled={!sellableLots.length}>
            {buyer.short}’a sat
          </button>
        </div>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={sectionBoxStyle}>
          <h3 style={sectionTitleStyle}>Satılan kg (malzeme)</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={book.chart} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-muted)" />
                <YAxis type="category" dataKey="name" width={120} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltip} />
                <Bar dataKey="kg" fill={buyer.color} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={sectionBoxStyle}>
          <h3 style={sectionTitleStyle}>1 kg fiyat + gerçekleşen ciro</h3>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {MATERIALS.map((material) => {
              const price = salePriceKg(material, buyer.id);
              const row = book.rows.find((r) => r.material === material);
              return (
                <div key={material} style={{ display: "flex", justifyContent: "space-between", gap: 8, borderTop: "1px solid var(--border-color)", padding: "7px 0", fontSize: 12 }}>
                  <span style={{ color: "var(--text-main)" }}>{material}</span>
                  <span style={{ color: buyer.colorDim, whiteSpace: "nowrap" }}>
                    {price} ₺/kg{row ? ` · ${Math.round(row.kg).toLocaleString("tr-TR")} kg · ${formatTry(row.amount)}` : " · sevk yok"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={sectionBoxStyle}>
          <h3 style={sectionTitleStyle}>Sevk / e-fatura</h3>
          {sales.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedId(row.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: selectedId === row.id ? buyer.bg : "transparent",
                border: "none",
                borderBottom: "1px solid var(--border-color)",
                color: "var(--text-main)",
                padding: "10px 0",
                cursor: "pointer"
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: buyer.colorDim }}>{row.id} · {formatTry(row.amount)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.lotId} · {row.kg} kg · {row.priceKg} ₺/kg · {row.plate} · {row.pay}</div>
            </button>
          ))}
        </div>
        <div style={sectionBoxStyle}>
          {doc ? (
            <>
              <h3 style={sectionTitleStyle}>{doc.id}</h3>
              <div style={{ fontSize: 13, color: "var(--text-main)", lineHeight: 1.75 }}>
                Alıcı: {doc.buyer}<br />
                Sözleşme: {doc.contract || buyer.contract}<br />
                Varış: {doc.dest}<br />
                {buyer.address}<br />
                {doc.lotId} · {doc.material}<br />
                {Number(doc.kg).toLocaleString("tr-TR")} kg × {doc.priceKg} ₺/kg = {formatTry(doc.amount)}<br />
                Çıkış depo: {doc.facility}<br />
                Tır {doc.plate} · {doc.driver}<br />
                e-Fatura {doc.eFatura || "—"} · {doc.pay || "Kesildi"}<br />
                {doc.time}
              </div>
              <button type="button" style={{ ...btnPrimary, marginTop: 16 }} onClick={() => onFleet(buyer.id, doc.plate)}>
                Bu tırı haritada izle
              </button>
            </>
          ) : <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Henüz satış yok.</div>}
        </div>
      </div>
    </div>
  );
}
