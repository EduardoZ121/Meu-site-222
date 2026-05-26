/**
 * Prepara imagem para POST — HEIC→JPEG (heic2any) + compressão canvas.
 */

import { compressImageNeverFail } from "./canvasCompress";
import { normalizeImageFile } from "./imageCompress";
import { MAX_IMAGE_DIRECT_BYTES } from "./uploadConstants";

const HEIC = /\.(heic|heif)$/i;

function isHeicLike(file) {
  if (!file) return false;
  if (HEIC.test(file.name || "")) return true;
  return /image\/hei(c|f)/i.test(file.type || "");
}

async function convertHeicToJpeg(file) {
  if (!isHeicLike(file)) return file;
  try {
    const mod = await import("heic2any");
    const heic2any = mod.default || mod;
    const out = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });
    const blob = Array.isArray(out) ? out[0] : out;
    if (!blob) return file;
    const base = (file.name || "photo").replace(HEIC, "");
    return new File([blob], `${base || "photo"}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified || Date.now(),
    });
  } catch {
    return file;
  }
}

export async function prepareImageForUpload(file, opts = {}) {
  if (!file) return null;

  let work = file instanceof File
    ? normalizeImageFile(file)
    : normalizeImageFile(
      new File([file], "upload.jpg", { type: file.type || "application/octet-stream" }),
    );

  work = await convertHeicToJpeg(work);

  const maxBytes = Number(opts.maxBytes) || MAX_IMAGE_DIRECT_BYTES;
  const maxSize = Math.min(Number(opts.maxSize) || 2048, 4096);
  const isJpeg = /^image\/jpe?g$/i.test(work.type || "");
  const small = !opts.force
    && work.size <= maxBytes * 0.85
    && isJpeg
    && !HEIC.test(work.name || "");

  if (small) return work;

  const out = await compressImageNeverFail(work, {
    maxBytes,
    maxSize,
    maxBytesIOS: Math.min(maxBytes, 1.4 * 1024 * 1024),
  });

  if (out instanceof File) return out;
  return work;
}
