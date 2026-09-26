import React from "react";

const STEPS = [
  { tab: "overview", title: "1 · Gösterge", text: "5 depo, kadro, e-İrsaliye (GİB test) ve Başer + Star satışı." },
  { tab: "managers", title: "2 · Müdürler", text: "10 müdürle yazışma. Gündüz ve gece vardiyası ayrı." },
  { tab: "staff", title: "3 · Personel", text: "Özlük kartı: adres, yaş, mevki, maaş. İşe alım İnsan Kaynakları’nda." },
  { tab: "hr", title: "4 · İnsan Kaynakları", text: "İşe al / çıkar. Prim depo skoruna göre: hacim, işlenen lot, doluluk." },
  { tab: "fleet", title: "5 · Filo", text: "15 araç. Tırlar Çerkezköy Başer veya Hadımköy Star’a gider." },
  { tab: "priceCompare", title: "6 · 1 kg karşılaştır", text: "Başer ve Star her malzeme için 1 kg kaç ₺ ödüyor; fark yüzde ile." },
  { tab: "esg", title: "7 · ESG", text: "Kütle dengesi, lisans ve karbon sertifikası." }
];

export default function JuryTour({ step, onNext, onSkip, onGo }) {
  const current = STEPS[step] || STEPS[0];
  const last = step >= STEPS.length - 1;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 80, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 28 }}>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: 20, maxWidth: 460, width: "100%" }}>
        <div style={{ fontSize: 11, color: "var(--text-main)", fontWeight: 700, letterSpacing: 1 }}>JÜRİ TURU {step + 1}/{STEPS.length}</div>
        <h3 style={{ color: "var(--text-main)", margin: "8px 0" }}>{current.title}</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>{current.text}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button type="button" onClick={() => onGo(current.tab)} style={{ flex: 1, background: "var(--border-color)", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: 6, padding: 8, cursor: "pointer" }}>
            Bu sekmeye git
          </button>
          <button type="button" onClick={last ? onSkip : onNext} style={{ flex: 1, background: "var(--bg-surface)", color: "var(--text-main)", border: "1px solid var(--border-strong)", borderRadius: 6, padding: 8, cursor: "pointer", fontWeight: 700 }}>
            {last ? "Bitir" : "İleri"}
          </button>
          <button type="button" onClick={onSkip} style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}>
            Atla
          </button>
        </div>
      </div>
    </div>
  );
}
