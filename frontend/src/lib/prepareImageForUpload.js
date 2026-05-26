/**
 * Prepara imagem para POST — HEIC→JPEG + compressão até caber no body Vercel (~3 MB).
 */

import { compressImageNeverFail } from "./canvasCompress";
import { normalizeImageFile } from "./imageCompress";
import { MAX_IMAGE_DIRECT_BYTES } from "./uploadConstants";

const HEIC = /\.(heic|heif)$/i;
/** Margem segura abaixo do ~4,5 MB do serverless. */
export const VERCEL_BODY_SAFE_BYTES = 2_800_000;

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
      quality: 0.88,
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

/**
 * Comprime em passos até ficar abaixo do limite Vercel (evita “upload failed” em fotos difíceis).
 */
export async function ensureFitsVercelBody(file, opts = {}) {
  const targetCap = Math.min(
    Number(opts.maxBytes) || VERCEL_BODY_SAFE_BYTES,
    VERCEL_BODY_SAFE_BYTES,
  );
  const steps = opts.emergency
    ? [
      { maxBytes: Math.min(2_000_000, targetCap), maxSize: 1024 },
      { maxBytes: Math.min(1_500_000, targetCap), maxSize: 880 },
      { maxBytes: Math.min(1_100_000, targetCap), maxSize: 768 },
    ]
    : [
      { maxBytes: Math.min(MAX_IMAGE_DIRECT_BYTES, targetCap), maxSize: 2048 },
      { maxBytes: Math.min(2_400_000, targetCap), maxSize: 1536 },
      { maxBytes: Math.min(2_000_000, targetCap), maxSize: 1280 },
      { maxBytes: Math.min(1_500_000, targetCap), maxSize: 1024 },
      { maxBytes: Math.min(1_200_000, targetCap), maxSize: 896 },
    ];

  let work = file;
  for (const step of steps) {
    if (work.size <= targetCap) return work;
    work = await prepareImageForUpload(work, {
      ...opts,
      maxBytes: step.maxBytes,
      maxSize: step.maxSize,
      force: true,
    });
  }
  if (work.size > targetCap) {
    const err = new Error("compress_too_large");
    err.code = "COMPRESS_TOO_LARGE";
    throw err;
  }
  return work;
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
    && work.size <= VERCEL_BODY_SAFE_BYTES
    && isJpeg
    && !HEIC.test(work.name || "");

  if (small) return work;

  const out = await compressImageNeverFail(work, {
    maxBytes,
    maxSize,
    maxBytesIOS: Math.min(maxBytes, 1.4 * 1024 * 1024),
  });

  return out instanceof File ? out : work;
}
