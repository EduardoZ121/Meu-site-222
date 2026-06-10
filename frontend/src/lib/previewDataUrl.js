/**
 * Leitura de ficheiros no browser — vários métodos (Android falha muitas vezes só com arrayBuffer).
 */

import { isAndroid, isIOS } from "./device";

function delay(ms) {
  return new Promise((r) => { setTimeout(r, ms); });
}

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("no file"));
      return;
    }
    const r = new FileReader();
    r.onerror = () => reject(r.error || new Error("FileReader"));
    r.onload = () => {
      if (r.result instanceof ArrayBuffer) resolve(r.result);
      else reject(new Error("buffer"));
    };
    r.readAsArrayBuffer(file);
  });
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const r = new FileReader();
    r.onerror = () => reject(r.error || new Error("FileReader"));
    r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
    r.readAsDataURL(file);
  });
}

async function readViaObjectUrlFetch(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch");
    const buf = await res.arrayBuffer();
    if (!buf?.byteLength) throw new Error("empty");
    return buf;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function readViaDataUrlFetch(file) {
  const dataUrl = await readFileAsDataURL(file);
  if (!dataUrl) throw new Error("dataurl");
  const res = await fetch(dataUrl);
  const buf = await res.arrayBuffer();
  if (!buf?.byteLength) throw new Error("empty");
  return buf;
}

/** Último recurso para imagens quando bytes não são legíveis (galeria Android). */
async function readImageViaCanvas(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("img"));
      el.src = url;
    });
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) throw new Error("dim");
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ctx");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.92);
    });
    return readViaObjectUrlFetch(blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function readFileBytesOnce(file, { allowCanvas = false } = {}) {
  if (!file) throw new Error("no file");

  const strategies = [];

  if (typeof file.arrayBuffer === "function") {
    strategies.push(async () => {
      const buf = await file.arrayBuffer();
      if (!buf?.byteLength) throw new Error("empty");
      return buf;
    });
  }

  strategies.push(() => readFileAsArrayBuffer(file));
  strategies.push(() => readViaObjectUrlFetch(file));

  if (typeof file.slice === "function") {
    const slice = file.slice(0, file.size || undefined, file.type || "application/octet-stream");
    strategies.push(() => readViaObjectUrlFetch(slice));
    strategies.push(() => readFileAsArrayBuffer(slice));
  }

  strategies.push(() => readViaDataUrlFetch(file));

  if (allowCanvas && typeof document !== "undefined") {
    strategies.push(() => readImageViaCanvas(file));
  }

  let lastErr;
  for (const run of strategies) {
    try {
      const buf = await run();
      if (buf?.byteLength) return buf;
      lastErr = new Error("empty");
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("read");
}

/**
 * Lê bytes do ficheiro com retries e vários métodos (crítico no Android).
 * @param {File|Blob} file
 * @param {{ attempts?: number, allowCanvas?: boolean }} opts
 */
export async function readFileBytes(file, { attempts = 4, allowCanvas = false } = {}) {
  let lastErr;
  const tries = Math.max(1, attempts);
  const useCanvas = allowCanvas || isAndroid() || isIOS();

  for (let i = 0; i < tries; i += 1) {
    try {
      const buf = await readFileBytesOnce(file, { allowCanvas: useCanvas });
      if (buf?.byteLength) return buf;
      lastErr = new Error("empty");
    } catch (err) {
      lastErr = err;
    }
    if (i < tries - 1) await delay(100 * (i + 1));
  }
  throw lastErr || new Error("read");
}

export function revokeFilePreviewUrl(url) {
  try {
    if (url && String(url).startsWith("blob:")) URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}

export function attachFileObjectPreview(file, urlRef) {
  const prev = urlRef?.current;
  if (!file) {
    revokeFilePreviewUrl(prev);
    if (urlRef) urlRef.current = null;
    return null;
  }
  const next = URL.createObjectURL(file);
  if (urlRef) urlRef.current = next;
  if (prev && prev !== next) revokeFilePreviewUrl(prev);
  return next;
}
