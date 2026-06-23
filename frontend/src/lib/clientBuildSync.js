/**
 * Sincroniza o JS em cache com /api/health após deploy.
 * - Auto-reload silencioso no máximo 1× por versão do servidor
 * - Toast só se o reload não resolver (BuildVersionGuard)
 */
import { CLIENT_BUILD_ID } from "./buildInfo";

const LS_AUTO_RELOAD = "rp_build_auto_reload";
const LS_TOAST_SHOWN = "rp_build_toast_shown";

/** Bump when auth routing changes so browsers drop stale /app RequireAuth bundles. */
export const ROUTING_EPOCH = "brand-campaign-admin-v3";

export async function ensureRoutingEpoch() {
  if (typeof window === "undefined") return;
  const key = "rp_routing_epoch";
  if (localStorage.getItem(key) === ROUTING_EPOCH) return;
  localStorage.setItem(key, ROUTING_EPOCH);
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  const u = new URL(window.location.href);
  if (!u.searchParams.has("rp_route_bust")) {
    u.searchParams.set("rp_route_bust", ROUTING_EPOCH);
    window.location.replace(u.toString());
  }
}

function storageKey(prefix, serverBuild) {
  return `${prefix}:${serverBuild}`;
}

export function shouldShowStaleBuildToast(serverBuild) {
  if (!serverBuild || serverBuild === CLIENT_BUILD_ID) return false;
  return !localStorage.getItem(storageKey(LS_TOAST_SHOWN, serverBuild));
}

export function markStaleBuildToastShown(serverBuild) {
  if (serverBuild) {
    localStorage.setItem(storageKey(LS_TOAST_SHOWN, serverBuild), "1");
  }
}

export function clearStaleBuildFlags(serverBuild) {
  if (!serverBuild) return;
  localStorage.removeItem(storageKey(LS_AUTO_RELOAD, serverBuild));
  localStorage.removeItem(storageKey(LS_TOAST_SHOWN, serverBuild));
}

export async function syncClientBuildWithServer() {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;

  try {
    const r = await fetch("/api/health", { cache: "no-store", credentials: "same-origin" });
    if (!r.ok) return;
    const { build } = await r.json();
    const serverBuild = String(build || "");
    if (!serverBuild) return;

    sessionStorage.setItem("rp_js_build", serverBuild);

    if (serverBuild === CLIENT_BUILD_ID) {
      clearStaleBuildFlags(serverBuild);
      return;
    }

    const autoKey = storageKey(LS_AUTO_RELOAD, serverBuild);
    if (!localStorage.getItem(autoKey)) {
      localStorage.setItem(autoKey, "1");
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
  } catch {
    /* offline */
  }
}
