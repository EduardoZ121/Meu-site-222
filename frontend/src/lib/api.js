import axios from "axios";

import { formatHttpError } from "./uploadErrors";

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

export function formatApiError(err, fallback = "Falhou.") {
  return formatHttpError(err, fallback);
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

async function isBlobUploadEnabled() {
  if (blobUploadEnabledCache !== null) return blobUploadEnabledCache;
  if (typeof window === "undefined" || typeof fetch === "undefined") {
    blobUploadEnabledCache = false;
    return false;
  }
  try {
    const r = await fetch(joinApiPath("/blob/status"), { method: "GET", credentials: "same-origin" });
    const j = await r.json();
    blobUploadEnabledCache = Boolean(j.blob);
    return blobUploadEnabledCache;
  } catch {
    blobUploadEnabledCache = false;
    return false;
  }
}

/** Envia ficheiros de imagem para Vercel Blob e substitui por campos `*_url` (pedido final fica pequeno). */
async function offloadFormDataImagesToBlob(formData) {
  const { put } = await import("@vercel/blob/client");
  const BLOB_KEYS = new Set(["photo", "image", "mask", "garment"]);
  const out = new FormData();
  for (const [key, val] of formData.entries()) {
    const isBlobLike = val instanceof File || (typeof Blob !== "undefined" && val instanceof Blob);
    if (isBlobLike && BLOB_KEYS.has(key)) {
      const fileLike = val instanceof File
        ? val
        : new File([val], `${key}.bin`, { type: val.type || "application/octet-stream" });
      // eslint-disable-next-line no-await-in-loop
      const { data } = await api.post("/blob/prepare", { filename: fileLike.name || `${key}.jpg` });
      const { clientToken, pathname } = data;
      // eslint-disable-next-line no-await-in-loop
      const result = await put(pathname, fileLike, {
        access: "public",
        token: clientToken,
        contentType: fileLike.type || "image/jpeg",
        multipart: fileLike.size > 4_500_000,
      });
      out.append(`${key}_url`, result.url);
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
  if (typeof window !== "undefined" && (await isBlobUploadEnabled())) {
    try {
      baseFd = await offloadFormDataImagesToBlob(cloneFormData(formData));
    } catch {
      baseFd = cloneFormData(formData);
    }
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
        const err = new Error(typeof data.detail === "string" ? data.detail : xhr.statusText || "Pedido falhou.");
        err.response = { status: xhr.status, data };
        if (xhr.status === 401 && token && !isLocalToken(token)) {
          localStorage.removeItem("rp_token");
          localStorage.removeItem("rp_user");
        }
        reject(err);
      };
      xhr.onerror = () => {
        const err = new Error("Ligação interrompida.");
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
        const err = new Error(typeof data.detail === "string" ? data.detail : res.statusText || "Pedido falhou.");
        err.response = { status: res.status, data };
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
      // Network blip — wait then retry the poll
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
      if (data.creation) {
        data.creation.server_billing = data.server_billing || data.creation.server_billing;
        if (data.new_balance != null) data.creation.new_balance = data.new_balance;
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

  return {
    ...data,
    ...polled,
    creation: polled.creation,
    prediction_id: pid,
  };
}
