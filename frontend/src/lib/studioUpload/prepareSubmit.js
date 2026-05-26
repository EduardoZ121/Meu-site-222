/**
 * Prepara FormData antes do POST — imagens → JPEG seguro; vídeos grandes → nuvem.
 */

import { prepareImageForUpload } from "../prepareImageForUpload";
import { MAX_IMAGE_DIRECT_BYTES } from "../uploadConstants";
import { VIDEO_VERCEL_SAFE_BYTES } from "../videoCloudLimits";

export const STUDIO_IMAGE_FIELDS = new Set([
  "photo",
  "image",
  "mask",
  "garment",
  "reference_image",
  "slide_photo",
  "photo_b",
]);

function isVideoFile(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("video/")) return true;
  return /\.(mp4|mov|webm)$/i.test(file.name || "");
}

function isImageField(key, file) {
  if (STUDIO_IMAGE_FIELDS.has(key)) return true;
  if (file.type?.startsWith?.("image/")) return true;
  return /\.(heic|heif|jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name || "");
}

/**
 * Normaliza todos os ficheiros para envio fiável ao /api (sem Blob no browser para fotos normais).
 */
export async function prepareStudioFormDataForSubmit(formData, options = {}) {
  const skipBlob = Boolean(options.skipBlobOffload);
  const out = new FormData();

  for (const [key, val] of formData.entries()) {
    if (!(val instanceof File)) {
      out.append(key, val);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (key === "video" || (isVideoFile(val) && key !== "mask")) {
      if (!skipBlob && val.size > VIDEO_VERCEL_SAFE_BYTES) {
        const { uploadVideoToCloud } = await import("../api");
        // eslint-disable-next-line no-await-in-loop
        const url = await uploadVideoToCloud(val, options);
        out.append(key === "video" ? "video_url" : `${key}_url`, url);
      } else {
        out.append(key, val);
      }
      // eslint-disable-next-line no-continue
      continue;
    }

    if (isImageField(key, val)) {
      // eslint-disable-next-line no-await-in-loop
      const prepared = await prepareImageForUpload(val, {
        maxBytes: MAX_IMAGE_DIRECT_BYTES,
        maxSize: 2048,
        force: true,
      });
      out.append(key, prepared);
      // eslint-disable-next-line no-continue
      continue;
    }

    out.append(key, val);
  }

  return out;
}
