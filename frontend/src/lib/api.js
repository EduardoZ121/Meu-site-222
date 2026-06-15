import axios from "axios";

import {
  invalidateBlobUploadCache,
  isBlobUploadEnabled,
  uploadImageToCloud,
  uploadVideoToCloud,
} from "./blobUploadClient";
import { formatHttpError } from "./uploadErrors";
import { isBrowserOnlineFlag } from "./uploadReachability";
import { normalizeCreation } from "./creationUrls";
import { notifyCreditsUpdate, notifyGenerationComplete, notifyGenerationFailed } from "./notifyUser";
import { isProductionHost, isRemakePixSiteHost } from "./canonicalOrigin";

/** Evita mixed content: página em https + backend em http → o browser bloqueia e parece "Network Error". */
function resolveBaseUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "";
    // remakepix.com + URLs Vercel do projeto → API local (/api), nunca Emergent.
    if (isRemakePixSiteHost(host)) return "";
  }

  const raw = String(process.env.REACT_APP_BACKEND_URL || "").trim().replace(/\/$/, "");
  if (/emergentagent\.com/i.test(raw)) return "";
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

const RP_PREDICTION_PREFIX = "rp_prediction_";
let backgroundWatcherStarted = false;
let backgroundWatcherTimer = null;
const notifiedPredictions = new Set();

export function formatApiError(err, fallback = "Falhou.", opts) {
  return formatHttpError(err, fallback, opts);
}

export const api = axios.create({
  baseURL: API,
  timeout: 300000, // Vercel Pro — gerações longas (GPT/vídeo) até ~13 min
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

export {
  invalidateBlobUploadCache,
  isBlobUploadEnabled,
  uploadImageToCloud,
  uploadVideoToCloud,
};

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
  let emergencyCompress = false;
  if (typeof window !== "undefined") {
    const { prepareStudioFormDataForSubmit } = await import("./studioUpload/prepareSubmit");
    baseFd = await prepareStudioFormDataForSubmit(cloneFormData(formData), {
      emergencyCompress,
      skipBlobOffload: config.skipBlobOffload,
      blobOffloadTimeoutMs: config.blobOffloadTimeoutMs,
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
            ? "Ficheiro demasiado grande. Usa uma foto mais pequena ou um vídeo mais curto."
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
    if (typeof window !== "undefined" && i > 0) {
      const { prepareStudioFormDataForSubmit } = await import("./studioUpload/prepareSubmit");
      baseFd = await prepareStudioFormDataForSubmit(cloneFormData(formData), {
        emergencyCompress,
        skipBlobOffload: config.skipBlobOffload,
        blobOffloadTimeoutMs: config.blobOffloadTimeoutMs,
      });
    }
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
            ? "Ficheiro demasiado grande. Usa uma foto mais pequena ou um vídeo mais curto."
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
      const payloadTooLarge = e?.response?.status === 413
        || /FUNCTION_PAYLOAD_TOO_LARGE|Request Entity Too Large|demasiado grande/i.test(String(e?.message || ""));
      if (payloadTooLarge && !emergencyCompress && typeof window !== "undefined") {
        emergencyCompress = true;
        const { prepareStudioFormDataForSubmit } = await import("./studioUpload/prepareSubmit");
        baseFd = await prepareStudioFormDataForSubmit(cloneFormData(formData), {
          emergencyCompress: true,
        });
        // eslint-disable-next-line no-continue
        continue;
      }
      const aborted = e?.name === "AbortError" || e?.code === "ECONNABORTED";
      const noResponse = !e?.response;
      const net =
        noResponse
        || aborted
        || e?.code === "ERR_NETWORK"
        || /network|fetch|Failed to fetch|Load failed|Ligação interrompida/i.test(String(e?.message || ""));
      const retryable = net;
      if (!retryable || i === attempts - 1) throw e;
      invalidateBlobUploadCache();
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 400 * 2 ** i));
    }
  }
  throw lastErr;
}

api.interceptors.response.use(
  async (r) => {
    const urlStr = String(r.config?.url || "");
    const isCarousel = /\/generate\/carousel/.test(urlStr);
    const isVideoRoute = /\/generate\/video(-edit)?/.test(urlStr);
    if (
      r?.data?.prediction_id &&
      !r.config?.headers?.["X-Skip-Auto-Poll"] &&
      !urlStr.startsWith("/predictions/") &&
      !isCarousel
    ) {
      if (r.data.credits_spent) {
        localStorage.setItem(`rp_prediction_${r.data.prediction_id}`, JSON.stringify({
          credits_spent: r.data.credits_spent,
          type: r.data.type || (isVideoRoute ? "video" : "image"),
        }));
      }
      // Background mode: video only (long jobs). Images poll synchronously so
      // the result panel + scroll work like before; gallery/notifications still
      // fire via notifyCreationSucceeded when the poll completes.
      if (isVideoRoute) {
        try {
          const { dispatchBackgroundJob } = await import("./bgGeneration");
          dispatchBackgroundJob(r.data, {
            type: r.data.type || "video",
            creditsSpent: r.data.credits_spent || 0,
          });
        } catch { /* ignore notification failures */ }
        return { ...r, data: { ...r.data, deferred: true } };
      }
      const data = await pollPrediction(r.data.prediction_id, {
        credits_spent: r.data.credits_spent,
        type: r.data.type || "image",
      });
      return { ...r, data };
    }
    if (
      r?.data?.prediction_id &&
      !r.config?.headers?.["X-Skip-Auto-Poll"] &&
      !String(r.config?.url || "").startsWith("/predictions/") &&
      isCarousel
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

function notifyPredictionFailure(error, detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("rp:prediction-failed", {
    detail: {
      error: String(error || "Geração falhou."),
      ...detail,
    },
  }));
}

function dispatchWalletSync(data = {}, extra = {}) {
  if (typeof window === "undefined") return;
  const detail = { ...extra };
  if (data.new_balance != null) detail.credits = data.new_balance;
  if (data.new_premium_balance != null) detail.premium_credits = data.new_premium_balance;
  if (detail.credits != null || detail.premium_credits != null) {
    window.dispatchEvent(new CustomEvent("rp:credits-sync", { detail }));
  }
}

export function trackPendingPrediction(predictionId, meta = {}) {
  if (typeof window === "undefined" || !predictionId) return;
  try {
    localStorage.setItem(`${RP_PREDICTION_PREFIX}${predictionId}`, JSON.stringify({
      credits_spent: Number(meta.credits_spent || 0) || 0,
      type: meta.type || "image",
      started_at: Date.now(),
    }));
  } catch {
    /* ignore */
  }
}

function removeTrackedPrediction(predictionId) {
  if (typeof window === "undefined" || !predictionId) return;
  try { localStorage.removeItem(`${RP_PREDICTION_PREFIX}${predictionId}`); } catch { /* ignore */ }
}

function readTrackedPredictions() {
  if (typeof window === "undefined") return [];
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(RP_PREDICTION_PREFIX))
      .map((k) => {
        const predictionId = k.slice(RP_PREDICTION_PREFIX.length);
        let meta = {};
        try { meta = JSON.parse(localStorage.getItem(k) || "{}"); } catch { meta = {}; }
        return { predictionId, meta };
      })
      .filter((x) => x.predictionId);
  } catch {
    return [];
  }
}

async function pollTrackedPredictionOnce(predictionId, meta = {}) {
  let res;
  try {
    res = await api.get(`/predictions/${predictionId}`);
  } catch (e) {
    const status = e?.response?.status;
    if (status && status >= 400 && status < 500 && status !== 429) {
      removeTrackedPrediction(predictionId);
      notifyPredictionFailure(e?.response?.data?.detail || e?.message || "Geração falhou.", {
        prediction_id: predictionId,
        source: "background",
      });
    }
    return;
  }
  const data = res?.data || {};
  if (data.status === "succeeded") {
    const creation = data.creation ? normalizeCreation(data.creation) : null;
    const hasUrls = Boolean(creation?.result_urls?.length);
    if (hasUrls && !notifiedPredictions.has(predictionId)) {
      if (meta?.credits_spent && !creation.credits_spent) creation.credits_spent = meta.credits_spent;
      if (meta?.type && !creation.type) creation.type = meta.type;
      notifiedPredictions.add(predictionId);
      notifyCreationSucceeded({
        ...creation,
        ...(data.new_balance != null ? { new_balance: data.new_balance } : {}),
        ...(data.new_premium_balance != null ? { new_premium_balance: data.new_premium_balance } : {}),
      });
      window.dispatchEvent(new CustomEvent("rp:prediction-finished", {
        detail: { status: "succeeded", prediction_id: predictionId, source: "background" },
      }));
      removeTrackedPrediction(predictionId);
    } else if (!hasUrls) {
      window.dispatchEvent(new CustomEvent("rp:prediction-finished", {
        detail: { status: "succeeded", prediction_id: predictionId, source: "background", repair: true },
      }));
    }
    dispatchWalletSync(data, { refunded: data.refunded });
    return;
  }
  if (data.status === "failed") {
    if (data.refunded) {
      dispatchWalletSync(data, { refunded: data.refunded });
      if (meta?.type === "video") {
        notifyGenerationFailed({
          error: data.error,
          type: "video",
          balance: data.new_balance,
          credits: meta?.credits_spent,
        });
      } else {
        notifyCreditsUpdate({
          balance: data.new_balance,
          refunded: true,
          spent: meta?.credits_spent,
        });
      }
    } else {
      notifyGenerationFailed({
        error: data.error,
        type: meta?.type || "image",
        balance: data.new_balance,
        credits: meta?.credits_spent,
      });
    }
    notifyPredictionFailure(data.error || "Geração falhou.", {
      prediction_id: predictionId,
      source: "background",
    });
    window.dispatchEvent(new CustomEvent("rp:prediction-finished", {
      detail: {
        status: "failed",
        prediction_id: predictionId,
        source: "background",
        error: data.error || "Geração falhou.",
      },
    }));
    removeTrackedPrediction(predictionId);
  }
}

/** Restaura jobs em curso do servidor (ex.: vídeo-to-vídeo após recarregar). */
export async function syncServerPendingPredictions() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("rp_token");
  if (!token || isLocalToken(token)) return;
  try {
    const res = await api.get("/generations/pending");
    const rows = res.data?.pending || [];
    for (const row of rows) {
      if (!row?.prediction_id) continue;
      trackPendingPrediction(row.prediction_id, {
        credits_spent: row.credits_spent,
        type: row.type || "video",
      });
    }
  } catch {
    /* offline / sessão */
  }
}

export function startPendingPredictionsWatcher() {
  if (typeof window === "undefined" || backgroundWatcherStarted) return;
  backgroundWatcherStarted = true;
  const tick = async () => {
    await syncServerPendingPredictions();
    const pending = readTrackedPredictions();
    for (const item of pending) {
      // eslint-disable-next-line no-await-in-loop
      await pollTrackedPredictionOnce(item.predictionId, item.meta);
    }
  };
  tick();
  backgroundWatcherTimer = window.setInterval(tick, 5000);
  window.addEventListener("beforeunload", () => {
    if (backgroundWatcherTimer) window.clearInterval(backgroundWatcherTimer);
  }, { once: true });
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
  trackPendingPrediction(predictionId, {
    credits_spent: opts.credits_spent,
    type: opts.type,
  });
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
        removeTrackedPrediction(predictionId);
      } catch { /* ignore */ }
      if (data.new_balance != null && typeof window !== "undefined") {
        dispatchWalletSync(data);
      }
      if (!data.creation) {
        const err = new Error("Geração concluída sem resultado.");
        err.refunded = data.refunded;
        err.new_balance = data.new_balance;
        err.new_premium_balance = data.new_premium_balance;
        throw err;
      }
      data.creation = normalizeCreation(data.creation);
      data.creation.server_billing = data.server_billing || data.creation.server_billing;
      if (data.new_balance != null) data.creation.new_balance = data.new_balance;
      if (data.new_premium_balance != null) data.creation.new_premium_balance = data.new_premium_balance;
      if (!data.creation.result_urls?.length) {
        const err = new Error("Geração concluída sem ficheiro de resultado.");
        err.refunded = data.refunded;
        err.new_balance = data.new_balance;
        throw err;
      }
      notifyCreationSucceeded(data.creation);
      window.dispatchEvent(new CustomEvent("rp:prediction-finished", {
        detail: { status: "succeeded", prediction_id: predictionId, source: "foreground" },
      }));
      return data;
    }
    if (data.status === "failed") {
      dispatchWalletSync(data, { refunded: data.refunded });
      if (data.refunded) {
        if (opts.type === "video") {
          notifyGenerationFailed({
            error: data.error,
            type: "video",
            balance: data.new_balance,
            credits: opts.credits_spent,
          });
        } else {
          notifyCreditsUpdate({
            balance: data.new_balance,
            refunded: true,
            spent: opts.credits_spent,
          });
        }
      } else {
        notifyGenerationFailed({
          error: data.error,
          type: opts.type || "image",
          balance: data.new_balance,
          credits: opts.credits_spent,
        });
      }
      const err = new Error(data.error || "Geração falhou.");
      err.new_balance = data.new_balance;
      err.refunded = data.refunded;
      removeTrackedPrediction(predictionId);
      window.dispatchEvent(new CustomEvent("rp:prediction-finished", {
        detail: {
          status: "failed",
          prediction_id: predictionId,
          source: "foreground",
          error: err.message,
        },
      }));
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
  const isLongVideo = (data.type || config.type) === "video";
  const polled = await pollPrediction(pid, {
    credits_spent: data.credits_spent,
    type: data.type,
    timeoutMs: isLongVideo ? Math.max(pollTimeoutMs, 1_800_000) : pollTimeoutMs,
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
