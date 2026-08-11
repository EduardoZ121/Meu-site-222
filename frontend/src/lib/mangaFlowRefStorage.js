/**
 * Manga Flow reference images — persist only stable URLs (never blob: in localStorage).
 */

export function isStableRefUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("blob:") || url.startsWith("data:")) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

/** URL for <img> preview on cards and upload box. */
export function getMangaRefDisplayUrl(data) {
  if (!data) return null;
  if (isStableRefUrl(data.refPersistUrl)) return data.refPersistUrl;
  if (isStableRefUrl(data.refImageUrl)) return data.refImageUrl;
  if (data.refImageUrl && String(data.refImageUrl).startsWith("blob:")) return data.refImageUrl;
  if (data.refImageUrl && String(data.refImageUrl).startsWith("data:")) {
    return data.refImageUrl.length < 500_000 ? data.refImageUrl : null;
  }
  return null;
}

export function hasMangaRef(data) {
  return Boolean(
    data?.refImage instanceof File ||
    isStableRefUrl(data?.refPersistUrl) ||
    isStableRefUrl(data?.refImageUrl) ||
    (data?.refImageUrl && String(data.refImageUrl).startsWith("blob:")),
  );
}

export function sanitizeNodeRefData(data = {}) {
  const next = { ...data, refImage: undefined };
  if (next.refImageUrl && String(next.refImageUrl).startsWith("blob:")) {
    next.refImageUrl = isStableRefUrl(next.refPersistUrl) ? next.refPersistUrl : null;
  }
  if (!isStableRefUrl(next.refPersistUrl)) {
    next.refPersistUrl = null;
  }
  if (next.refImageUrl && !isStableRefUrl(next.refImageUrl) && !String(next.refImageUrl).startsWith("data:")) {
    next.refImageUrl = next.refPersistUrl || null;
  }
  return next;
}

export function hydrateNodeRefData(data = {}) {
  const next = { ...data, refImage: data.refImage instanceof File ? data.refImage : null };
  if (isStableRefUrl(next.refPersistUrl)) {
    if (!next.refImageUrl || String(next.refImageUrl).startsWith("blob:")) {
      next.refImageUrl = next.refPersistUrl;
    }
  } else if (next.refImageUrl && String(next.refImageUrl).startsWith("blob:")) {
    next.refImageUrl = null;
  }
  return next;
}

export function hydrateFlowNodes(nodes) {
  return (nodes || []).map((n) => ({
    ...n,
    data: hydrateNodeRefData(n.data || {}),
  }));
}

export function projectHasPendingRefUploads(nodes) {
  return (nodes || []).some((n) => n.data?.refUploading === true);
}
