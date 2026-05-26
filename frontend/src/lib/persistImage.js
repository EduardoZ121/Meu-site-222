import { api, invalidateBlobUploadCache, isBlobUploadEnabled } from "./api";

/** Upload para Vercel Blob (opcional). Lança em falha. */
export async function persistImageToBlobStore(file) {
  const { put } = await import("@vercel/blob/client");
  const { data } = await api.post("/blob/prepare", { filename: file.name || "upload.jpg" });
  const { clientToken, pathname } = data || {};
  if (!clientToken || !pathname) {
    throw new Error("Armazenamento em nuvem indisponível.");
  }
  await put(pathname, file, {
    access: "public",
    token: clientToken,
    contentType: file.type || "image/jpeg",
    multipart: file.size > 4_500_000,
  });
}

/** Upload de vídeo para Vercel Blob (video-to-video). */
export async function persistVideoToBlobStore(file) {
  const { put } = await import("@vercel/blob/client");
  const { data } = await api.post("/blob/prepare", {
    filename: file.name || "upload.mp4",
    kind: "video",
  });
  const { clientToken, pathname } = data || {};
  if (!clientToken || !pathname) {
    throw new Error("Armazenamento em nuvem indisponível.");
  }
  await put(pathname, file, {
    access: "public",
    token: clientToken,
    contentType: file.type || "video/mp4",
    multipart: file.size > 8_000_000,
  });
}

/** Mesmo estado que uploadPost — evita cache desatualizado. */
export async function isBlobPersistAvailable() {
  return isBlobUploadEnabled();
}

export { invalidateBlobUploadCache };
