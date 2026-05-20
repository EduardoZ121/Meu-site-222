import { isIOS } from "./device";

/**
 * Compressão só com canvas. Pode falhar em imagens corruptas / limites de memória.
 * @returns {Promise<File>}
 */
export async function compressWithCanvas(file, options = {}) {
  const maxSide = Math.min(Number(options.maxSize) || 2048, 4096);
  const maxBytes = isIOS()
    ? Number(options.maxBytesIOS) || 1.5 * 1024 * 1024
    : Number(options.maxBytes) || 2 * 1024 * 1024;

  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error || new Error("read"));
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.decoding = "async";
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("decode"));
    i.src = dataUrl;
  });

  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (!w || !h) throw new Error("dim");

  const scale0 = Math.max(w, h) > maxSide ? maxSide / Math.max(w, h) : 1;
  w = Math.max(1, Math.round(w * scale0));
  h = Math.max(1, Math.round(h * scale0));

  const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");

  const encode = (cw, ch, q) => new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    canvas.toBlob((b) => resolve(b), "image/jpeg", q);
  });

  let q = 0.88;
  let cw = w;
  let ch = h;

  for (let iter = 0; iter < 36; iter += 1) {
    // eslint-disable-next-line no-await-in-loop
    const blob = await encode(cw, ch, q);
    if (blob && blob.size <= maxBytes) {
      return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
    }
    if (q > 0.48) {
      q = Math.max(0.45, q - 0.045);
    } else {
      cw = Math.max(280, Math.round(cw * 0.86));
      ch = Math.max(280, Math.round(ch * 0.86));
      q = 0.82;
    }
  }

  const last = await encode(cw, ch, 0.42);
  if (last && last.size <= maxBytes * 1.2) {
    return new File([last], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  }
  throw new Error("compress");
}

/** Nunca bloqueia: tenta canvas; em falha devolve o ficheiro original. */
export async function compressImageNeverFail(file, options = {}) {
  if (!file || !(file instanceof Blob)) return file;
  try {
    return await compressWithCanvas(file, options);
  } catch {
    return file instanceof File ? file : new File([file], "upload.bin", { type: file.type || "application/octet-stream" });
  }
}
