/**
 * Origem canónica e contactos — partilhado pelas API routes (Vercel).
 * Alinha com frontend/src/lib/siteConfig.js via as mesmas env vars.
 */

const LEGACY_ORIGIN = "https://www.remakepix.com";

function trimOrigin(url) {
  const s = String(url || "").trim().replace(/\/$/, "");
  return s || LEGACY_ORIGIN;
}

function getSiteOrigin() {
  return trimOrigin(
    process.env.SITE_URL ||
      process.env.REACT_APP_SITE_ORIGIN ||
      process.env.REACT_APP_CANONICAL_ORIGIN,
  );
}

function getSupportEmail() {
  const fromEnv = String(process.env.SUPPORT_EMAIL || process.env.REACT_APP_SUPPORT_EMAIL || "").trim();
  if (fromEnv) return fromEnv;
  try {
    const host = new URL(getSiteOrigin()).hostname.toLowerCase();
    if (host.includes("remake.com")) return "suporte@remake.com";
  } catch {
    /* ignore */
  }
  return "suporte@remakepix.com";
}

function getBrandName() {
  return String(process.env.REACT_APP_BRAND_NAME || process.env.BRAND_NAME || "Remake").trim() || "Remake";
}

function absoluteSitePath(pathname = "/") {
  const base = getSiteOrigin();
  if (!pathname || pathname === "/") return `${base}/`;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

module.exports = {
  LEGACY_ORIGIN,
  getSiteOrigin,
  getSupportEmail,
  getBrandName,
  absoluteSitePath,
};
