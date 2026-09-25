import { loadState } from "./storage.js";

export const API_CANDIDATES = [
  "http://127.0.0.1:8000",
  "https://wasteflow-backend-xens.onrender.com"
];

let resolvedBase = API_CANDIDATES[1];

export function getApiBase() {
  return resolvedBase;
}

export async function resolveApiBase() {
  for (const base of API_CANDIDATES) {
    try {
      const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        resolvedBase = base;
        return base;
      }
    } catch {
      try {
        const res = await fetch(`${base}/api/v1/iot/bins`, { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          resolvedBase = base;
          return base;
        }
      } catch {
        /* next */
      }
    }
  }
  return resolvedBase;
}

export async function apiFetch(path, options = {}) {
  const base = await resolveApiBase();
  return fetch(`${base}${path}`, options);
}

export function mapLot(row) {
  return {
    id: row.id,
    material: row.material,
    weight: Number(row.weight ?? row.weight_kg ?? 0),
    facility: row.facility,
    purity: Number(row.purity ?? 0),
    status: row.status || "YENİ KAYIT",
    sourceId: row.sourceId || row.source_id || "",
    photoThumb: row.photoThumb || "",
    chainAt: row.chainAt || "",
    events: row.events || []
  };
}

export const LOCAL_USERS = [
  { username: "yusuf.baskan", password: "Istinye2026", name: "Yusuf Başkan", role: "Sistem Yöneticisi" },
  { username: "operator", password: "Operator2026", name: "Saha Operatörü", role: "Operatör" },
  { username: "yonetici", password: "Yonetici2026", name: "Tesis Yöneticisi", role: "Yönetici" }
];

export function allLocalUsers() {
  return [...LOCAL_USERS, ...(loadState().extraUsers || [])];
}

export async function loginRequest(username, password) {
  const userName = username.trim().toLowerCase();
  try {
    const res = await apiFetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: userName, password })
    });
    if (res.ok) return res.json();
  } catch {
    /* local fallback */
  }
  const local = allLocalUsers().find((u) => u.username === userName && u.password === password);
  if (!local) throw new Error("Kullanıcı adı veya parola hatalı.");
  return { token: "local-session", name: local.name, role: local.role, username: local.username };
}

export async function createLotRemote(lot) {
  try {
    const res = await apiFetch("/api/v1/lots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: lot.id,
        material: lot.material,
        weight_kg: Number(lot.weight),
        facility: lot.facility,
        purity: Number(lot.purity),
        status: lot.status
      })
    });
    if (res.ok) return mapLot(await res.json());
  } catch {
    /* offline */
  }
  return lot;
}

export async function patchLotRemote(lot) {
  try {
    await apiFetch(`/api/v1/lots/${encodeURIComponent(lot.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facility: lot.facility,
        status: lot.status,
        material: lot.material,
        weight_kg: Number(lot.weight),
        purity: Number(lot.purity)
      })
    });
  } catch {
    /* offline */
  }
}
