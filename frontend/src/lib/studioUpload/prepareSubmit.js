/**
 * Envio ao /api — imagens sempre JPEG pequeno (como antes do Blob).
 * Blob só se, após compressão, ainda passar de 3 MB (raro).
 * Vídeos grandes → nuvem.
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
      const prepared = await prepareImageForUpload(val, {
        maxBytes: MAX_IMAGE_DIRECT_BYTES,
        maxSize: 2048,
        force: true,
      });
      if (prepared.size > VERCEL_SAFE) {
        const { uploadImageToCloud } = await import("../api");
        const url = await uploadImageToCloud(prepared, options);
        out.append(`${key}_url`, url);
      } else {
        out.append(key, prepared);
      }
      continue;
    }

    out.append(key, val);
  }

  return out;
}
