import { toast } from "sonner";
import { isIOS } from "./device";
import { compressImageNeverFail } from "./canvasCompress";

const HEIC_EXTENSIONS = /\.(heic|heif)$/i;
export const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i;
export const IMAGE_ACCEPT =
  "image/*,image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif";

export function looksLikeImageFile(file) {
  if (!file) return false;
  const t = file.type || "";
  if (t.startsWith("image/")) return true;
  if (/^application\/octet-stream$/i.test(t) && IMAGE_EXTENSIONS.test(file.name || "")) return true;
  return IMAGE_EXTENSIONS.test(file.name || "");
}

export const VIDEO_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function looksLikeVideoFile(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("video/")) return true;
  const n = (file.name || "").toLowerCase();
  return n.endsWith(".mp4") || n.endsWith(".mov") || n.endsWith(".webm");
}

function mimeFromName(name = "") {
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  if (/\.gif$/i.test(name)) return "image/gif";
  if (/\.bmp$/i.test(name)) return "image/bmp";
  if (/\.avif$/i.test(name)) return "image/avif";
  return "";
}

export function normalizeImageFile(file) {
  if (!file) return file;
  const t = file.type || "";
  if (t && t !== "application/octet-stream") return file;
  const inferred = mimeFromName(file.name);
  if (!inferred) return file;
  return new File([file], file.name, { type: inferred, lastModified: file.lastModified || Date.now() });
}

function formatSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compressão com canvas (nunca bloqueia: em último caso devolve o original).
 * @param {File} file
 * @param {object} [opts]
 * @param {number} [opts.maxSize] — lado máximo (px)
 * @param {number} [opts.maxBytes] — teto bytes (desktop)
 * @param {number} [opts.maxBytesIOS] — teto bytes iOS
 * @param {boolean} [opts.force] — não saltar ficheiros pequenos
 */
export async function compressImage(file, opts = {}) {
  if (!file) throw new Error("Nenhum ficheiro selecionado.");
  if (!looksLikeImageFile(file)) {
    throw new Error("Ficheiro tem de ser uma imagem: JPEG, PNG, WEBP, AVIF, BMP ou GIF.");
  }

  let work = normalizeImageFile(file);
  if (HEIC_EXTENSIONS.test(work.name) && !/^image\//i.test(work.type || "")) {
    work = new File([work], work.name, { type: "image/heic", lastModified: work.lastModified || Date.now() });
  }

  const before = work.size;
  const ios = isIOS();
  const maxMB = opts.maxSizeMB != null ? Number(opts.maxSizeMB) : ios ? 1.5 : 2;
  const maxBytes = opts.maxBytes != null ? Number(opts.maxBytes) : maxMB * 1024 * 1024;
  const maxBytesIOS = opts.maxBytesIOS != null ? Number(opts.maxBytesIOS) : 1.5 * 1024 * 1024;
  const maxDim = Math.min(Number(opts.maxSize) || 2048, 2048);

  if (!opts.force && before < 48 * 1024 && /^image\/(jpeg|png|webp)$/i.test(work.type || "")) {
    return work;
  }

  const tid = toast.loading(`A otimizar… ${formatSize(before)}`);
  const out = await compressImageNeverFail(work, {
    maxSize: maxDim,
    maxBytes,
    maxBytesIOS,
  });
  if (HEIC_EXTENSIONS.test(work.name || "") && out === work) {
    toast.warning(
      "HEIC pode não abrir neste browser. Se falhar, exporta JPEG no iPhone (Câmara → Formatos → Mais compatível).",
      { id: tid, duration: 6000 },
    );
    return out;
  }
  toast.success(`A otimizar… ${formatSize(before)} → ${formatSize(out.size)}`, { id: tid, duration: 4000 });
  return out;
}
