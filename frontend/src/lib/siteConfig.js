/**
 * Domínio e marca do site — controlado por variáveis de ambiente no build/deploy.
 *
 * Quando tiveres remake.com:
 *   REACT_APP_SITE_ORIGIN=https://www.remake.com
 *   REACT_APP_BRAND_NAME=Remake
 */

const LEGACY_ORIGIN = "https://www.remakepix.com";

function trimOrigin(url) {
  const s = String(url || "").trim().replace(/\/$/, "");
  return s || LEGACY_ORIGIN;
}

/** Origem canónica (com https, sem barra final). */
export const SITE_ORIGIN = trimOrigin(
  process.env.REACT_APP_SITE_ORIGIN || process.env.REACT_APP_CANONICAL_ORIGIN,
);

/** Domínio legado — redirecionamentos na Vercel podem apontar para SITE_ORIGIN. */
export const LEGACY_SITE_ORIGIN = LEGACY_ORIGIN;

export const BRAND_NAME = String(process.env.REACT_APP_BRAND_NAME || "Remake").trim() || "Remake";

export const BRAND_FULL_NAME = String(
  process.env.REACT_APP_BRAND_FULL_NAME || `${BRAND_NAME} — Estúdio AI de imagem e vídeo`,
).trim();

export const DEFAULT_SITE_DESCRIPTION =
  "Gera, edita e cria imagens com IA. 96 estilos, pôsteres, vídeo e ferramentas Pro — créditos simples, sem mensalidade obrigatória.";

export function absoluteSiteUrl(pathname = "/") {
  const base = SITE_ORIGIN;
  if (!pathname || pathname === "/") return `${base}/`;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

export function isLegacyHost(hostname) {
  const h = String(hostname || "").toLowerCase();
  return h === "remakepix.com" || h === "www.remakepix.com";
}

export function isPrimaryHost(hostname) {
  try {
    const primary = new URL(SITE_ORIGIN).hostname.toLowerCase();
    return String(hostname || "").toLowerCase() === primary;
  } catch {
    return false;
  }
}
