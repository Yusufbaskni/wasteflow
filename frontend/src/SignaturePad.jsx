import React, { useEffect, useRef } from "react";

export default function SignaturePad({ onChange, height = 88 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue("--bg-input").trim() || "#ffffff";
    const ink = styles.getPropertyValue("--text-main").trim() || "#111111";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, rect.width, height);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      const ctx = canvas.getContext("2d");
      const styles = getComputedStyle(document.documentElement);
      ctx.strokeStyle = styles.getPropertyValue("--text-main").trim() || "#111111";
    };
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  const pos = (e) => {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
    onChange?.(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const styles = getComputedStyle(document.documentElement);
    ctx.fillStyle = styles.getPropertyValue("--bg-input").trim() || "#ffffff";
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
    onChange?.("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        style={{ width: "100%", height, background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: 4, touchAction: "none", cursor: "crosshair" }}
      />
      <button type="button" onClick={clear} style={{ marginTop: 6, background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-color)", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
        İmzayı sil
      </button>
    </div>
  );
}
