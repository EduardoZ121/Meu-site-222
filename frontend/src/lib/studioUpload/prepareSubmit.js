/**
 * Envio ao /api — só POST directo (sem Blob, sem AWS).
 * Comprimir no browser → enviar no formulário.
 */

import { prepareImageForUpload } from "../prepareImageForUpload";
import { MAX_IMAGE_DIRECT_BYTES, VIDEO_VERCEL_SAFE_BYTES } from "../uploadConstants";

const IMAGE_KEYS = new Set([
  "photo", "image", "mask", "garment", "reference_image", "slide_photo", "photo_b",
]);

const VERCEL_SAFE = 3_000_000;

const ERR_IMAGE =
  "Foto demasiado grande. Escolhe outra ou, no iPhone: Ajustes → Câmara → Mais compatível (JPEG).";

const ERR_VIDEO =
  "Vídeo demasiado grande para enviar (~3 MB máx.). Usa um clip mais curto.";

function isVideoFile(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("video/")) return true;
  return /\.(mp4|mov|webm)$/i.test(file.name || "");
}

function isImageField(key, file) {
  if (IMAGE_KEYS.has(key)) return true;
  if (file.type?.startsWith?.("image/")) return true;
  return /\.(heic|heif|jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name || "");
}

function countImages(formData) {
  let n = 0;
  for (const [key, val] of formData.entries()) {
    if (val instanceof File && isImageField(key, val)) n += 1;
  }
  return n;
}

export async function prepareStudioFormDataForSubmit(formData, options = {}) {
  const imageCount = Math.max(1, countImages(formData));
  const perImageMax = imageCount > 1
    ? Math.min(MAX_IMAGE_DIRECT_BYTES, Math.floor(VERCEL_SAFE / imageCount))
    : MAX_IMAGE_DIRECT_BYTES;

  const out = new FormData();

  for (const [key, val] of formData.entries()) {
    if (!(val instanceof File)) {
      out.append(key, val);
      continue;
    }

    if (key === "video" || (isVideoFile(val) && key !== "mask")) {
      if (val.size > VIDEO_VERCEL_SAFE_BYTES) {
        throw new Error(ERR_VIDEO);
      }
      out.append(key, val);
      continue;
    }

    if (isImageField(key, val)) {
      let prepared = await prepareImageForUpload(val, {
        maxBytes: perImageMax,
        maxSize: options.emergencyCompress ? 1024 : 2048,
        force: true,
      });
      if (options.emergencyCompress && prepared.size > perImageMax) {
        prepared = await prepareImageForUpload(prepared, {
          maxBytes: Math.floor(perImageMax * 0.75),
          maxSize: 896,
          force: true,
        });
      }
      if (prepared.size > VERCEL_SAFE) {
        throw new Error(ERR_IMAGE);
      }
      out.append(key, prepared);
      continue;
    }

    out.append(key, val);
  }

  return out;
}
