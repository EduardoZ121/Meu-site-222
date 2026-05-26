/**
 * Força reload quando o JS em cache não coincide com /api/health (PWA / CDN).
 */
import { CLIENT_BUILD_ID } from "./buildInfo";

export async function syncClientBuildWithServer() {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;

  try {
    const r = await fetch("/api/health", { cache: "no-store", credentials: "same-origin" });
    if (!r.ok) return;
    const { build } = await r.json();
    const serverBuild = String(build || "");
    if (!serverBuild) return;

    const loaded = sessionStorage.getItem("rp_js_build");
    const mismatch = loaded && loaded !== serverBuild;
    const clientStale = CLIENT_BUILD_ID && serverBuild !== CLIENT_BUILD_ID;

    if (mismatch || clientStale) {
      sessionStorage.setItem("rp_js_build", serverBuild);
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      }
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      const u = new URL(window.location.href);
      u.searchParams.set("rp_bust", String(Date.now()));
      window.location.replace(u.toString());
      return;
    }

    sessionStorage.setItem("rp_js_build", serverBuild);
  } catch {
    /* ignore */
  }
}
