/**
 * prepareStudioFormDataForSubmit
 *
 * Imagens: pass-through (servidor sharp/HEIC). Sem materialize no cliente (evita hang Android).
 * Vídeos grandes: cloud upload.
 */

import { MAX_IMAGE_DIRECT_BYTES, VIDEO_VERCEL_SAFE_BYTES } from "../uploadConstants";

function isImageFile(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || "");
}

function isVideoFile(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("video/")) return true;
  return /\.(mp4|mov|webm)$/i.test(file.name || "");
}

export async function prepareStudioFormDataForSubmit(formData, options = {}) {
  const out = new FormData();

  for (const [key, val] of formData.entries()) {
    if (!(val instanceof File)) {
      out.append(key, val);
      continue;
    }

    if ((key === "video" || isVideoFile(val)) && val.size > VIDEO_VERCEL_SAFE_BYTES) {
      if (!options.skipBlobOffload) {
        try {
          const { uploadVideoToCloud } = await import("../api");
          const url = await uploadVideoToCloud(val, {
            onProgress: options.onVideoProgress,
            timeoutMs: options.timeoutMs,
          });
          out.append(key === "video" ? "video_url" : `${key}_url`, url);
          continue;
        } catch {
          /* fall through */
        }
      }
    }

    if (isImageFile(val) && val.size > MAX_IMAGE_DIRECT_BYTES) {
      try {
        const { prepareImageForUpload } = await import("../prepareImageForUpload");
        const prepared = await prepareImageForUpload(val, { force: true });
        out.append(key, prepared);
        continue;
      } catch {
        /* servidor trata */
      }
    }

    out.append(key, val);
  }

  return out;
}
