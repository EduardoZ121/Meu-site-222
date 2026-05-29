/**
 * prepareStudioFormDataForSubmit — FAST VERSION
 *
 * Images: pass through directly. Server handles compression with sharp.
 * Videos > 3.2 MB: cloud upload (Vercel Blob).
 * No canvas compression, no slow processing, no "preparing" delays.
 */

import { VIDEO_VERCEL_SAFE_BYTES } from "../uploadConstants";

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

    // Large video → cloud upload
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
          // Cloud failed — try sending directly as last resort
        }
      }
    }

    // Everything else (images, small videos) → pass through directly
    out.append(key, val);
  }

  return out;
}
