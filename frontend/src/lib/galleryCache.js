/**
 * Client-side gallery warm cache so opening Galeria from nav
 * does not feel like a cold load (skeleton / "a carregar").
 *
 * - Memory + sessionStorage list of recent creations
 * - Stale lists are still used for instant paint (refresh in background)
 * - Upsert on generation success + prefetch while browsing the app
 * - Prefetch result media into the browser cache
 */

import {
  displayMediaUrl,
  isVideoCreation,
  normalizeCreation,
  primaryResultUrl,
} from "./creationUrls";

const STORAGE_KEY = "rp_gallery_cache_v1";
const MAX_ITEMS = 60;
/** Soft freshness: older than this → still show, but prefetch sooner. */
const FRESH_MS = 30 * 60 * 1000;
/** Hard discard only after a long idle (avoid empty flash after days). */
const MAX_KEEP_MS = 7 * 24 * 60 * 60 * 1000;

/** @type {{ creations: object[], pending: object[], ts: number } | null} */
let memory = null;

/** @type {Promise<object[]|null>|null} */
let prefetchInflight = null;

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ageMs(entry) {
  const ts = Number(entry?.ts || 0);
  if (!ts) return Number.POSITIVE_INFINITY;
  return Date.now() - ts;
}

function isUsable(entry) {
  if (!entry || !Array.isArray(entry.creations)) return false;
  return ageMs(entry) <= MAX_KEEP_MS;
}

function isFresh(entry) {
  return isUsable(entry) && ageMs(entry) <= FRESH_MS;
}

function persist(entry) {
  memory = entry;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    /* quota / private mode */
  }
}

function hydrateFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const parsed = safeParse(sessionStorage.getItem(STORAGE_KEY));
    if (!isUsable(parsed)) return null;
    memory = {
      creations: (parsed.creations || []).map(normalizeCreation),
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
      ts: Number(parsed.ts) || Date.now(),
    };
    return memory;
  } catch {
    return null;
  }
}

function mergeById(existing, incoming) {
  const map = new Map();
  for (const row of existing || []) {
    if (row?.id) map.set(row.id, row);
  }
  for (const row of incoming || []) {
    if (!row?.id) continue;
    map.set(row.id, { ...(map.get(row.id) || {}), ...row });
  }
  return Array.from(map.values());
}

function sortNewest(list) {
  return [...list].sort((a, b) => {
    const ta = new Date(a?.created_at || 0).getTime();
    const tb = new Date(b?.created_at || 0).getTime();
    return tb - ta;
  });
}

/**
 * Read warm cache (memory first, then sessionStorage).
 * Stale entries are returned by default so Gallery can paint instantly.
 */
export function readGalleryCache({ allowStale = true } = {}) {
  if (memory && isUsable(memory)) {
    if (allowStale || isFresh(memory)) return memory;
  }
  const fromDisk = hydrateFromStorage();
  if (!fromDisk) return null;
  if (allowStale || isFresh(fromDisk)) return fromDisk;
  return null;
}

export function isGalleryCacheFresh() {
  const entry = readGalleryCache({ allowStale: true });
  return Boolean(entry && isFresh(entry));
}

/** Replace cache after a successful history fetch. */
export function writeGalleryCache(creations, pending = []) {
  const list = sortNewest(
    (creations || []).map(normalizeCreation).filter((c) => c?.id),
  ).slice(0, MAX_ITEMS);
  persist({
    creations: list,
    pending: Array.isArray(pending) ? pending : [],
    ts: Date.now(),
  });
  return list;
}

/** Merge one creation to the front of the cache (optimistic / success path). */
export function upsertGalleryCreation(creation) {
  const normalized = normalizeCreation(creation);
  if (!normalized?.id) return null;
  const prev = readGalleryCache({ allowStale: true });
  const merged = sortNewest(
    mergeById(prev?.creations || [], [normalized]),
  ).slice(0, MAX_ITEMS);
  persist({
    creations: merged,
    pending: prev?.pending || [],
    ts: Date.now(),
  });
  return normalized;
}

export function getCachedCreation(id) {
  const key = String(id || "").trim();
  if (!key) return null;
  const cache = readGalleryCache({ allowStale: true });
  return (cache?.creations || []).find((c) => c.id === key) || null;
}

/** Prefetch result URL so the gallery thumb paints from browser cache. */
export function preloadCreationMedia(creation) {
  if (typeof window === "undefined") return;
  const normalized = normalizeCreation(creation);
  const url = primaryResultUrl(normalized);
  if (!url || url.startsWith("data:")) return;
  const src = displayMediaUrl(url, false);
  try {
    if (isVideoCreation(normalized, src)) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.src = src;
      video.load?.();
      return;
    }
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  } catch {
    /* ignore */
  }
}

/**
 * Call when a generation succeeds: seed list + preload media.
 * Safe to call repeatedly.
 */
export function warmGalleryAfterSuccess(creation) {
  const normalized = upsertGalleryCreation(creation);
  if (normalized) preloadCreationMedia(normalized);
  return normalized;
}

/** Seed cache right before navigating to gallery (bubble / notification). */
export function seedGalleryFocus(creation) {
  return warmGalleryAfterSuccess(creation);
}

/** Merge a known creation into an items array (newest first, de-dupe). */
export function mergeCreationIntoList(items, creation) {
  const normalized = normalizeCreation(creation);
  if (!normalized?.id) return items || [];
  return sortNewest(mergeById(items || [], [normalized]));
}

/**
 * Prefetch history while the user is elsewhere in the app so Galeria
 * opens with photos already in memory/sessionStorage.
 * Dedupes concurrent calls; skips network when cache is still fresh.
 */
export function prefetchGalleryHistory(apiClient, { force = false } = {}) {
  if (typeof window === "undefined" || !apiClient?.get) {
    return Promise.resolve(null);
  }
  if (!force && isGalleryCacheFresh()) {
    return Promise.resolve(readGalleryCache({ allowStale: true })?.creations || null);
  }
  if (prefetchInflight) return prefetchInflight;

  prefetchInflight = apiClient
    .get("/generations/history?limit=60", { timeout: 20000 })
    .then((res) => {
      const list = (res.data?.creations || []).map(normalizeCreation);
      writeGalleryCache(list);
      list.slice(0, 12).forEach((c) => preloadCreationMedia(c));
      return list;
    })
    .catch(() => null)
    .finally(() => {
      prefetchInflight = null;
    });

  return prefetchInflight;
}
