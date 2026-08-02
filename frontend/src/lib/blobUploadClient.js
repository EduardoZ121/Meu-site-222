/**

 * Upload de media para nuvem (S3 preferido quando configurado; Blob multipart; proxy Vercel só ≤ ~3.2 MB).

 */

import { VERCEL_BLOB_DISABLED } from "./blobDisabled";

import { formatHttpError } from "./uploadErrors";

import { isBrowserOnlineFlag } from "./uploadReachability";

import { isRemakePixSiteHost } from "./canonicalOrigin";

import { resolveVideoContentType, withNormalizedVideoType } from "./videoMedia";

import { VIDEO_VERCEL_SAFE_BYTES } from "./uploadConstants";



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

let s3UploadEnabledCache = null;

let s3UploadEnabledCacheAt = 0;



/** Positivo: mantém-se muito tempo — não “desligar” por um probe falhado. */

const POSITIVE_CACHE_TTL_MS = 30 * 60 * 1000;

/** Negativo definitivo (s3/blob off): revalidar mais cedo. */

const NEGATIVE_CACHE_TTL_MS = 2 * 60 * 1000;



export function invalidateBlobUploadCache() {

  blobUploadEnabledCache = null;

  blobUploadEnabledCacheAt = 0;

  s3UploadEnabledCache = null;

  s3UploadEnabledCacheAt = 0;

}



function cacheFresh(value, cachedAt) {

  if (value === null || cachedAt == null) return false;

  const ttl = value === true ? POSITIVE_CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS;

  return (Date.now() - cachedAt) < ttl;

}



function isLikelyMobileClient() {

  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";

  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;

  try {

    return Number(navigator.maxTouchPoints || 0) > 1 && window.innerWidth < 920;

  } catch {

    return false;

  }

}



/** Timeouts mais generosos em telemóvel (rede/CPU lentos). */

function scaleUploadTimeoutMs(ms) {

  const base = Math.max(30_000, Number(ms) || 120_000);

  if (!isLikelyMobileClient()) return base;

  return Math.min(900_000, Math.round(base * 1.6));

}



export async function isBlobUploadEnabled(opts = {}) {

  if (VERCEL_BLOB_DISABLED) {

    blobUploadEnabledCache = false;

    blobUploadEnabledCacheAt = Date.now();

    return false;

  }

  if (!opts.refresh && cacheFresh(blobUploadEnabledCache, blobUploadEnabledCacheAt)) {

    return blobUploadEnabledCache === true;

  }

  if (typeof window === "undefined" || typeof fetch === "undefined") return false;

  try {

    const r = await fetch(joinApiPath("/blob/status"), { method: "GET", credentials: "same-origin" });

    if (!r.ok) {

      /* falha transitória: manter positivo anterior; nunca gravar “off” */

      return blobUploadEnabledCache === true;

    }

    const j = await r.json();

    const on = Boolean(j.blob) && !j.blob_disabled;

    blobUploadEnabledCache = on;

    blobUploadEnabledCacheAt = Date.now();

    return on;

  } catch {

    return blobUploadEnabledCache === true;

  }

}



/** Upload directo browser→S3 (presign) — vídeos grandes quando S3 está configurado. */

export async function isS3UploadEnabled(opts = {}) {

  if (!opts.refresh && cacheFresh(s3UploadEnabledCache, s3UploadEnabledCacheAt)) {

    return s3UploadEnabledCache === true;

  }

  if (typeof window === "undefined" || typeof fetch === "undefined") return false;

  try {

    const r = await fetch(joinApiPath("/upload/s3/status"), { method: "GET", credentials: "same-origin" });

    if (!r.ok) {

      return s3UploadEnabledCache === true;

    }

    const j = await r.json();

    const on = Boolean(j.s3) && !j.disabled;

    s3UploadEnabledCache = on;

    s3UploadEnabledCacheAt = Date.now();

    return on;

  } catch {

    return s3UploadEnabledCache === true;

  }

}



function withTimeout(promise, ms, label = "Operação") {

  const limit = scaleUploadTimeoutMs(ms);

  let timer;

  const timeoutPromise = new Promise((_, reject) => {

    timer = setTimeout(

      () => reject(new Error(`${label} demorou demasiado (${Math.round(limit / 1000)}s).`)),

      limit,

    );

  });

  return Promise.race([promise, timeoutPromise]).finally(() => {

    if (timer) clearTimeout(timer);

  });

}



function sleep(ms) {

  return new Promise((r) => setTimeout(r, ms));

}



function isRetryableUploadError(err) {

  if (!err) return false;

  if (err.code === "ERR_NETWORK" || err.code === "ECONNABORTED") return true;

  if (err.name === "AbortError") return true;

  const status = err?.response?.status;

  if (status === 400 || status === 401 || status === 403 || status === 413 || status === 404) {

    return false;

  }

  const msg = String(err.message || err);

  if (/não configurado|not configured|formato inválido|unsupported|too large|demasiado grande/i.test(msg)) {

    return false;

  }

  if (status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {

    return true;

  }

  return /fetch|network|failed|timeout|abort|demorou|Load failed|Failed to fetch|indispon|503|502|504|429/i.test(msg);

}



async function withRetries(fn, { attempts = 3, label = "upload" } = {}) {

  let lastErr;

  for (let i = 0; i < attempts; i += 1) {

    try {

      return await fn(i);

    } catch (err) {

      lastErr = err;

      if (!isRetryableUploadError(err) || i === attempts - 1) throw err;

      /* Não invalidar cache de status aqui — um falhanço de rede ≠ S3/Blob “off”. */

      await sleep(700 * (2 ** i) + Math.floor(Math.random() * 400));

    }

  }

  throw lastErr || new Error(`${label} falhou.`);

}



async function blobPrepare(filename, kind, timeoutMs) {

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("rp_token") : null;

  const controller = new AbortController();

  const tid = setTimeout(() => controller.abort(), scaleUploadTimeoutMs(timeoutMs));

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

      const err = new Error(detail);

      err.response = { status: res.status, data };

      throw err;

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



/** Vídeo → Blob directo no browser (multipart sempre). */

async function uploadVideoDirectToBlob(file, opts = {}) {

  const { upload } = await import("@vercel/blob/client");

  const pathname = safeVideoPathname(file);

  if (opts.onProgress) opts.onProgress(0);

  const contentType = resolveVideoContentType(file);

  const result = await withTimeout(

    upload(pathname, file, {

      access: "public",

      handleUploadUrl: joinApiPath("/video/upload"),

      clientPayload: authClientPayload(),

      contentType,

      multipart: true,

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

    throw err;

  }

  const { clientToken, pathname } = data || {};

  if (!clientToken || !pathname) {

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

  const timeoutMs = scaleUploadTimeoutMs(opts.timeoutMs ?? 120_000);

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

  const timeoutMs = scaleUploadTimeoutMs(opts.timeoutMs ?? 600_000);

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



/** Só clips pequenos cabem no proxy Vercel (~4.5 MB body). */

const VIDEO_SERVER_PROXY_MAX = VIDEO_VERCEL_SAFE_BYTES;



/** Vídeo → S3 via URL presignada (browser PUT directo, até 200 MB). */

async function uploadVideoViaS3Presign(file, opts = {}) {

  const timeoutMs = scaleUploadTimeoutMs(opts.timeoutMs ?? 600_000);

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("rp_token") : null;

  const contentType = resolveVideoContentType(file);

  const controller = new AbortController();

  const tid = setTimeout(() => controller.abort(), Math.min(timeoutMs, 90_000));

  let presign;

  try {

    const res = await fetch(joinApiPath("/upload/s3/presign-video"), {

      method: "POST",

      credentials: "same-origin",

      signal: controller.signal,

      headers: {

        "Content-Type": "application/json",

        ...(token ? { Authorization: `Bearer ${token}` } : {}),

      },

      body: JSON.stringify({

        filename: file.name || "video.mp4",

        contentType,

        contentLength: file.size,

      }),

    });

    presign = await res.json().catch(() => ({}));

    if (!res.ok) {

      const err = new Error(typeof presign.detail === "string" ? presign.detail : "Upload S3 indisponível.");

      err.response = { status: res.status, data: presign };

      throw err;

    }

  } finally {

    clearTimeout(tid);

  }



  const uploadUrl = presign.uploadUrl;

  const publicUrl = presign.publicUrl;

  if (!uploadUrl || !publicUrl) {

    throw new Error("Resposta inválida do servidor (S3).");

  }



  return new Promise((resolve, reject) => {

    const xhr = new XMLHttpRequest();

    xhr.open(presign.method || "PUT", uploadUrl);

    xhr.timeout = timeoutMs;

    const headers = presign.headers && typeof presign.headers === "object" ? presign.headers : {};

    Object.entries(headers).forEach(([k, v]) => {

      if (v != null) xhr.setRequestHeader(k, String(v));

    });

    if (opts.onProgress) opts.onProgress(0);

    xhr.upload.onprogress = (e) => {

      if (e.lengthComputable && opts.onProgress) {

        opts.onProgress(Math.round((e.loaded / e.total) * 100));

      }

    };

    xhr.onload = () => {

      if (xhr.status >= 200 && xhr.status < 300) {

        if (opts.onProgress) opts.onProgress(100);

        resolve(String(publicUrl));

        return;

      }

      const err = new Error(

        xhr.status === 403

          ? "Upload rejeitado pela nuvem (CORS ou tipo de ficheiro). Tenta outra vez ou exporta em MP4."

          : `Upload S3 falhou (HTTP ${xhr.status}).`,

      );

      err.response = { status: xhr.status };

      reject(err);

    };

    xhr.onerror = () => {

      const err = new Error(

        isBrowserOnlineFlag()

          ? "Falhou o envio do vídeo para a nuvem. Tenta outra vez."

          : "Sem ligação à rede.",

      );

      err.code = "ERR_NETWORK";

      reject(err);

    };

    xhr.ontimeout = () => {

      const err = new Error("Timeout ao enviar o vídeo para a nuvem. Mantém a rede ligada e tenta outra vez.");

      err.code = "ECONNABORTED";

      reject(err);

    };

    xhr.send(file);

  });

}



/** Imagem grande → URL pública no Blob (browser ou proxy servidor). */

export async function uploadImageToCloud(file, opts = {}) {

  if (!file) throw new Error("Imagem em falta.");

  if (VERCEL_BLOB_DISABLED) {

    throw new Error("Blob desligado. Comprime a foto ou ativa BLOB_READ_WRITE_TOKEN na Vercel.");

  }

  const blobOn = await isBlobUploadEnabled({ refresh: !cacheFresh(blobUploadEnabledCache, blobUploadEnabledCacheAt) });

  if (!blobOn && blobUploadEnabledCache === false) {

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



/**

 * Vídeo → nuvem com caminho definitivo:

 * 1) S3 só se status positivo (sticky) — nunca forçar S3 quando sabemos que está off

 * 2) Vercel Blob multipart (caminho principal em remakepix.com hoje)

 * 3) Proxy servidor só se ≤ ~3.2 MB (limite Vercel) — nunca para vídeos grandes

 * Retry com backoff em falhas de rede (sem invalidar cache de disponibilidade).

 */

export async function uploadVideoToCloud(file, opts = {}) {

  if (!file) throw new Error("Vídeo em falta.");

  const sessionToken = typeof localStorage !== "undefined" ? localStorage.getItem("rp_token") : null;
  if (!sessionToken) {
    const err = new Error("Não autenticado.");
    err.response = { status: 401, data: { detail: "Não autenticado." } };
    throw err;
  }

  const normalized = withNormalizedVideoType(file);

  const canProxy = normalized.size <= VIDEO_SERVER_PROXY_MAX;

  const needRefresh = !cacheFresh(blobUploadEnabledCache, blobUploadEnabledCacheAt)

    || !cacheFresh(s3UploadEnabledCache, s3UploadEnabledCacheAt);



  const [blobOn, s3On] = await Promise.all([

    VERCEL_BLOB_DISABLED ? Promise.resolve(false) : isBlobUploadEnabled({ refresh: needRefresh }),

    isS3UploadEnabled({ refresh: needRefresh }),

  ]);



  /**

   * Sticky positivo apenas.

   * - true → tentar

   * - false → não tentar (S3 off em produção)

   * - null (probe falhou, sem histórico) → tentar Blob; S3 só se nunca soubemos que está off

   */

  const tryS3 = s3On === true || s3UploadEnabledCache === true;

  const tryBlob = !VERCEL_BLOB_DISABLED && (

    blobOn === true

    || blobUploadEnabledCache === true

    || blobUploadEnabledCache !== false

  );



  const errors = [];

  const timeoutMs = scaleUploadTimeoutMs(opts.timeoutMs ?? 600_000);

  const runOpts = { ...opts, timeoutMs };



  /* Blob primeiro quando S3 está explicitamente off — evita 1–3 idas inúteis ao presign. */

  const order = tryS3 && s3UploadEnabledCache !== false && s3On

    ? ["s3", "blob", "proxy"]

    : tryS3

      ? ["blob", "s3", "proxy"]

      : ["blob", "proxy"];



  for (const step of order) {

    if (step === "s3" && tryS3) {

      try {

        return await withRetries(

          () => uploadVideoViaS3Presign(normalized, runOpts),

          { attempts: 3, label: "S3" },

        );

      } catch (s3Err) {

        errors.push(s3Err);

      }

    }

    if (step === "blob" && tryBlob) {

      try {

        return await withRetries(

          () => uploadVideoDirectToBlob(normalized, runOpts),

          { attempts: 3, label: "Blob" },

        );

      } catch (blobErr) {

        errors.push(blobErr);

      }

    }

    if (step === "proxy" && canProxy) {

      try {

        return await withRetries(

          () => uploadVideoViaServerProxy(normalized, runOpts),

          { attempts: 2, label: "proxy" },

        );

      } catch (proxyErr) {

        errors.push(proxyErr);

      }

    }

  }



  const last = errors[errors.length - 1];

  if (!tryS3 && !tryBlob && !canProxy) {

    throw new Error(

      "Nuvem indisponível para este vídeo. Recarrega (Ctrl+F5) ou usa um clip mais curto (até ~3 MB).",

    );

  }

  if (!canProxy && errors.length) {

    throw new Error(

      formatHttpError(last, "Upload do vídeo falhou. Mantém a rede ligada e toca em «Tentar upload outra vez».", {

        context: "video_upload",

      }),

    );

  }

  throw new Error(

    formatHttpError(last || new Error("Upload do vídeo falhou."), "Upload do vídeo falhou.", {

      context: "video_upload",

    }),

  );

}


