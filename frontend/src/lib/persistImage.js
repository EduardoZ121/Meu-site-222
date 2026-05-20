import { API, api } from "./api";

let blobCache = null;

export async function isBlobPersistAvailable() {
  if (blobCache !== null) return blobCache;
  if (typeof fetch === "undefined") {
    blobCache = false;
    return false;
  }
  try {
    const r = await fetch(`${API}/blob/status`, { method: "GET", credentials: "same-origin" });
    const j = await r.json();
    blobCache = Boolean(j.blob);
    return blobCache;
  } catch {
    blobCache = false;
    return false;
  }
}

/** Upload para Vercel Blob (opcional). Lança em falha. */
export async function persistImageToBlobStore(file) {
  const { put } = await import("@vercel/blob/client");
  const { data } = await api.post("/blob/prepare", { filename: file.name || "upload.jpg" });
  const { clientToken, pathname } = data;
  await put(pathname, file, {
    access: "public",
    token: clientToken,
    contentType: file.type || "image/jpeg",
    multipart: file.size > 4_500_000,
  });
}
