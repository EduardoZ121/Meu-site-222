/**
 * Envio ao /api — só POST directo (sem Vercel Blob).
 * Fotos: comprimir no browser. Vídeos: só se couberem no limite Vercel.
 */

import { prepareImageForUpload } from "../prepareImageForUpload";
import { MAX_IMAGE_DIRECT_BYTES, VIDEO_VERCEL_SAFE_BYTES } from "../uploadConstants";

const IMAGE_KEYS = new Set([
  "photo", "image", "mask", "garment", "reference_image", "slide_photo", "photo_b",
]);

const VERCEL_SAFE = 3_000_000;

const ERR_IMAGE_TOO_LARGE =
  "Foto ainda demasiado grande. Escolhe outra imagem ou exporta JPEG mais pequena no telemóvel.";

const ERR_VIDEO_TOO_LARGE =
  "Vídeo demasiado grande para enviar sem nuvem. Usa um clip mais curto (até ~3 MB) ou ativa S3 no servidor.";

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

function countImageFields(formData) {
  let n = 0;
  for (const [key, val] of formData.entries()) {
    if (val instanceof File && isImageField(key, val)) n += 1;
  }
  return n;
}

async function prepareImageForPost(file, perImageMax, emergency) {
  let prepared = await prepareImageForUpload(file, {
    maxBytes: perImageMax,
    maxSize: emergency ? 1024 : 2048,
    force: true,
  });
  if (emergency && prepared.size > perImageMax) {
    prepared = await prepareImageForUpload(prepared, {
      maxBytes: Math.floor(perImageMax * 0.7),
      maxSize: 896,
      force: true,
    });
  }
  if (prepared.size > VERCEL_SAFE) {
    throw new Error(ERR_IMAGE_TOO_LARGE);
  }
  return prepared;
}

export async function prepareStudioFormDataForSubmit(formData, options = {}) {
  const imageCount = countImageFields(formData);
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
        const { isS3VideoUploadAvailable, uploadVideoViaS3 } = await import("../s3VideoUpload");
        if (await isS3VideoUploadAvailable()) {
          // eslint-disable-next-line no-await-in-loop
          const url = await uploadVideoViaS3(val, { onProgress: options.onVideoProgress });
          out.append(key === "video" ? "video_url" : `${key}_url`, url);
        } else {
          throw new Error(ERR_VIDEO_TOO_LARGE);
        }
      } else {
        out.append(key, val);
      }
      continue;
    }

    if (isImageField(key, val)) {
      // eslint-disable-next-line no-await-in-loop
      const prepared = await prepareImageForPost(
        val,
        perImageMax,
        Boolean(options.emergencyCompress),
      );
      out.append(key, prepared);
      continue;
    }

    out.append(key, val);
  }

  return out;
}
