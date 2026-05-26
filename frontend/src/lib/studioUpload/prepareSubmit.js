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
 * Vercel serverless has a ~4.5 MB request body limit. If the image is too
 * large after canvas compression (e.g. Samsung HEIF the browser can't decode),
 * upload it to Blob and send the URL instead.
 *
 * Also, Samsung HEIF-as-.jpg files MUST go through Blob because the browser
 * can't compress them and the raw HEIF bytes cause the AI to ignore the photo.
 * The server's normalizeUploadedImages (sharp) converts HEIF→JPEG during the
 * Blob upload, so the stored Blob is always a clean JPEG the AI can read.
 */
const VERCEL_BODY_SAFE = 3_800_000;

async function offloadImageToBlob(file) {
  try {
    const { uploadImageToBlob } = await import("../api");
    if (typeof uploadImageToBlob !== "function") throw new Error("no uploadImageToBlob");
    const url = await uploadImageToBlob(file);
    return url;
  } catch {
    return null;
  }
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

      // CRITICAL: If the file is flagged as needing Blob offload (HEIF, or
      // browser couldn't decode it), ALWAYS upload to Blob. Sending raw HEIF
      // bytes inline causes the AI model to ignore the photo entirely.
      const needsBlob = !skipBlob && (
        prepared._needsBlobOffload
        || prepared.size > VERCEL_BODY_SAFE
      );

      if (needsBlob) {
        // eslint-disable-next-line no-await-in-loop
        const blobUrl = await offloadImageToBlob(prepared);
        if (blobUrl) {
          const urlKey = key === "photo" ? "photo_url"
            : key === "image" ? "image_url"
            : `${key}_url`;
          out.append(urlKey, blobUrl);
          // eslint-disable-next-line no-continue
          continue;
        }
        // Blob upload failed — send the file anyway as last resort
        console.warn("[prepareSubmit] Blob offload failed for", key, "sending inline");
      }

      out.append(key, prepared);
      // eslint-disable-next-line no-continue
      continue;
    }

    out.append(key, val);
  }

  return out;
}
