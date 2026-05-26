/**
 * Prepara imagem para envio ao servidor (JPEG, tamanho seguro Vercel).
 */

import { compressImageNeverFail } from "./canvasCompress";
import { normalizeImageFile } from "./imageCompress";
import { MAX_IMAGE_DIRECT_BYTES } from "./uploadConstants";

const HEIC = /\.(heic|heif)$/i;

/**
 * @param {File|Blob} file
 * @param {{ maxBytes?: number, maxSize?: number, force?: boolean }} [opts]
 * @returns {Promise<File>}
 */
export async function prepareImageForUpload(file, opts = {}) {
  if (!file) return file;
  let work = file instanceof File ? normalizeImageFile(file) : normalizeImageFile(
    new File([file], "upload.jpg", { type: file.type || "application/octet-stream" }),
  );

  const maxBytes = Number(opts.maxBytes) || MAX_IMAGE_DIRECT_BYTES;
  const maxSize = Math.min(Number(opts.maxSize) || 2048, 4096);
  const isJpeg = /^image\/jpe?g$/i.test(work.type || "");
  const small = work.size <= maxBytes * 0.85 && isJpeg && !HEIC.test(work.name || "");

  if (!opts.force && small) return work;

  const out = await compressImageNeverFail(work, {
    maxBytes,
    maxSize,
    maxBytesIOS: Math.min(maxBytes, 1.5 * 1024 * 1024),
  });

  if (HEIC.test(work.name || "") && out === work && !/^image\/jpe?g$/i.test(out.type || "")) {
    const renamed = new File([out], (work.name || "photo").replace(HEIC, ".jpg"), {
      type: "image/jpeg",
      lastModified: work.lastModified || Date.now(),
    });
    return renamed;
  }

  return out instanceof File ? out : work;
}
