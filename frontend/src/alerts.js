let lastKey = "";

export function playAlertTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.frequency.value = 660;
    }, 140);
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => ctx.close();
  } catch {
    /* autoplay blocked */
  }
}

export function notifyCriticalBins(bins) {
  const critical = bins.filter((b) => Number(b.fill_percentage) >= 85);
  const key = critical.map((b) => b.bin_id).sort().join("|");
  if (!critical.length || key === lastKey) return null;
  lastKey = key;
  const body = critical.map((b) => `${b.location || b.bin_id} %${b.fill_percentage}`).join(", ");
  playAlertTone();
  if (typeof Notification !== "undefined") {
    if (Notification.permission === "granted") {
      new Notification("WasteFlow depo uyarısı", { body: `Doluluk %85+ : ${body}` });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") new Notification("WasteFlow depo uyarısı", { body: `Doluluk %85+ : ${body}` });
      });
    }
  }
  return body;
}
