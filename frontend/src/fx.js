const FX_KEY = "wasteflow.fx.v1";

export function loadCachedFx() {
  try {
    const raw = localStorage.getItem(FX_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed?.usdTry || !parsed?.eurTry) return null;
    return { ...parsed, live: false };
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

function withTimeout(ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return {
    signal: ctrl.signal,
    done: () => clearTimeout(timer)
  };
}

async function getJson(url, ms = 8000) {
  const t = withTimeout(ms);
  try {
    const res = await fetch(url, { signal: t.signal, cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } finally {
    t.done();
  }
}

async function fromDesktop() {
  if (!window.wasteflowDesktop?.fetchFx) throw new Error("no-desktop");
  const data = await window.wasteflowDesktop.fetchFx();
  if (!data?.usdTry || !data?.eurTry) throw new Error("desktop-empty");
  return pack({ usdTry: data.usdTry, eurTry: data.eurTry, source: data.source || "masaüstü" });
}

async function fromLocalApi() {
  const { apiFetch } = await import("./api.js");
  const t = withTimeout(10000);
  try {
    const res = await apiFetch("/api/v1/fx", { signal: t.signal, cache: "no-store" });
    if (!res.ok) throw new Error("api-fx");
    const data = await res.json();
    if (!data?.usdTry || !data?.eurTry) throw new Error("api-empty");
    return pack({ usdTry: data.usdTry, eurTry: data.eurTry, source: data.source || "WasteFlow API" });
  } finally {
    t.done();
  }
}

async function fromFrankfurter() {
  const usd = await getJson("https://api.frankfurter.dev/v1/latest?from=USD&to=TRY");
  const eur = await getJson("https://api.frankfurter.dev/v1/latest?from=EUR&to=TRY");
  const usdTry = usd?.rates?.TRY;
  const eurTry = eur?.rates?.TRY;
  if (!usdTry || !eurTry) throw new Error("frankfurter-empty");
  return pack({ usdTry, eurTry, source: "ECB / frankfurter" });
}

async function fromOpenEr() {
  const data = await getJson("https://open.er-api.com/v6/latest/USD");
  const usdTry = data?.rates?.TRY;
  const eurPerUsd = data?.rates?.EUR;
  if (!usdTry || !eurPerUsd) throw new Error("er-api-empty");
  return pack({ usdTry, eurTry: usdTry / eurPerUsd, source: "open.er-api.com" });
}

async function fromJsDelivr() {
  const data = await getJson("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json");
  const usdTry = data?.usd?.try;
  const usdEur = data?.usd?.eur;
  if (!usdTry || !usdEur) throw new Error("jsdelivr-empty");
  return pack({ usdTry, eurTry: usdTry / usdEur, source: "currency-api" });
}

async function fromFloatRates() {
  const data = await getJson("https://www.floatrates.com/daily/usd.json");
  const usdTry = data?.try?.rate;
  const usdEur = data?.eur?.rate;
  if (!usdTry || !usdEur) throw new Error("float-empty");
  return pack({ usdTry, eurTry: usdTry / usdEur, source: "floatrates.com" });
}

export async function fetchLiveFx() {
  const chain = [fromDesktop, fromLocalApi, fromFrankfurter, fromOpenEr, fromFloatRates, fromJsDelivr];
  let lastError = null;
  for (const fn of chain) {
    try {
      const fx = await fn();
      saveCachedFx(fx);
      return fx;
    } catch (err) {
      lastError = err;
    }
  }
  const cached = loadCachedFx();
  if (cached) return cached;
  throw lastError || new Error("Canlı kur alınamadı");
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
