export const ROLE_TABS = {
  admin: ["overview", "map", "collection", "routes", "fleet", "inbox", "siteInbox", "managers", "staff", "hr", "operations", "lots", "waybills", "sales", "salesStar", "priceCompare", "ai_vision", "iot", "esg", "reports", "audit", "settings"],
  manager: ["overview", "map", "collection", "routes", "fleet", "inbox", "siteInbox", "managers", "staff", "hr", "lots", "waybills", "sales", "salesStar", "priceCompare", "iot", "esg", "reports", "audit", "settings"],
  operator: ["map", "collection", "routes", "fleet", "inbox", "siteInbox", "managers", "staff", "operations", "lots", "waybills", "sales", "salesStar", "priceCompare", "ai_vision", "iot"]
};

export function normalizeRole(role) {
  const r = String(role || "").toLowerCase();
  if (r.includes("yönetici") && !r.includes("sistem")) return "manager";
  if (r.includes("yonetici") && !r.includes("sistem")) return "manager";
  if (r.includes("manager")) return "manager";
  if (r.includes("operatör") || r.includes("operator")) return "operator";
  return "admin";
}

export function canAccess(role, tab) {
  return (ROLE_TABS[normalizeRole(role)] || ROLE_TABS.admin).includes(tab);
}

export function defaultTab(role) {
  return normalizeRole(role) === "operator" ? "operations" : "overview";
}
