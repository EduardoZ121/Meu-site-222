/** Limites e validação de media — imagem vs vídeo (nunca misturar mensagens). */

import { looksLikeImageFile } from "./imageCompress";
import { MAX_IMAGE_PICKER_BYTES, MAX_VIDEO_USER_BYTES, VIDEO_VERCEL_SAFE_BYTES } from "./uploadConstants";

export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_PICKER_BYTES;

export const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_USER_BYTES;
export { VIDEO_VERCEL_SAFE_BYTES };

export const IMAGE_UPLOAD_ACCEPT =
  "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";

export const VIDEO_UPLOAD_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";

const VIDEO_EXT = /\.(mp4|mov)$/i;

export function looksLikeVideoUpload(file) {
  if (!file) return false;
  const type = (file.type || "").toLowerCase();
  if (type === "video/mp4" || type === "video/quicktime") return true;
  if (type === "video/webm") return false;
  const name = (file.name || "").toLowerCase();
  return VIDEO_EXT.test(name);
}

export function looksLikeImageUpload(file) {
  if (!file) return false;
  const type = (file.type || "");
  if (type.startsWith("image/")) return true;
  if (type.startsWith("video/")) return false;
  return /\.(jpe?g|png|webp)$/i.test(file.name || "");
}

export function validateVideoUpload(file, t) {
  if (!file) {
    return { ok: false, message: t("vid_edit_err_video") };
  }
  if (!looksLikeVideoUpload(file)) {
    return { ok: false, message: t("vid_err_invalid_type") };
  }
  if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
    return { ok: false, message: t("vid_err_too_large") };
  }
  return { ok: true, message: null };
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
