/**
 * prepareStudioFormDataForSubmit — REWRITTEN FROM ZERO
 *
 * Simple pass-through. Files go directly to the server.
 * Only exception: videos > 3.2 MB go to cloud (Vercel body limit).
 * Images are NEVER offloaded — they go in the multipart body directly.
 */

import { VIDEO_VERCEL_SAFE_BYTES } from "../videoCloudLimits";

function isVideoFile(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("video/")) return true;
  return /\.(mp4|mov|webm)$/i.test(file.name || "");
}

export async function prepareStudioFormDataForSubmit(formData, options = {}) {
  const out = new FormData();

  for (const [key, val] of formData.entries()) {
    // Not a file — pass through
    if (!(val instanceof File)) {
      out.append(key, val);
      continue;
    }

    // Large video — needs cloud upload (Vercel serverless body limit ~4.5 MB)
    if ((key === "video" || isVideoFile(val)) && val.size > VIDEO_VERCEL_SAFE_BYTES) {
      try {
        const { uploadVideoToCloud } = await import("../api");
        const url = await uploadVideoToCloud(val, options);
        out.append(key === "video" ? "video_url" : `${key}_url`, url);
      } catch (err) {
        // Cloud upload failed — append file directly as last resort
        console.warn("[prepareSubmit] video cloud upload failed:", err?.message);
        out.append(key, val);
      }
      continue;
    }

    // Everything else (images, small videos, text files) — pass through directly
    out.append(key, val);
  }

  return out;
}
