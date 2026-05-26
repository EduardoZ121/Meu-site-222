/**
 * Prepara FormData antes do POST.
 *
 * SIMPLIFIED — only offload VIDEOS to cloud when they're too large for
 * Vercel's body limit. Images go through directly; the server handles
 * HEIF conversion + compression with sharp. Previous versions tried to
 * Blob-offload images too and broke uploads.
 */

import { prepareImageForUpload } from "../prepareImageForUpload";
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
 * Normaliza ficheiros para envio ao /api.
 * Vídeos grandes → nuvem. Imagens → directo (servidor trata HEIF com sharp).
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

    // Videos > 3.2 MB need cloud upload (Vercel body limit)
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

    // Images — just normalize MIME type and send directly.
    // Server handles HEIF→JPEG conversion with sharp.
    if (isImageField(key, val)) {
      // eslint-disable-next-line no-await-in-loop
      const prepared = await prepareImageForUpload(val);
      out.append(key, prepared);
      // eslint-disable-next-line no-continue
      continue;
    }

    out.append(key, val);
  }

  return out;
}
