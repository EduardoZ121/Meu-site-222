/**
 * Deteta se o site está a correr como app instalado (Chrome «Instalar», iOS «Adicionar ao ecrã»).
 * Não activa em separadores normais do browser.
 */
export function isPwaStandalone() {
  if (typeof window === "undefined") return false;

  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
    if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  } catch {
    /* ignore */
  }

  if (typeof navigator !== "undefined" && navigator.standalone === true) return true;

  try {
    if (window.sessionStorage.getItem("rp_pwa_mode") === "1") return true;
  } catch {
    /* ignore */
  }

  return false;
}

/** Marca sessão como PWA (ex.: start_url com ?pwa=1 no manifest). */
export function markPwaSessionFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("pwa") === "1" || q.get("source") === "pwa") {
      window.sessionStorage.setItem("rp_pwa_mode", "1");
    }
  } catch {
    /* ignore */
  }
}
