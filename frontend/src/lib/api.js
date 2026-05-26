import axios from "axios";

import { formatHttpError } from "./uploadErrors";
import { isBrowserOnlineFlag } from "./uploadReachability";
import {
  formDataTotalBlobBytes,
  pickBlobOffloadTimeoutMs,
  VIDEO_VERCEL_SAFE_BYTES,
} from "./uploadConstants";
import { normalizeCreation } from "./creationUrls";
import { notifyCreditsUpdate, notifyGenerationComplete } from "./notifyUser";

/** Evita mixed content: página em https + backend em http → o browser bloqueia e parece "Network Error". */
function resolveBaseUrl() {
  const raw = String(process.env.REACT_APP_BACKEND_URL || "").trim().replace(/\/$/, "");
  if (
    typeof window !== "undefined"
    && window.location?.protocol === "https:"
    && raw.startsWith("http:")
  ) {
    return "";
  }
  return raw;
}

const BASE = resolveBaseUrl();
export const API = BASE ? `${BASE}/api` : "/api";

function isLocalToken(token) {
  return token?.startsWith("local:");
}

export function formatApiError(err, fallback = "Falhou.", opts) {
  return formatHttpError(err, fallback, opts);
}

export const api = axios.create({
  baseURL: API,
  timeout: 180000, // 3 min — image generation can take 30–90s
});

function pricingRegionHeaderValue() {
  try {
    const v = localStorage.getItem("rp_pricing_region");
    if (v === "usd" || v === "intl") return v;
  } catch {
    /* ignore */
  }
  return "intl";
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const region = pricingRegionHeaderValue();
  config.headers["X-Pricing-Region"] = region;
  if (config.data instanceof FormData) {
    if (!config.data.has("pricing_region")) config.data.append("pricing_region", region);
  } else if (config.data && typeof config.data === "object" && !Array.isArray(config.data)) {
    config.data = { ...config.data, pricing_region: region };
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    if (!config.timeout || config.timeout < 120000) config.timeout = 120000;
    if (typeof config.maxBodyLength === "undefined") config.maxBodyLength = Infinity;
    if (typeof config.maxContentLength === "undefined") config.maxContentLength = Infinity;
  }
  return config;
});

function joinApiPath(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = (API || "/api").replace(/\/$/, "");
  return `${base}${p}`;
}

/** FormData pode ficar “consumido” após falha em fetch — cada tentativa precisa de uma cópia. */
function cloneFormData(fd) {
  const next = new FormData();
  for (const [key, val] of fd.entries()) {
    next.append(key, val);
  }
  return next;
}

function formDataBlobBytes(fd) {
  let n = 0;
  for (const [, v] of fd.entries()) {
    if (v instanceof Blob) n += v.size;
  }
  return n;
}

/** Timeouts do POST multipart até o servidor devolver prediction_id (não confundir com tempo de geração). */
function pickUploadTimeoutMs(fd) {
  const bytes = formDataBlobBytes(fd);
  if (bytes < 2_000_000) return 90_000;
  if (bytes <= 10_000_000) return 120_000;
  return 180_000;
}

let blobUploadEnabledCache = null;

export function invalidateBlobUploadCache() {
  blobUploadEnabledCache = null;
}

function isVideoFileLike(file) {
  return file?.type?.startsWith?.("video/") || /\.(mp4|mov|webm)$/i.test(file?.name || "");
}

function formDataHasVideoFile(fd) {
  if (!fd?.entries) return false;
  for (const [, v] of fd.entries()) {
    if (v instanceof File && isVideoFileLike(v)) return true;
  }
  return false;
}

function formDataHasLargeVideo(fd) {
  if (!fd?.entries) return false;
  for (const [, v] of fd.entries()) {
    if (!(v instanceof File)) continue;
    if (isVideoFileLike(v) && v.size > VIDEO_DIRECT_MAX) return true;
  }
  return false;
}

function isImageFileLike(file) {
  if (!file) return false;
  if (file.type?.startsWith?.("image/")) return true;
  return /\.(heic|heif|jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name || "");
}

/** Só fotos grandes ou HEIC vão para Blob/S3 — fotos normais vão directo ao /api (mais fiável). */
function imageNeedsCloudOffload(file) {
  if (!file || !isImageFileLike(file)) return false;
  if (file.size > DIRECT_UPLOAD_MAX) return true;
  if (/\.(heic|heif)$/i.test(file.name || "")) return true;
  if (!/^image\/jpe?g$/i.test(file.type || "") && file.size > 1_200_000) return true;
  return false;
}

function formDataNeedsCloudOffload(fd) {
  if (!fd?.entries) return false;
  for (const [, v] of fd.entries()) {
    if (!(v instanceof File)) continue;
    if (isVideoFileLike(v) && v.size > VIDEO_DIRECT_MAX) return true;
    if (imageNeedsCloudOffload(v)) return true;
  }
  return false;
}

export async function isBlobUploadEnabled(opts = {}) {
  if (!opts.refresh && blobUploadEnabledCache !== null) return blobUploadEnabledCache;
  if (typeof window === "undefined" || typeof fetch === "undefined") {
    return false;
  }
  try {
    const r = await fetch(joinApiPath("/blob/status"), { method: "GET", credentials: "same-origin" });
    if (!r.ok) return false;
    const j = await r.json();
    blobUploadEnabledCache = Boolean(j.blob);
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

const BLOB_OFFLOAD_KEYS = new Set(["photo", "image", "mask", "garment", "video", "reference_image"]);
/** Acima disto o vídeo nunca vai no body do serverless — só `video_url` após Blob/S3. */
const VIDEO_DIRECT_MAX = VIDEO_VERCEL_SAFE_BYTES;

async function uploadFileToVercelBlob(key, fileLike, perFileMs, onProgress) {
  const { put } = await import("@vercel/blob/client");
  const isVideo = key === "video";
  let data;
  try {
    ({ data } = await api.post(
      "/blob/prepare",
      {
        filename: fileLike.name || `${key}.${isVideo ? "mp4" : "jpg"}`,
        kind: isVideo ? "video" : undefined,
      },
      { timeout: isVideo ? 90_000 : 45_000 },
    ));
  } catch (err) {
    invalidateBlobUploadCache();
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      throw new Error(detail.trim());
    }
    throw err;
  }
  const { clientToken, pathname } = data || {};
  if (!clientToken || !pathname) {
    invalidateBlobUploadCache();
    throw new Error("Armazenamento em nuvem indisponível. Tenta um ficheiro mais pequeno ou mais tarde.");
  }
  const label = isVideo ? "Upload do vídeo (nuvem)" : "Upload em nuvem";
  try {
    return await withTimeout(
      put(pathname, fileLike, {
        access: "public",
        token: clientToken,
        contentType: fileLike.type || (isVideo ? "video/mp4" : "image/jpeg"),
        multipart: fileLike.size > (isVideo ? 8_000_000 : 4_500_000),
        onUploadProgress: onProgress
          ? (ev) => {
            const pct = Number(ev?.percentage);
            if (Number.isFinite(pct)) onProgress(Math.round(pct));
            else if (ev?.loaded && ev?.total) {
              onProgress(Math.round((ev.loaded / ev.total) * 100));
            }
          }
          : undefined,
      }),
      perFileMs,
      label,
    );
  } catch (err) {
    const msg = String(err?.message || err);
    if (!isVideo && /fetch|network|failed|abort/i.test(msg)) {
      try {
        const url = await uploadImageViaServerProxy(fileLike, { timeoutMs: perFileMs });
        return { url };
      } catch (proxyErr) {
        throw proxyErr;
      }
    }
    if (/fetch|network|failed|abort/i.test(msg)) {
      throw new Error(
        isBrowserOnlineFlag()
          ? "Falhou o envio para a nuvem. Recarrega (Ctrl+F5) ou usa um ficheiro mais pequeno."
          : "Sem ligação à rede. Verifica Wi‑Fi ou dados móveis.",
      );
    }
    throw err;
  }
}

function uploadImageViaServerProxy(file, opts = {}) {
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
          : "Sem ligação à rede. Verifica Wi‑Fi ou dados móveis.",
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

/**
 * Upload image to Blob storage (for large images that exceed Vercel body limit).
 * Tries server-proxy upload route.
 */
export async function uploadImageToBlob(file, opts = {}) {
  if (!file) throw new Error("Imagem em falta.");
  return await uploadImageViaServerProxy(file, opts);
}

/** Vercel Blob e/ou S3 — substitui ficheiros por `*_url` (pedido final fica leve). */
async function offloadFormDataMediaToCloud(formData, opts = {}) {
  const perFileMs = opts.timeoutMs ?? pickBlobOffloadTimeoutMs(formDataTotalBlobBytes(formData), false);
  const blobEnabled = await isBlobUploadEnabled();
  const {
    uploadVideoViaS3,
    uploadImageViaS3,
    isS3VideoUploadAvailable,
  } = await import("./s3VideoUpload");
  const s3Enabled = await isS3VideoUploadAvailable();
  const out = new FormData();

  for (const [key, val] of formData.entries()) {
    const isBlobLike = val instanceof File || (typeof Blob !== "undefined" && val instanceof Blob);
    if (!isBlobLike || !BLOB_OFFLOAD_KEYS.has(key)) {
      out.append(key, val);
      // eslint-disable-next-line no-continue
      continue;
    }

    const fileLike = val instanceof File
      ? val
      : new File([val], `${key}.bin`, { type: val.type || "application/octet-stream" });
    const isVideo = key === "video";
    const isImage = !isVideo && isImageFileLike(fileLike);
    const isLargeVideo = isVideo && fileLike.size > VIDEO_DIRECT_MAX;
    const cloudImage = isImage && imageNeedsCloudOffload(fileLike);

    if (!isVideo && isImage && !cloudImage) {
      const { prepareImageForUpload } = await import("./prepareImageForUpload");
      // eslint-disable-next-line no-await-in-loop
      const prepared = await prepareImageForUpload(fileLike, {
        maxBytes: DIRECT_UPLOAD_MAX,
        maxSize: 2048,
      });
      out.append(key, prepared);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (isImage && s3Enabled && fileLike.size > DIRECT_UPLOAD_MAX) {
      // eslint-disable-next-line no-await-in-loop
      const url = await withTimeout(
        uploadImageViaS3(fileLike, { onProgress: opts.onImageProgress }),
        perFileMs,
        "Upload da foto (S3)",
      );
      out.append(`${key}_url`, url);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (isLargeVideo && s3Enabled) {
      // eslint-disable-next-line no-await-in-loop
      const url = await withTimeout(
        uploadVideoViaS3(fileLike, { onProgress: opts.onVideoProgress }),
        perFileMs,
        "Upload do vídeo (S3)",
      );
      out.append(`${key}_url`, url);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (blobEnabled && (isVideo ? isLargeVideo : cloudImage)) {
      const progressCb = isVideo ? opts.onVideoProgress : opts.onImageProgress;
      // eslint-disable-next-line no-await-in-loop
      const result = await uploadFileToVercelBlob(key, fileLike, perFileMs, progressCb);
      out.append(`${key}_url`, result.url);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (
      !isVideo
      && fileLike.size > DIRECT_UPLOAD_MAX
      && String(fileLike.type || "").startsWith("image/")
    ) {
      const { compressImageNeverFail } = await import("./canvasCompress");
      // eslint-disable-next-line no-await-in-loop
      const shrunk = await compressImageNeverFail(fileLike, {
        maxBytes: DIRECT_UPLOAD_MAX,
        maxSize: 2048,
      });
      out.append(key, shrunk);
      // eslint-disable-next-line no-await-in-loop
      continue;
    }

    if (isLargeVideo) {
      throw new Error(
        "Vídeo grande sem armazenamento em nuvem. Na Vercel adiciona BLOB_READ_WRITE_TOKEN ou as variáveis AWS (S3).",
      );
    }

    out.append(key, val);
  }
  return out;
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
          ? "Falhou o envio do vídeo ao servidor. Tenta outra vez ou recarrega (Ctrl+F5)."
          : "Sem ligação à rede. Verifica Wi‑Fi ou dados móveis.",
      );
      err.code = "ERR_NETWORK";
      reject(err);
    };
    xhr.ontimeout = () => {
      const err = new Error("Timeout ao enviar o vídeo ao servidor.");
      err.code = "ECONNABORTED";
      reject(err);
    };
    xhr.send(fd);
  });
}

async function uploadVideoToCloudDirect(file, opts = {}) {
  invalidateBlobUploadCache();
  const blobOn = await isBlobUploadEnabled({ refresh: true });
  const { isS3VideoUploadAvailable } = await import("./s3VideoUpload");
  const s3On = await isS3VideoUploadAvailable();
  if (!blobOn && !s3On) {
    throw new Error(
      "Vídeos grandes precisam de armazenamento em nuvem. Recarrega a página (Ctrl+F5).",
    );
  }
  const fd = new FormData();
  fd.append("video", file);
  const out = await offloadFormDataMediaToCloud(fd, {
    timeoutMs: opts.timeoutMs ?? 600_000,
    onVideoProgress: opts.onProgress,
  });
  if (typeof out.get === "function") {
    const url = out.get("video_url");
    if (url) return String(url);
  }
  for (const [k, v] of out.entries()) {
    if (k === "video_url" && typeof v === "string") return v;
  }
  throw new Error("Upload do vídeo terminou sem URL. Tenta MP4 mais curto.");
}

/** Envia vídeo para nuvem; tenta browser→Blob e, se falhar, servidor→Blob. */
export async function uploadVideoToCloud(file, opts = {}) {
  if (!file) throw new Error("Vídeo em falta.");
  try {
    return await uploadVideoToCloudDirect(file, opts);
  } catch (directErr) {
    const msg = String(directErr?.message || directErr);
    const tryServer = /fetch|network|failed|nuvem|blob|interrompida|abort|timeout|ligação/i.test(msg)
      || directErr?.code === "ERR_NETWORK";
    if (!tryServer) throw directErr;
    try {
      return await uploadVideoViaServerProxy(file, opts);
    } catch (proxyErr) {
      const proxyMsg = formatHttpError(proxyErr, "Upload falhou.");
      throw new Error(`${proxyMsg} (também falhou envio direto à nuvem.)`);
    }
  }
}

const IMAGE_OFFLOAD_KEYS = new Set(["photo", "image", "mask", "garment", "reference_image"]);
const DIRECT_UPLOAD_MAX = 3_500_000;

/** Prepara imagens para POST directo (JPEG, <4 MB) — HEIC e ficheiros grandes incluídos. */
async function shrinkFormDataForDirectUpload(formData) {
  const { prepareImageForUpload } = await import("./prepareImageForUpload");
  const out = new FormData();
  for (const [key, val] of formData.entries()) {
    const isFile = val instanceof File || (typeof Blob !== "undefined" && val instanceof Blob);
    const isImageField = isFile && IMAGE_OFFLOAD_KEYS.has(key)
      && (String(val.type || "").startsWith("image/") || /\.(heic|heif|jpe?g|png|webp)$/i.test(val.name || ""));
    if (isImageField) {
      const fileLike = val instanceof File
        ? val
        : new File([val], `${key}.jpg`, { type: val.type || "image/jpeg" });
      const needsPrep = fileLike.size > DIRECT_UPLOAD_MAX * 0.92
        || !/^image\/jpe?g$/i.test(fileLike.type || "")
        || /\.(heic|heif)$/i.test(fileLike.name || "");
      if (needsPrep) {
        // eslint-disable-next-line no-await-in-loop
        const prepared = await prepareImageForUpload(fileLike, {
          maxBytes: DIRECT_UPLOAD_MAX,
          maxSize: 2048,
        });
        out.append(key, prepared);
      } else {
        out.append(key, val);
      }
    } else {
      out.append(key, val);
    }
  }
  return out;
}

/**
 * Multipart POST com várias tentativas. Usa XMLHttpRequest no browser (melhor em
 * Android/iOS com ficheiros grandes) e clona FormData em cada tentativa.
 */
export async function uploadPost(url, formData, config = {}) {
  const attempts = config.attempts ?? 3;
  const headerSrc = { ...(config.headers || {}) };
  delete headerSrc["Content-Type"];
  delete headerSrc["content-type"];

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("rp_token") : null;
  const headers = {};
  const skipPoll = headerSrc["X-Skip-Auto-Poll"] ?? headerSrc["x-skip-auto-poll"];
  if (skipPoll != null && String(skipPoll).length) headers["X-Skip-Auto-Poll"] = String(skipPoll);
  if (token) headers.Authorization = `Bearer ${token}`;

  const requestUrl = joinApiPath(url);
  let lastErr;

  let baseFd = cloneFormData(formData);
  if (typeof window !== "undefined") {
    const { prepareStudioFormDataForSubmit } = await import("./studioUpload/prepareSubmit");
    baseFd = await prepareStudioFormDataForSubmit(cloneFormData(formData), {
      skipBlobOffload: config.skipBlobOffload,
      onProgress: config.onVideoProgress,
      timeoutMs: config.blobOffloadTimeoutMs,
    });
  }

  const timeout = config.timeout ?? pickUploadTimeoutMs(baseFd);

  const useXhr = typeof XMLHttpRequest !== "undefined" && typeof window !== "undefined";

  function xhrPost(body) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", requestUrl, true);
      xhr.timeout = timeout;
      Object.entries(headers).forEach(([k, v]) => {
        if (v != null && v !== "") xhr.setRequestHeader(k, String(v));
      });
      xhr.onload = () => {
        const text = xhr.responseText || "";
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { detail: text.slice(0, 240) || "Resposta inválida." };
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ data, status: xhr.status, config: { url, ...config } });
          return;
        }
        const detailStr = typeof data.detail === "string" ? data.detail : "";
        const payloadTooLarge = /FUNCTION_PAYLOAD_TOO_LARGE|Request Entity Too Large/i.test(
          `${detailStr} ${xhr.statusText || ""} ${text}`,
        );
        const err = new Error(
          payloadTooLarge
            ? "O vídeo é demasiado grande para enviar num único pedido. Aguarda o upload para a nuvem ou usa um clip mais curto."
            : (detailStr || xhr.statusText || "Pedido falhou."),
        );
        err.response = { status: payloadTooLarge ? 413 : xhr.status, data };
        if (xhr.status === 401 && token && !isLocalToken(token)) {
          localStorage.removeItem("rp_token");
          localStorage.removeItem("rp_user");
        }
        reject(err);
      };
      xhr.onerror = () => {
        const err = new Error(
          isBrowserOnlineFlag()
            ? "Falha ao enviar o ficheiro. Recarrega (Ctrl+F5) e tenta outra vez."
            : "Sem ligação à rede. Verifica Wi‑Fi ou dados móveis.",
        );
        err.code = "ERR_NETWORK";
        reject(err);
      };
      xhr.ontimeout = () => {
        const err = new Error("Timeout ao enviar.");
        err.code = "ECONNABORTED";
        reject(err);
      };
      xhr.send(body);
    });
  }

  for (let i = 0; i < attempts; i += 1) {
    const body = cloneFormData(baseFd);
    try {
      if (useXhr) {
        // eslint-disable-next-line no-await-in-loop
        const envelope = await xhrPost(body);
        // eslint-disable-next-line no-await-in-loop
        const data = await maybeAwaitMultipartCreation(envelope.data, skipPoll, config);
        return { ...envelope, data };
      }
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), timeout);
      let res;
      try {
        // eslint-disable-next-line no-await-in-loop
        res = await fetch(requestUrl, {
          method: "POST",
          body,
          headers,
          signal: controller.signal,
          credentials: "same-origin",
        });
      } finally {
        clearTimeout(tid);
      }
      // eslint-disable-next-line no-await-in-loop
      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { detail: rawText?.slice(0, 240) || "Resposta inválida do servidor." };
      }
      if (!res.ok) {
        const detailStr = typeof data.detail === "string" ? data.detail : "";
        const payloadTooLarge = /FUNCTION_PAYLOAD_TOO_LARGE|Request Entity Too Large/i.test(
          `${detailStr} ${res.statusText || ""} ${rawText}`,
        );
        const err = new Error(
          payloadTooLarge
            ? "O vídeo é demasiado grande para enviar num único pedido. Aguarda o upload para a nuvem ou usa um clip mais curto."
            : (detailStr || res.statusText || "Pedido falhou."),
        );
        err.response = { status: payloadTooLarge ? 413 : res.status, data };
        if (res.status === 401 && token && !isLocalToken(token)) {
          localStorage.removeItem("rp_token");
          localStorage.removeItem("rp_user");
        }
        throw err;
      }
      // eslint-disable-next-line no-await-in-loop
      const merged = await maybeAwaitMultipartCreation(data, skipPoll, config);
      return { data: merged, status: res.status, config: { url, ...config } };
    } catch (e) {
      lastErr = e;
      const aborted = e?.name === "AbortError" || e?.code === "ECONNABORTED";
      const noResponse = !e?.response;
      const net =
        noResponse
        || aborted
        || e?.code === "ERR_NETWORK"
        || /network|fetch|Failed to fetch|Load failed|Ligação interrompida/i.test(String(e?.message || ""));
      const retryable = net;
      if (!retryable || i === attempts - 1) throw e;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 400 * 2 ** i));
    }
  }
  throw lastErr;
}

api.interceptors.response.use(
  async (r) => {
    if (
      r?.data?.prediction_id &&
      !r.config?.headers?.["X-Skip-Auto-Poll"] &&
      !String(r.config?.url || "").startsWith("/predictions/")
    ) {
      if (r.data.credits_spent) {
        localStorage.setItem(`rp_prediction_${r.data.prediction_id}`, JSON.stringify({
          credits_spent: r.data.credits_spent,
          type: r.data.type || "image",
        }));
      }
      const data = await pollPrediction(r.data.prediction_id);
      return { ...r, data };
    }
    return r;
  },
  (err) => {
    const token = localStorage.getItem("rp_token");
    if (err?.response?.status === 401 && !isLocalToken(token)) {
      localStorage.removeItem("rp_token");
      localStorage.removeItem("rp_user");
    }
    return Promise.reject(err);
  }
);

function notifyCreationSucceeded(creation) {
  if (typeof window === "undefined" || !creation) return;
  window.dispatchEvent(new CustomEvent("rp:creation-succeeded", { detail: creation }));
  notifyGenerationComplete(creation);
}

/**
 * Poll a long-running prediction until it completes.
 *
 * The backend submits to Replicate and returns a `prediction_id` in ~1-2s.
 * This helper hits GET /predictions/{id} every `intervalMs` until the
 * server returns a terminal status ("succeeded" or "failed").
 *
 * @param {string} predictionId
 * @param {object} opts
 * @param {(elapsedSeconds: number) => void} opts.onTick — fired each poll
 * @param {number} opts.intervalMs — defaults to 2500
 * @param {number} opts.timeoutMs — defaults to 240000 (4 min)
 * @returns {Promise<{creation, new_balance}>}
 * @throws Error on failure or timeout. Backend has already refunded credits.
 */
export async function pollPrediction(predictionId, opts = {}) {
  const intervalMs = opts.intervalMs ?? 2500;
  const timeoutMs  = opts.timeoutMs  ?? 240000;
  const onTick     = opts.onTick;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    let res;
    try {
      res = await api.get(`/predictions/${predictionId}`);
    } catch (e) {
      const status = e?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw e;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }
    const data = res.data;
    if (data.status === "succeeded") {
      try {
        const meta = JSON.parse(localStorage.getItem(`rp_prediction_${predictionId}`) || "{}");
        const spent = meta.credits_spent || opts.credits_spent;
        if (data.creation && spent && !data.creation.credits_spent) {
          data.creation.credits_spent = spent;
          data.creation.type = data.creation.type || meta.type || opts.type;
        }
        localStorage.removeItem(`rp_prediction_${predictionId}`);
      } catch { /* ignore */ }
      if (data.new_balance != null && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("rp:credits-sync", { detail: { credits: data.new_balance } }));
      }
      if (!data.creation) {
        const err = new Error("Geração concluída sem resultado.");
        err.refunded = data.refunded;
        err.new_balance = data.new_balance;
        throw err;
      }
      data.creation = normalizeCreation(data.creation);
      data.creation.server_billing = data.server_billing || data.creation.server_billing;
      if (data.new_balance != null) data.creation.new_balance = data.new_balance;
      if (!data.creation.result_urls?.length) {
        const err = new Error("Geração concluída sem ficheiro de resultado.");
        err.refunded = data.refunded;
        err.new_balance = data.new_balance;
        throw err;
      }
      notifyCreationSucceeded(data.creation);
      return data;
    }
    if (data.status === "failed") {
      if (data.new_balance != null && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("rp:credits-sync", {
          detail: { credits: data.new_balance, refunded: data.refunded },
        }));
      }
      if (data.refunded) {
        notifyCreditsUpdate({
          balance: data.new_balance,
          refunded: true,
          spent: opts.credits_spent,
        });
      }
      const err = new Error(data.error || "Geração falhou.");
      err.new_balance = data.new_balance;
      err.refunded = data.refunded;
      throw err;
    }
    if (onTick) onTick(data.elapsed_seconds || Math.floor((Date.now() - start) / 1000));
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Tempo esgotado — a geração pode ainda estar em curso. Verifica a Galeria daqui a 1 min.");
}

/**
 * O POST multipart devolve só { prediction_id, credits_spent }.
 * uploadPost usa XHR e não passa pelo interceptor Axios — é preciso fazer poll aqui
 * (exceto quando X-Skip-Auto-Poll está definido, ex.: Generate.jsx).
 */
async function maybeAwaitMultipartCreation(data, skipPollHeader, config = {}) {
  const skip = skipPollHeader != null && String(skipPollHeader).trim().length > 0;
  if (skip || !data || typeof data !== "object") return data;
  const pid = data.prediction_id;
  if (!pid) return data;
  const urls = data.creation?.result_urls;
  if (Array.isArray(urls) && urls.length > 0) return data;

  if (data.credits_spent) {
    try {
      localStorage.setItem(`rp_prediction_${pid}`, JSON.stringify({
        credits_spent: data.credits_spent,
        type: data.type || "image",
      }));
    } catch { /* ignore */ }
  }

  const pollTimeoutMs = config.pollTimeoutMs ?? Math.max(240_000, Number(config.timeout) || 0);
  const polled = await pollPrediction(pid, {
    credits_spent: data.credits_spent,
    type: data.type,
    timeoutMs: pollTimeoutMs,
    onTick: config.onPollTick,
    intervalMs: config.pollIntervalMs,
  });

  const creation = polled.creation ? normalizeCreation(polled.creation) : polled.creation;
  return {
    ...data,
    ...polled,
    creation,
    prediction_id: pid,
  };
}
