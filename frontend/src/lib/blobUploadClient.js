/**
 * Vercel Blob — só para ficheiros grandes ou fallback de rede.
 * Imagens normais: comprimir na caixa com brilho + POST directo.
 */
import { VERCEL_BLOB_DISABLED } from "./blobDisabled";
import { formatHttpError } from "./uploadErrors";
import { isBrowserOnlineFlag } from "./uploadReachability";
import { isRemakePixSiteHost } from "./canonicalOrigin";
function joinApiPath(path) {
  if (typeof window !== "undefined" && isRemakePixSiteHost(window.location.hostname)) {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `/api${p}`;
  }
  const raw = String(process.env.REACT_APP_BACKEND_URL || "").trim().replace(/\/$/, "");
  const base = raw && !(typeof window !== "undefined" && window.location?.protocol === "https:" && raw.startsWith("http:"))
    ? `${raw.replace(/\/$/, "")}/api`
    : "/api";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${p}`;
}

let blobUploadEnabledCache = null;
let blobUploadEnabledCacheAt = 0;
const BLOB_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — evita que um valor stale persista durante toda a sessão

export function invalidateBlobUploadCache() {
  blobUploadEnabledCache = null;
  blobUploadEnabledCacheAt = 0;
}

export async function isBlobUploadEnabled(opts = {}) {
  if (VERCEL_BLOB_DISABLED) {
    blobUploadEnabledCache = false;
    blobUploadEnabledCacheAt = Date.now();
    return false;
  }
  const fresh = (Date.now() - blobUploadEnabledCacheAt) < BLOB_CACHE_TTL_MS;
  if (!opts.refresh && blobUploadEnabledCache !== null && fresh) return blobUploadEnabledCache;
  if (typeof window === "undefined" || typeof fetch === "undefined") return false;
  try {
    const r = await fetch(joinApiPath("/blob/status"), { method: "GET", credentials: "same-origin" });
    if (!r.ok) return false;
    const j = await r.json();
    blobUploadEnabledCache = Boolean(j.blob) && !j.blob_disabled;
    blobUploadEnabledCacheAt = Date.now();
    return blobUploadEnabledCache;
  } catch {
    return false;
  }
}

function withTimeout(promise, ms, label = "Operação") {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} demorou demasiado (${Math.round(ms / 1000)}s).`)), ms);
    }),
  ]);
}

async function blobPrepare(filename, kind, timeoutMs) {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("rp_token") : null;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(joinApiPath("/blob/prepare"), {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ filename, kind }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = typeof data.detail === "string" ? data.detail : "Blob indisponível.";
      throw new Error(detail);
    }
    return data;
  } finally {
    clearTimeout(tid);
  }
}

function authClientPayload() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("rp_token") : null;
  return token ? JSON.stringify({ token }) : undefined;
}

function mapUploadProgress(onProgress) {
  if (!onProgress) return undefined;
  return (ev) => {
    const pct = Number(ev?.percentage);
    if (Number.isFinite(pct)) onProgress(Math.round(pct));
    else if (ev?.loaded && ev?.total) onProgress(Math.round((ev.loaded / ev.total) * 100));
  };
}

function safeVideoPathname(file) {
  const base = String(file?.name || "video.mp4").replace(/[^\w.\-]+/g, "_").slice(0, 80);
  return `rp/${Date.now()}-${base}`;
}

/** Vídeo → Blob directo no browser (sem passar pelo body da função serverless). */
async function uploadVideoDirectToBlob(file, opts = {}) {
  const { upload } = await import("@vercel/blob/client");
  const pathname = safeVideoPathname(file);
  const result = await withTimeout(
    upload(pathname, file, {
      access: "public",
      handleUploadUrl: joinApiPath("/video/upload"),
      clientPayload: authClientPayload(),
      contentType: file.type || "video/mp4",
      multipart: file.size > 8_000_000,
      onUploadProgress: mapUploadProgress(opts.onProgress),
    }),
    opts.timeoutMs ?? 600_000,
    "Upload do vídeo (nuvem)",
  );
  return result.url;
}

async function uploadFileToVercelBlob(key, fileLike, perFileMs, onProgress) {
  const { put } = await import("@vercel/blob/client");
  const isVideo = key === "video";
  if (isVideo) {
    const url = await uploadVideoDirectToBlob(fileLike, { timeoutMs: perFileMs, onProgress });
    return { url };
  }
  let data;
  try {
    data = await blobPrepare(
      fileLike.name || "upload.jpg",
      undefined,
      45_000,
    );
  } catch (err) {
    invalidateBlobUploadCache();
    throw err;
  }
  const { clientToken, pathname } = data || {};
  if (!clientToken || !pathname) {
    invalidateBlobUploadCache();
    throw new Error("Armazenamento em nuvem indisponível. Tenta um ficheiro mais pequeno ou mais tarde.");
  }
  return withTimeout(
    put(pathname, fileLike, {
      access: "public",
      token: clientToken,
      contentType: fileLike.type || "image/jpeg",
      multipart: fileLike.size > 4_500_000,
      onUploadProgress: mapUploadProgress(onProgress),
    }),
    perFileMs,
    "Upload em nuvem",
  );
}

export function uploadImageViaServerProxy(file, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 120_000;
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("photo", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", joinApiPath("/upload/image-blob"));
    xhr.timeout = timeoutMs;
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("rp_token") : null;
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.onload = () => {
      let data = {};
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        data = { detail: xhr.responseText?.slice(0, 200) || "Resposta inválida." };
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) {
        resolve(String(data.url));
        return;
      }
      const err = new Error(typeof data.detail === "string" ? data.detail : "Upload da imagem falhou.");
      err.response = { status: xhr.status, data };
      reject(err);
    };
    xhr.onerror = () => {
      const err = new Error(
        isBrowserOnlineFlag()
          ? "Falhou o envio da imagem. Tenta outra vez ou recarrega (Ctrl+F5)."
          : "Sem ligação à rede.",
      );
      err.code = "ERR_NETWORK";
      reject(err);
    };
    xhr.ontimeout = () => {
      const err = new Error("Timeout ao enviar a imagem.");
      err.code = "ECONNABORTED";
      reject(err);
    };
    xhr.send(fd);
  });
}

function uploadVideoViaServerProxy(file, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 600_000;
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("video", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", joinApiPath("/upload/video-blob"));
    xhr.timeout = timeoutMs;
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("rp_token") : null;
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        data = { detail: xhr.responseText?.slice(0, 200) || "Resposta inválida." };
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) {
        resolve(String(data.url));
        return;
      }
      const err = new Error(typeof data.detail === "string" ? data.detail : "Upload do vídeo falhou.");
      err.response = { status: xhr.status, data };
      reject(err);
    };
    xhr.onerror = () => {
      const err = new Error(
        isBrowserOnlineFlag()
          ? "Falhou o envio do vídeo. Recarrega (Ctrl+F5) ou usa um clip mais curto."
          : "Sem ligação à rede.",
      );
      err.code = "ERR_NETWORK";
      reject(err);
    };
    xhr.ontimeout = () => {
      const err = new Error("Timeout ao enviar o vídeo.");
      err.code = "ECONNABORTED";
      reject(err);
    };
    xhr.send(fd);
  });
}

/** Imagem grande → URL pública no Blob (browser ou proxy servidor). */
export async function uploadImageToCloud(file, opts = {}) {
  if (!file) throw new Error("Imagem em falta.");
  if (VERCEL_BLOB_DISABLED) {
    throw new Error("Blob desligado. Comprime a foto ou ativa BLOB_READ_WRITE_TOKEN na Vercel.");
  }
  invalidateBlobUploadCache();
  const blobOn = await isBlobUploadEnabled({ refresh: true });
  if (!blobOn) {
    return uploadImageViaServerProxy(file, { timeoutMs: opts.timeoutMs ?? 120_000 });
  }
  try {
    const result = await uploadFileToVercelBlob("photo", file, opts.timeoutMs ?? 120_000, opts.onProgress);
    return result.url;
  } catch (directErr) {
    const msg = String(directErr?.message || directErr);
    const tryServer = /fetch|network|failed|nuvem|blob|abort|timeout/i.test(msg)
      || directErr?.code === "ERR_NETWORK";
    if (!tryServer) throw directErr;
    return uploadImageViaServerProxy(file, { timeoutMs: opts.timeoutMs ?? 120_000 });
  }
}

/** Vídeo grande → URL no Blob (browser directo; sem proxy servidor para ficheiros pesados). */
export async function uploadVideoToCloud(file, opts = {}) {
  if (!file) throw new Error("Vídeo em falta.");
  if (VERCEL_BLOB_DISABLED) {
    if (file.size > 50 * 1024 * 1024) {
      throw new Error("Vídeo demasiado grande sem Blob. Ativa BLOB_READ_WRITE_TOKEN na Vercel.");
    }
    return uploadVideoViaServerProxy(file, opts);
  }
  invalidateBlobUploadCache();
  const blobOn = await isBlobUploadEnabled({ refresh: true });
  if (!blobOn) {
    if (file.size > 50 * 1024 * 1024) {
      throw new Error("Nuvem indisponível para vídeos grandes. Verifica BLOB_READ_WRITE_TOKEN na Vercel.");
    }
    return uploadVideoViaServerProxy(file, opts);
  }
  try {
    return await uploadVideoDirectToBlob(file, opts);
  } catch (directErr) {
    throw new Error(formatHttpError(directErr, "Upload do vídeo falhou."));
  }
}
