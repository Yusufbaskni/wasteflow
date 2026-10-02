import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DIESEL_TRY_KM } from "./ekonomi.js";
import { FACILITY_OPTIONS } from "./rotaOnerisi.js";
import {
  compareHumanVsSystem,
  exportExperimentCsv,
  facilityVerdict,
  formatTry,
  loadExperimentLog,
  pickScenario,
  saveExperimentLog,
  WRONG_FACILITY_TRY
} from "./kararDeneyi.js";
import ExperimentMap from "./KararDeneyiHarita.jsx";

const box = {
  backgroundColor: "var(--bg-surface)",
  border: "1px solid var(--border-color)",
  borderRadius: 8,
  padding: 16
};

export default function DecisionExperiment({ sites }) {
  const [seed, setSeed] = useState(2209);
  const [orderIds, setOrderIds] = useState([]);
  const [sampleId, setSampleId] = useState("");
  const [humanFacility, setHumanFacility] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [log, setLog] = useState(() => loadExperimentLog());

  const siteKey = (sites || []).map((s) => `${s.id}:${s.fill}`).join("|");
  const points = useMemo(() => pickScenario(sites, seed), [siteKey, seed]);

  useEffect(() => {
    const ids = points.map((p) => p.id);
    setOrderIds(ids);
    setSampleId(ids[0] || "");
    setHumanFacility("");
    setRevealed(false);
    setPlaying(false);
  }, [points]);

  useEffect(() => {
    saveExperimentLog(log);
  }, [log]);

  const byId = useMemo(() => Object.fromEntries(points.map((p) => [p.id, p])), [points]);
  const sample = byId[sampleId] || points[0];
  const tours = useMemo(() => compareHumanVsSystem(points, orderIds), [points, orderIds]);
  const verdict = revealed ? facilityVerdict(sample?.material, humanFacility) : null;
  const extraTry = (tours.dieselTry || 0) + (verdict?.penaltyTry || 0);
  const canRun = Boolean(humanFacility && sample);

  const move = (index, dir) => {
    const next = [...orderIds];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setOrderIds(next);
    setRevealed(false);
    setPlaying(false);
  };

  const pickLot = useCallback((id) => {
    setSampleId(id);
    setHumanFacility("");
    setRevealed(false);
    setPlaying(false);
  }, []);

  const reroll = () => setSeed((s) => s + 1);

  const run = () => {
    if (!canRun) return;
    const nextVerdict = facilityVerdict(sample.material, humanFacility);
    const nextTours = compareHumanVsSystem(points, orderIds);
    const diesel = nextTours.dieselTry || 0;
    const penalty = nextVerdict.penaltyTry || 0;
    const row = {
      at: new Date().toLocaleString("tr-TR"),
      lotId: sample.id,
      material: sample.material,
      humanFacility,
      systemFacility: nextVerdict.facility,
      facilityOk: !nextVerdict.wrong,
      humanKm: nextTours.human.km,
      systemKm: nextTours.system.km,
      extraKm: nextTours.extraKm,
      dieselTry: diesel,
      penaltyTry: penalty,
      totalTry: diesel + penalty
    };
    if (!revealed) setLog((prev) => [...prev, row]);
    setRevealed(true);
    setPlaying(false);
    requestAnimationFrame(() => setPlaying(true));
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>Karar deneyi</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "0 0 16px", maxWidth: 860 }}>
        1) Durak sırasını ↑↓ ile sizin turunuz yapın (kırmızı). 2) Haritadan veya listeden bir lot seçin.
        3) Tesis seçin — sistem cevabı kapalı. 4) Karşılaştır: yeşil sistem turu açılır. Dizel {formatTry(DIESEL_TRY_KM)}/km,
        yanlış tesis {formatTry(WRONG_FACILITY_TRY)}. Yapay zekâ ve canlı GİB yok.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={reroll} style={ghost}>Yeni senaryo</button>
        <button
          type="button"
          onClick={run}
          disabled={!canRun}
          title={canRun ? "" : "Önce lot ve tesis seçin"}
          style={{ ...primary, opacity: canRun ? 1 : 0.45, cursor: canRun ? "pointer" : "not-allowed" }}
        >
          Karşılaştır ve oynat
        </button>
        <button type="button" onClick={() => exportExperimentCsv(log)} disabled={!log.length} style={ghost}>
          Kayıtları CSV al
        </button>
        <button type="button" onClick={() => setLog([])} disabled={!log.length} style={ghost}>Kayıtları sil</button>
      </div>

      <div className="experiment-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <div style={{ ...box, maxHeight: 280, overflow: "auto" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Sizin tur sıranız (kırmızı çizgi)</div>
            {orderIds.map((id, i) => {
              const p = byId[id];
              if (!p) return null;
              const on = id === sampleId;
              return (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 0",
                    borderTop: i ? "1px solid var(--border-color)" : "none",
                    background: on ? "var(--nav-active)" : "transparent"
                  }}
                >
                  <button type="button" onClick={() => move(i, -1)} style={tiny} disabled={i === 0}>↑</button>
                  <button type="button" onClick={() => move(i, 1)} style={tiny} disabled={i === orderIds.length - 1}>↓</button>
                  <button type="button" onClick={() => pickLot(id)} style={{ ...ghost, flex: 1, textAlign: "left", padding: "6px 8px" }}>
                    {i + 1}. {p.id} · {p.material} · %{p.fill}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={box}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
              Seçili lot: {sample?.id} · {sample?.material} (haritadan da tıklanır)
            </div>
            <select
              value={humanFacility}
              onChange={(e) => { setHumanFacility(e.target.value); setRevealed(false); setPlaying(false); }}
              style={selectStyle}
            >
              <option value="">Tesis seçin — sistem kapalı</option>
              {FACILITY_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>{sample?.name}</div>
          </div>

          {revealed && verdict && (
            <div style={{ ...box, borderColor: verdict.wrong ? "#B42318" : "#1B6B4A" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{verdict.wrong ? "Yanlış tesis" : "Tesis uydu"}</div>
              <div style={{ fontSize: 12, lineHeight: 1.45 }}>
                Sistem: <strong>{verdict.facility}</strong><br />
                Eşleşen kural: {verdict.matchedLabel}<br />
                {verdict.reason}
              </div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 11, color: "var(--text-muted)" }}>
                {verdict.rejected.filter((r) => r.facility !== verdict.facility).slice(0, 4).map((r) => (
                  <li key={r.facility}>{r.facility}: {r.why}</li>
                ))}
              </ul>
            </div>
          )}

          {revealed && (
            <div style={box}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Maliyet kartı</div>
              <Row k="Sizin turunuz" v={`${tours.human.km} km`} c="#B42318" />
              <Row k="Sistem turu" v={`${tours.system.km} km`} c="#1B6B4A" />
              <Row k="Fark" v={`${tours.extraKm > 0 ? "+" : ""}${tours.extraKm} km`} />
              <Row k="Fazla dizel" v={formatTry(tours.dieselTry)} />
              <Row k="Yanlış tesis" v={verdict?.wrong ? formatTry(verdict.penaltyTry) : "yok"} c={verdict?.wrong ? "#B42318" : undefined} />
              <div style={{ borderTop: "1px solid var(--border-color)", marginTop: 8, paddingTop: 8, fontWeight: 700, fontSize: 14 }}>
                Senaryo fazla maliyet: {formatTry(extraTry)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                Yeşil çizgi karşılaştırana kadar gizli. GİB/GPS canlı değil.
              </div>
            </div>
          )}
        </div>

        <div style={{ ...box, padding: 0, overflow: "hidden", minHeight: 440 }}>
          <div style={{ display: "flex", gap: 16, fontSize: 11, padding: "8px 12px", borderBottom: "1px solid var(--border-color)" }}>
            <span style={{ color: "#B42318" }}>— — Sizin turunuz</span>
            <span style={{ color: revealed ? "#1B6B4A" : "var(--text-muted)" }}>{revealed ? "— Sistem" : "Sistem gizli"}</span>
          </div>
          <div style={{ height: 460 }}>
            <ExperimentMap
              start={tours.start}
              systemStops={tours.system.stops}
              humanStops={tours.human.stops}
              playing={playing}
              revealed={revealed}
              selectedId={sampleId}
              onSelectStop={pickLot}
            />
          </div>
        </div>
      </div>

      <div style={{ ...box, marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Deneme kaydı ({log.length})</div>
        {!log.length ? (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Henüz kayıt yok. Karşılaştırınca satır düşer.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  {["#", "Zaman", "Lot", "Sizin tesis", "Sistem", "Tesis", "Sizin km", "Sistem km", "Fazla TL"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.map((r, i) => (
                  <tr key={`${r.at}-${i}`}>
                    <td style={td}>{i + 1}</td>
                    <td style={td}>{r.at}</td>
                    <td style={td}>{r.lotId}</td>
                    <td style={td}>{r.humanFacility}</td>
                    <td style={td}>{r.systemFacility}</td>
                    <td style={{ ...td, color: r.facilityOk ? "#1B6B4A" : "#B42318" }}>{r.facilityOk ? "doğru" : "yanlış"}</td>
                    <td style={td}>{r.humanKm}</td>
                    <td style={td}>{r.systemKm}</td>
                    <td style={td}>{formatTry(r.totalTry)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, c }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, padding: "3px 0" }}>
      <span style={{ color: "var(--text-muted)" }}>{k}</span>
      <span style={{ color: c || "var(--text-main)", fontWeight: 600 }}>{v}</span>
    </div>
  );
}

const th = { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontWeight: 600 };
const td = { padding: "6px 8px", borderBottom: "1px solid var(--border-color)", color: "var(--text-main)" };

const primary = {
  background: "var(--text-main)",
  color: "var(--bg-surface)",
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: 13
};

const ghost = {
  background: "var(--bg-muted)",
  color: "var(--text-main)",
  border: "1px solid var(--border-color)",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: 13
};

const tiny = {
  ...ghost,
  padding: "4px 7px",
  fontSize: 11,
  minWidth: 28
};

const selectStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid var(--border-color)",
  background: "var(--bg-muted)",
  color: "var(--text-main)",
  fontSize: 13
};
