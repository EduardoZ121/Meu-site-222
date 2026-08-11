/**
 * Upload de foto para URL pública — usado só em fluxos que precisam de photo_url.
 */

import { isAndroid, isIOS } from "./device";
import { uploadImageToCloud } from "./blobUploadClient";

async function withTimeout(promise, ms, message) {
  let tid;
  const timeout = new Promise((_, reject) => {
    tid = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(tid);
  }
}

/**
 * Mobile: proxy servidor primeiro (Blob client costuma pendurar).
 */
export async function uploadPickedPhotoToCloud(file, opts = {}) {
  if (!file) throw new Error("no file");
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const { uploadImageViaServerProxy } = await import("./blobUploadClient");

  if (isAndroid() || isIOS()) {
    return withTimeout(
      uploadImageViaServerProxy(file, { timeoutMs }),
      timeoutMs + 5000,
      "O envio da foto demorou demasiado. Tenta com Wi‑Fi ou uma foto mais pequena.",
    );
  }

  try {
    return await withTimeout(
      uploadImageToCloud(file, { ...opts, timeoutMs }),
      timeoutMs + 15_000,
      "O envio da foto demorou demasiado.",
    );
  } catch {
    return withTimeout(
      uploadImageViaServerProxy(file, { timeoutMs }),
      timeoutMs + 5000,
      "O envio da foto demorou demasiado.",
    );
  }
}
