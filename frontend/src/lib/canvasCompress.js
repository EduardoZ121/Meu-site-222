import { isIOS } from "./device";
import { normalizeImageFile } from "./imageCompress";
import { revokeFilePreviewUrl } from "./previewDataUrl";

/**
 * Compressão só com canvas. Pode falhar em HEIC nalguns browsers.
 * @returns {Promise<File>}
 */
export async function compressWithCanvas(file, options = {}) {
  const maxSide = Math.min(Number(options.maxSize) || 2048, 4096);
  const maxBytes = isIOS()
    ? Number(options.maxBytesIOS) || 1.5 * 1024 * 1024
    : Number(options.maxBytes) || 2 * 1024 * 1024;

  const work = file instanceof File ? normalizeImageFile(file) : file;
  const objUrl = URL.createObjectURL(work);

  let img;
  try {
    img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.decoding = "async";
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("decode"));
      i.src = objUrl;
    });
  } finally {
    revokeFilePreviewUrl(objUrl);
  }

  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (!w || !h) throw new Error("dim");

  const scale0 = Math.max(w, h) > maxSide ? maxSide / Math.max(w, h) : 1;
  w = Math.max(1, Math.round(w * scale0));
  h = Math.max(1, Math.round(h * scale0));

  const baseName = (work.name || "photo").replace(/\.[^.]+$/, "");
  const preferPng = /^image\/png$/i.test(work.type || "") && options.preservePng;

  const encode = (cw, ch, q, mime, quality) => new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d", { alpha: preferPng });
    if (!preferPng) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cw, ch);
    }
    ctx.drawImage(img, 0, 0, cw, ch);
    canvas.toBlob((b) => resolve(b), mime, quality);
  });

  let q = 0.88;
  let cw = w;
  let ch = h;

  for (let iter = 0; iter < 36; iter += 1) {
    // eslint-disable-next-line no-await-in-loop
    const blob = preferPng
      ? await encode(cw, ch, q, "image/png")
      : await encode(cw, ch, q, "image/jpeg", q);
    if (blob && blob.size <= maxBytes) {
      const ext = preferPng ? "png" : "jpg";
      const type = preferPng ? "image/png" : "image/jpeg";
      return new File([blob], `${baseName}.${ext}`, { type, lastModified: Date.now() });
    }
    if (q > 0.48) {
      q = Math.max(0.45, q - 0.045);
    } else {
      cw = Math.max(320, Math.round(cw * 0.86));
      ch = Math.max(320, Math.round(ch * 0.86));
      q = 0.82;
    }
  }

  const last = preferPng
    ? await encode(cw, ch, 0.92, "image/png")
    : await encode(cw, ch, 0.42, "image/jpeg", 0.42);
  if (last && last.size <= maxBytes * 1.25) {
    const ext = preferPng ? "png" : "jpg";
    const type = preferPng ? "image/png" : "image/jpeg";
    return new File([last], `${baseName}.${ext}`, { type, lastModified: Date.now() });
  }
  throw new Error("compress");
}

/** Nunca bloqueia: tenta canvas; em falha devolve o ficheiro normalizado. */
export async function compressImageNeverFail(file, options = {}) {
  if (!file || !(file instanceof Blob)) return file;
  try {
    return await compressWithCanvas(file, options);
  } catch {
    const normalized = file instanceof File
      ? normalizeImageFile(file)
      : normalizeImageFile(new File([file], "upload.jpg", { type: file.type || "image/jpeg" }));
    return normalized;
  }
}
