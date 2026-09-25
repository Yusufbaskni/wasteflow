const FX_KEY = "wasteflow.fx.v1";

export function loadCachedFx() {
  try {
    const raw = localStorage.getItem(FX_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCachedFx(fx) {
  try {
    localStorage.setItem(FX_KEY, JSON.stringify(fx));
  } catch {
    /* quota */
  }
}

function pack({ usdTry, eurTry, source }) {
  return {
    usdTry: Number(usdTry),
    eurTry: Number(eurTry),
    source,
    live: true,
    updatedAt: new Date().toISOString()
  };
}

async function fromOpenEr() {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("er-api");
  const data = await res.json();
  const usdTry = data?.rates?.TRY;
  const eurPerUsd = data?.rates?.EUR;
  if (!usdTry || !eurPerUsd) throw new Error("er-api-empty");
  return pack({ usdTry, eurTry: usdTry / eurPerUsd, source: "open.er-api.com" });
}

async function fromJsDelivr() {
  const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json", {
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error("jsdelivr");
  const data = await res.json();
  const usdTry = data?.usd?.try;
  const usdEur = data?.usd?.eur;
  if (!usdTry || !usdEur) throw new Error("jsdelivr-empty");
  return pack({ usdTry, eurTry: usdTry / usdEur, source: "currency-api" });
}

export async function fetchLiveFx() {
  try {
    const fx = await fromOpenEr();
    saveCachedFx(fx);
    return fx;
  } catch {
    const fx = await fromJsDelivr();
    saveCachedFx(fx);
    return fx;
  }
}

export function tryToUsd(amountTry, usdTry) {
  if (!usdTry) return 0;
  return amountTry / usdTry;
}

export function tryToEur(amountTry, eurTry) {
  if (!eurTry) return 0;
  return amountTry / eurTry;
}

export function formatMoney(value, currency) {
  const n = Number(value) || 0;
  if (currency === "USD") return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";
  if (currency === "EUR") return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  return n.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " ₺";
}
