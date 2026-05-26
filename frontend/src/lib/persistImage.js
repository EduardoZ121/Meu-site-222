import { VERCEL_BLOB_DISABLED } from "./blobDisabled";
import { invalidateBlobUploadCache, isBlobUploadEnabled } from "./blobUploadClient";

let blobCache = null;

export async function isBlobPersistAvailable() {
  if (VERCEL_BLOB_DISABLED) return false;
  if (blobCache !== null) return blobCache;
  blobCache = await isBlobUploadEnabled();
  return blobCache;
}

async function blobPrepareJson(body, timeoutMs = 45_000) {
  const raw = String(process.env.REACT_APP_BACKEND_URL || "").trim().replace(/\/$/, "");
  const base = raw && !(typeof window !== "undefined" && window.location?.protocol === "https:" && raw.startsWith("http:"))
    ? `${raw}/api`
    : "/api";
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("rp_token") : null;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/blob/prepare`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data.detail === "string" ? data.detail : "Blob indisponível.");
    }
    return data;
  } finally {
    clearTimeout(tid);
  }
}

/** Cópia opcional para Vercel Blob (galeria / reenvio). */
export async function persistImageToBlobStore(file) {
  if (VERCEL_BLOB_DISABLED) return;
  const { put } = await import("@vercel/blob/client");
  const { clientToken, pathname } = await blobPrepareJson({
    filename: file.name || "upload.jpg",
  });
  await put(pathname, file, {
    access: "public",
    token: clientToken,
    contentType: file.type || "image/jpeg",
    multipart: file.size > 4_500_000,
  });
}

export async function persistVideoToBlobStore(file) {
  if (VERCEL_BLOB_DISABLED) return;
  const { put } = await import("@vercel/blob/client");
  const { clientToken, pathname } = await blobPrepareJson({
    filename: file.name || "upload.mp4",
    kind: "video",
  }, 90_000);
  await put(pathname, file, {
    access: "public",
    token: clientToken,
    contentType: file.type || "video/mp4",
    multipart: file.size > 8_000_000,
  });
}

export function invalidateBlobPersistCache() {
  blobCache = null;
  invalidateBlobUploadCache();
}

export { invalidateBlobUploadCache };
