export const DEPOTS = [
  { id: "FAC-01", name: "Topkapı", facility: "FAC-01 (Topkapı)", binId: "BIN-101", lat: 41.0186, lng: 28.9319 },
  { id: "FAC-02", name: "Zeytinburnu", facility: "FAC-02 (Zeytinburnu)", binId: "BIN-102", lat: 40.9938, lng: 28.9042 },
  { id: "FAC-03", name: "Bahçelievler", facility: "FAC-03 (Bahçelievler)", binId: "BIN-103", lat: 41.0022, lng: 28.8597 },
  { id: "FAC-04", name: "İstinye", facility: "FAC-04 (İstinye)", binId: "BIN-104", lat: 41.1189, lng: 29.0472 },
  { id: "FAC-05", name: "Küçükçekmece", facility: "FAC-05 (Küçükçekmece)", binId: "BIN-105", lat: 41.0155, lng: 28.7764 }
];

export function fillForDepot(depot, bins) {
  const bin = bins.find((b) => b.bin_id === depot.binId || String(b.location || "").includes(depot.name));
  return Number(bin?.fill_percentage ?? 0);
}

export function lotsForDepot(depot, lots) {
  const id = String(depot.id || "").toUpperCase();
  const name = String(depot.name || "").toLocaleLowerCase("tr-TR");
  return (lots || []).filter((lot) => {
    const raw = String(lot.facility || "");
    const code = (raw.match(/FAC-\d+/i) || [])[0]?.toUpperCase();
    if (code) return code === id;
    const f = raw.toLocaleLowerCase("tr-TR");
    return Boolean(id && raw.toUpperCase().includes(id)) || Boolean(name && f.includes(name));
  });
}

export function pinColor(fill) {
  if (fill >= 85) return "#C62828";
  if (fill >= 70) return "#D4A017";
  return "#2E7D32";
}
