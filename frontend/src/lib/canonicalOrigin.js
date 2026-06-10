/** Domínio oficial — nunca usar links *.vercel.app em partilhas ou checkout. */
export const CANONICAL_ORIGIN = "https://www.remakepix.com";

export function isProductionHost(hostname = "") {
  const h = String(hostname || "").toLowerCase();
  return h === "remakepix.com" || h === "www.remakepix.com";
}

/** Site oficial Vercel — API sempre no mesmo domínio, nunca Emergent. */
export function isRemakePixSiteHost(hostname = "") {
  const h = String(hostname || "").toLowerCase();
  if (isProductionHost(h)) return true;
  return h.endsWith(".vercel.app") && h.includes("remakepix");
}

export function resolveCanonicalOrigin() {
  if (typeof window === "undefined") return CANONICAL_ORIGIN;
  const host = window.location.hostname || "";
  if (host.endsWith(".vercel.app") || host === "remakepix.com") {
    return CANONICAL_ORIGIN;
  }
  if (isProductionHost(host)) return CANONICAL_ORIGIN;
  return window.location.origin;
}
