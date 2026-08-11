/** Limites e validação de media — imagem vs vídeo (nunca misturar mensagens). */

import { looksLikeImageFile } from "./imageCompress";
import {
  MAX_IMAGE_PICKER_BYTES, MAX_VIDEO_SOURCE_PICKER_BYTES, MAX_VIDEO_USER_BYTES, VIDEO_VERCEL_SAFE_BYTES,
} from "./uploadConstants";

export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_PICKER_BYTES;

export const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_USER_BYTES;
export const MAX_VIDEO_SOURCE_BYTES = MAX_VIDEO_SOURCE_PICKER_BYTES;
export { VIDEO_VERCEL_SAFE_BYTES };

export const IMAGE_UPLOAD_ACCEPT =
  "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";

/** Aceitar contentores comuns (iPhone MOV/HEVC, Android, WhatsApp, 3GP). */
export const VIDEO_UPLOAD_ACCEPT =
  "video/*,video/mp4,video/quicktime,video/x-m4v,video/webm,video/3gpp,.mp4,.mov,.m4v,.webm,.3gp,.3gpp";

const VIDEO_EXT = /\.(mp4|mov|m4v|webm|3gp|3gpp)$/i;

/** MIME normalizado para Blob/S3 (lista fechada no servidor). */
export function resolveVideoContentType(file) {
  const raw = String(file?.type || "").toLowerCase().split(";")[0].trim();
  const name = String(file?.name || "").toLowerCase();

  if (raw === "video/mp4" || raw === "video/webm" || raw === "video/quicktime") return raw;
  /* Telemóveis / WhatsApp às vezes mandam application/mp4 ou vazio. */
  if (raw === "application/mp4" || raw === "audio/mp4") return "video/mp4";
  if (raw === "video/x-m4v" || /\.m4v$/i.test(name)) return "video/mp4";
  if (raw === "video/3gpp" || raw === "video/3gpp2" || /\.3gpp?$/i.test(name)) return "video/mp4";
  if (/\.mov$/i.test(name)) return "video/quicktime";
  if (/\.webm$/i.test(name)) return "video/webm";
  if (/\.mp4$/i.test(name)) return "video/mp4";
  if (!raw || raw === "application/octet-stream" || raw === "binary/octet-stream") {
    if (/\.mov$/i.test(name)) return "video/quicktime";
    if (/\.webm$/i.test(name)) return "video/webm";
    return "video/mp4";
  }
  if (raw.startsWith("video/")) return "video/mp4";
  /* MIME estranho: confiar na extensão, senão MP4. */
  if (/\.(mp4|m4v|3gpp?)$/i.test(name)) return "video/mp4";
  if (/\.mov$/i.test(name)) return "video/quicktime";
  if (/\.webm$/i.test(name)) return "video/webm";
  return "video/mp4";
}

/**
 * MIME estável para uploads.
 * Clipes grandes: NÃO recriar File (iOS/Android podem falhar / OOM de forma intermitente).
 * O contentType enviado a S3/Blob vem de resolveVideoContentType().
 */
export function withNormalizedVideoType(file) {
  if (!file) return file;
  const type = resolveVideoContentType(file);
  const name = file.name && /\.[a-z0-9]{2,5}$/i.test(file.name)
    ? file.name
    : `video.${type === "video/webm" ? "webm" : type === "video/quicktime" ? "mov" : "mp4"}`;
  if (file.type === type && file.name === name) return file;
  if (file.size > 2_000_000) return file;
  try {
    return new File([file], name, {
      type,
      lastModified: file.lastModified || Date.now(),
    });
  } catch {
    return file;
  }
}

export function looksLikeVideoUpload(file) {
  if (!file) return false;
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("video/")) {
    if (type === "video/ogg") return false;
    return true;
  }
  const name = (file.name || "").toLowerCase();
  if (!type || type === "application/octet-stream") {
    return VIDEO_EXT.test(name);
  }
  return VIDEO_EXT.test(name);
}

export function looksLikeImageUpload(file) {
  if (!file) return false;
  const type = (file.type || "");
  if (type.startsWith("image/")) return true;
  if (type.startsWith("video/")) return false;
  // Also accept HEIC/HEIF by extension (Samsung saves HEIF as .jpg sometimes)
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "");
}

export function validateVideoUpload(file, t, { maxBytes = MAX_VIDEO_USER_BYTES } = {}) {
  if (!file) {
    return { ok: false, message: t("vid_edit_err_video") };
  }
  if (!looksLikeVideoUpload(file)) {
    return { ok: false, message: t("vid_err_invalid_type") };
  }
  if (file.size > maxBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    const key = maxBytes > MAX_VIDEO_USER_BYTES ? "vid_err_source_too_large" : "vid_err_too_large";
    return { ok: false, message: t(key, { size: sizeMb, max: maxMb }) };
  }
  return { ok: true, message: null };
}

export function readVideoDurationSeconds(file, { timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined" || !file) {
      reject(new Error("no_dom"));
      return;
    }
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    let settled = false;
    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      v.onloadedmetadata = null;
      v.onerror = null;
      v.removeAttribute("src");
      v.load();
      fn();
    };
    const timer = setTimeout(() => {
      finish(() => reject(new Error("duration_timeout")));
    }, Math.max(1500, Number(timeoutMs) || 8000));
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.onloadedmetadata = () => {
      const dur = Number(v.duration || 0);
      finish(() => resolve(Number.isFinite(dur) && dur > 0 ? dur : 0));
    };
    v.onerror = () => finish(() => reject(new Error("duration_read_failed")));
    v.src = url;
  });
}

export function validateImageUpload(file, t) {
  if (!file) {
    return { ok: false, message: t("common_upload_first") };
  }
  if (looksLikeVideoUpload(file)) {
    return { ok: false, message: t("vid_err_use_video_zone") };
  }
  if (!looksLikeImageFile(file) && !looksLikeImageUpload(file)) {
    return { ok: false, message: t("img_err_invalid_type") };
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return { ok: false, message: t("img_err_too_large") };
  }
  return { ok: true, message: null };
}
