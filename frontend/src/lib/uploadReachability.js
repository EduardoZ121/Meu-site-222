import { API } from "./api";

let lastProbe = { at: 0, ok: true };

const PROBE_TTL_MS = 12_000;

/**
 * Verifica se a API responde (evita culpar "sem internet" quando o browser está online).
 */
export async function probeApiReachable() {
  if (typeof window === "undefined" || typeof fetch === "undefined") return true;
  const now = Date.now();
  if (now - lastProbe.at < PROBE_TTL_MS) return lastProbe.ok;

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(`${API}/health`, {
      method: "GET",
      credentials: "same-origin",
      signal: ctrl.signal,
      cache: "no-store",
    });
    lastProbe = { at: now, ok: r.ok };
    return r.ok;
  } catch {
    lastProbe = { at: now, ok: false };
    return false;
  } finally {
    clearTimeout(tid);
  }
}

export function invalidateReachabilityCache() {
  lastProbe = { at: 0, ok: true };
}

/** Só tratar como offline quando o browser diz offline OU a API não responde. */
export async function isEffectivelyOffline() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const reachable = await probeApiReachable();
  return !reachable;
}

export function isBrowserOnlineFlag() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}
