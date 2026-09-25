import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

function extractLotId(raw) {
  const text = String(raw || "").trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed.id) return parsed.id;
  } catch {
    /* plain */
  }
  const m = text.match(/LOT-[\w-]+/i);
  return m ? m[0] : text;
}

export default function QrScanner({ onFound, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const onFoundRef = useRef(onFound);
  onFoundRef.current = onFound;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let stream;
    let timer;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!videoRef.current || stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setBusy(false);
        const tick = () => {
          if (stopped) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState >= 2) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height);
            if (code?.data) {
              onFoundRef.current(extractLotId(code.data));
              return;
            }
          }
          timer = setTimeout(tick, 220);
        };
        tick();
      } catch {
        setBusy(false);
        setError("Kamera açılamadı. QR görselini dosya olarak yükleyin.");
      }
    })();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const bmp = await createImageBitmap(file);
    const canvas = canvasRef.current;
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bmp, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height);
    if (code?.data) onFound(extractLotId(code.data));
    else setError("QR okunamadı. Daha net bir kare deneyin.");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#ffffff", padding: 20, borderRadius: 8, width: 360, border: "1px solid #d0d0d0" }}>
        <div style={{ color: "#444444", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>QR OKUT</div>
        {busy && <div style={{ color: "#444444", fontSize: 12 }}>Kamera isteniyor…</div>}
        <video ref={videoRef} muted playsInline style={{ width: "100%", borderRadius: 6, background: "#000" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {error && <div style={{ color: "#111111", fontSize: 12, marginTop: 8 }}>{error}</div>}
        <label style={{ display: "block", marginTop: 12, fontSize: 12, color: "#111111", cursor: "pointer" }}>
          QR görseli yükle
          <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        </label>
        <button type="button" onClick={onClose} style={{ marginTop: 12, width: "100%", background: "transparent", color: "#444444", border: "1px solid #d0d0d0", borderRadius: 4, padding: 8, cursor: "pointer" }}>
          Kapat
        </button>
      </div>
    </div>
  );
}
