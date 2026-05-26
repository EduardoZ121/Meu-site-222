/**
 * Prepara FormData antes do POST — mesma caixa com brilho no browser.
 * - Imagens até ~3 MB: directo no formulário
 * - Imagens ainda grandes: Vercel Blob (photo_url)
 * - Vídeos grandes: Vercel Blob (video_url)
 */

import { prepareImageForUpload } from "../prepareImageForUpload";
import { MAX_IMAGE_DIRECT_BYTES, VIDEO_VERCEL_SAFE_BYTES } from "../uploadConstants";

const IMAGE_KEYS = new Set([
  "photo", "image", "mask", "garment", "reference_image", "slide_photo", "photo_b",
]);

const VERCEL_SAFE = 3_000_000;

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

async function shrinkImageForDirectUpload(file, perImageMax, emergency) {
  let prepared = await prepareImageForUpload(file, {
    maxBytes: perImageMax,
    maxSize: emergency ? 1024 : 2048,
    force: true,
  });
  if (emergency && prepared.size > perImageMax) {
    prepared = await prepareImageForUpload(prepared, {
      maxBytes: Math.floor(perImageMax * 0.75),
      maxSize: 896,
      force: true,
    });
  }
  return prepared;
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
  const emergency = Boolean(options.emergencyCompress);

  for (const [key, val] of formData.entries()) {
    if (!(val instanceof File)) {
      out.append(key, val);
      continue;
    }

    if (key === "video" || (isVideoFile(val) && key !== "mask")) {
      if (!options.skipBlobOffload && val.size > VIDEO_VERCEL_SAFE_BYTES) {
        const { uploadVideoToCloud } = await import("../blobUploadClient");
        // eslint-disable-next-line no-await-in-loop
        const url = await uploadVideoToCloud(val, {
          onProgress: options.onVideoProgress,
          timeoutMs: options.timeoutMs,
        });
        out.append(key === "video" ? "video_url" : `${key}_url`, url);
      } else if (val.size > VIDEO_VERCEL_SAFE_BYTES) {
        throw new Error("Vídeo demasiado grande. Usa um clip mais curto (~3 MB) ou ativa Vercel Blob.");
      } else {
        out.append(key, val);
      }
      continue;
    }

    if (isImageField(key, val)) {
      // eslint-disable-next-line no-await-in-loop
      let work = await shrinkImageForDirectUpload(val, perImageMax, emergency);
      if (work.size > VERCEL_SAFE && !options.skipBlobOffload) {
        const { uploadImageToCloud } = await import("../blobUploadClient");
        // eslint-disable-next-line no-await-in-loop
        const url = await uploadImageToCloud(work, {
          onProgress: options.onImageProgress,
          timeoutMs: options.timeoutMs,
        });
        out.append(`${key}_url`, url);
      } else if (work.size > VERCEL_SAFE) {
        throw new Error(
          "Foto demasiado grande. Escolhe outra ou, no iPhone: Ajustes → Câmara → Mais compatível (JPEG).",
        );
      } else {
        out.append(key, work);
      }
      continue;
    }

    out.append(key, val);
  }

  return out;
}
