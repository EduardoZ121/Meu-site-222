/**
 * Prepara FormData antes do POST.
 * - Imagens pequenas: directo ao /api
 * - Imagens grandes: comprimir no browser; se ainda > 3 MB → nuvem (photo_url)
 * - Vídeos grandes: nuvem (video_url)
 */

import { MAX_IMAGE_DIRECT_BYTES, VIDEO_VERCEL_SAFE_BYTES } from "../uploadConstants";

const IMAGE_KEYS = new Set([
  "photo",
  "image",
  "mask",
  "garment",
  "reference_image",
  "slide_photo",
  "photo_b",
]);

/** Margem abaixo do limite ~4,5 MB do body na Vercel. */
const VERCEL_SAFE_IMAGE_BYTES = 3_000_000;

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

async function shrinkImageForDirectUpload(file) {
  if (file.size <= VERCEL_SAFE_IMAGE_BYTES) return file;
  try {
    const { compressImageNeverFail } = await import("../canvasCompress");
    const out = await compressImageNeverFail(file, {
      maxBytes: MAX_IMAGE_DIRECT_BYTES,
      maxSize: 2048,
    });
    return out instanceof File ? out : file;
  } catch {
    return file;
  }
}

export async function prepareStudioFormDataForSubmit(formData, options = {}) {
  const out = new FormData();

  for (const [key, val] of formData.entries()) {
    if (!(val instanceof File)) {
      out.append(key, val);
      continue;
    }

    if (key === "video" || (isVideoFile(val) && key !== "mask")) {
      if (!options.skipBlobOffload && val.size > VIDEO_VERCEL_SAFE_BYTES) {
        const { uploadVideoToCloud } = await import("../api");
        const url = await uploadVideoToCloud(val, options);
        out.append(key === "video" ? "video_url" : `${key}_url`, url);
      } else {
        out.append(key, val);
      }
      continue;
    }

    if (isImageField(key, val)) {
      let work = await shrinkImageForDirectUpload(val);
      if (work.size > VERCEL_SAFE_IMAGE_BYTES) {
        const { uploadImageToCloud } = await import("../api");
        const url = await uploadImageToCloud(work, options);
        out.append(`${key}_url`, url);
        continue;
      }
      out.append(key, work);
      continue;
    }

    out.append(key, val);
  }

  return out;
}
