import { looksLikeVideoFile } from "./imageCompress";
import { readFileBytes, revokeFilePreviewUrl } from "./previewDataUrl";

function mimeForFile(file) {
  const t = (file?.type || "").toLowerCase();
  if (t && t.startsWith("image/") && t !== "application/octet-stream") return t;
  const n = file?.name || "";
  if (/\.png$/i.test(n)) return "image/png";
  if (/\.webp$/i.test(n)) return "image/webp";
  if (/\.gif$/i.test(n)) return "image/gif";
  if (/\.(heic|heif)$/i.test(n)) return "image/heic";
  return "image/jpeg";
}

function safeName(file) {
  const n = (file?.name || "").trim();
  if (n && /\./.test(n)) return n;
  const ext = mimeForFile(file) === "image/png" ? "png" : "jpg";
  return `photo-${Date.now()}.${ext}`;
}

/**
 * Copia bytes para memória — no Android o File do <input> pode ficar ilegível depois.
 */
export async function stabilizePickedImageFile(file, { attempts = 5 } = {}) {
  const buf = await readFileBytes(file, { attempts, allowCanvas: true });
  if (!buf?.byteLength) throw new Error("empty");

  const stable = new File([buf], safeName(file), {
    type: mimeForFile(file),
    lastModified: Date.now(),
  });

  const dataUrl = URL.createObjectURL(stable);
  return { file: stable, dataUrl, previewIsBlob: true };
}

export async function stabilizePickedVideoFile(file) {
  const buf = await readFileBytes(file, { attempts: 4 });
  if (!buf?.byteLength) throw new Error("empty");
  const stable = new File([buf], file.name || "video.mp4", {
    type: file.type || "video/mp4",
    lastModified: Date.now(),
  });
  return { file: stable, objectUrl: URL.createObjectURL(stable) };
}

export function releaseStabilizedPreview(dataUrl, previewIsBlob) {
  if (previewIsBlob) revokeFilePreviewUrl(dataUrl);
}
