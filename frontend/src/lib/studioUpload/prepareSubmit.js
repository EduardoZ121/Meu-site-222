/**
 * prepareStudioFormDataForSubmit
 *
 * Imagens: pass-through (servidor sharp/HEIC). Sem materialize no cliente (evita hang Android).
 * Vídeos grandes: cloud upload.
 *
 * Mobile safety: cada File é re-lido para um Blob fresco antes de ir para o FormData.
 * Sem isto, iOS Safari / Android Chrome podem servir um handle "stale" após
 * compressão prévia ou recolha de memória, causando upload silenciosamente vazio.
 */

import { MAX_IMAGE_DIRECT_BYTES, VIDEO_VERCEL_SAFE_BYTES } from "../uploadConstants";
import { materializeUploadFile } from "../durableUploadFile";

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

/** Re-lê um File para um Blob novo (Uint8Array em memória). */
async function refreshFileHandle(file) {
  return materializeUploadFile(file);
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
            timeoutMs: options.blobOffloadTimeoutMs ?? options.timeoutMs,
          });
          out.append(key === "video" ? "video_url" : `${key}_url`, url);
          continue;
        } catch (err) {
          throw new Error(
            err?.message
            || "Não foi possível enviar o vídeo para a nuvem. Tenta um clip mais curto ou recarrega (Ctrl+F5).",
          );
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

    // Mobile safety: re-read the file into a fresh Blob to avoid stale handles.
    if (isImageFile(val)) {
      const fresh = await refreshFileHandle(val);
      out.append(key, fresh);
      continue;
    }

    out.append(key, val);
  }

  return out;
}
