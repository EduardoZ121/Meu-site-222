/**
 * Mensagens de upload/rede — nunca culpar internet se o browser está online e a API responde.
 */

import { isBrowserOnlineFlag, isEffectivelyOffline } from "./uploadReachability";
import { formatGenerationFailure, getClientLang, matchApiDetailKey } from "./errorMessages";

const FALLBACK_PT = {
  common_fail: "Falhou.",
  upload_err_offline: "Sem ligação à rede. Verifica Wi‑Fi ou dados móveis e tenta outra vez.",
  upload_err_send_online:
    "Não foi possível enviar o ficheiro ao servidor. Recarrega a página (Ctrl+F5) e tenta outra vez.",
  upload_err_send_online_short: "Falha ao enviar. Tenta outra vez.",
  upload_err_server_timeout: "O envio demorou demasiado. Usa uma imagem mais pequena ou tenta mais tarde.",
  upload_err_preview:
    "Não foi possível mostrar a pré-visualização neste browser. O ficheiro pode ser usado na mesma ao gerar.",
  upload_err_payload_video:
    "Ficheiro demasiado grande. Aguarda o upload para a nuvem ou usa um clip mais curto.",
  upload_err_image_large: "Imagem demasiado grande. Máximo 10 MB.",
  upload_err_video_large: "Vídeo demasiado grande. Máximo 50 MB.",
  upload_err_file_large: "Ficheiro demasiado grande. Tenta um mais pequeno.",
  upload_err_cloud: "Falhou o envio para a nuvem. Tenta outra vez ou usa um ficheiro mais pequeno.",
  upload_err_server: "Erro no servidor. Tenta dentro de um minuto.",
  upload_err_maintenance: "Servidor temporariamente indisponível. Tenta em breve.",
  common_err_insufficient_credits: "Créditos insuficientes para esta ação. Compra mais créditos ou escolhe uma opção mais barata.",
  common_err_session_expired: "Sessão expirada. Entra novamente.",
  common_err_rate_limit: "Demasiados pedidos. Espera um minuto e tenta outra vez.",
  common_err_account_suspended: "Conta suspensa. Contacta o suporte.",
  common_err_http: "Pedido falhou (HTTP {status}).",
  studio_err_content_blocked:
    "O modelo recusou este pedido (política de conteúdo). Os créditos foram devolvidos — tenta um prompt mais neutro.",
};

const FALLBACK_EN = {
  common_fail: "Something went wrong.",
  upload_err_offline: "No network connection. Check Wi‑Fi or mobile data and try again.",
  upload_err_send_online:
    "Could not send the file to the server. Reload the page (Ctrl+F5) and try again.",
  upload_err_send_online_short: "Upload failed. Try again.",
  upload_err_server_timeout: "Upload took too long. Use a smaller file or try later.",
  upload_err_preview:
    "Could not show a preview in this browser. You can still generate with this file.",
  upload_err_payload_video:
    "File too large for a single request. Wait for cloud upload or use a shorter clip.",
  upload_err_image_large: "Image too large. Maximum 10 MB.",
  upload_err_video_large: "Video too large. Maximum 50 MB.",
  upload_err_file_large: "File too large. Try a smaller one.",
  upload_err_cloud: "Cloud upload failed. Try again or use a smaller file.",
  upload_err_server: "Server error. Try again in a minute.",
  upload_err_maintenance: "Server temporarily unavailable. Try again shortly.",
  common_err_insufficient_credits: "Not enough credits for this action. Buy more credits or pick a cheaper option.",
  common_err_session_expired: "Session expired. Sign in again.",
  common_err_rate_limit: "Too many requests. Wait a minute and try again.",
  common_err_account_suspended: "Account suspended. Contact support.",
  common_err_http: "Request failed (HTTP {status}).",
  studio_err_content_blocked:
    "The model refused this request (content policy). Credits were refunded — try a neutral prompt.",
};

function fallbackDict(t) {
  if (t) return null;
  const lang = getClientLang();
  return lang === "pt" ? FALLBACK_PT : FALLBACK_EN;
}

function tr(key, t, vars) {
  if (t) {
    const v = t(key, vars);
    if (v && v !== key) return v;
  }
  const fb = fallbackDict(t)?.[key] ?? (getClientLang() === "pt" ? FALLBACK_PT : FALLBACK_EN)[key] ?? key;
  if (!vars) return fb;
  return String(fb).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

function resolveApiDetail(detail, status, t) {
  const key = matchApiDetailKey(detail, status);
  if (key) return tr(key, t);
  const d = String(detail || "").trim();
  if (!d) return null;
  return formatGenerationFailure(d, t ? undefined : getClientLang());
}

function sanitizeLegacyInternetMessage(msg, ctx, t) {
  if (!msg || typeof msg !== "string") return msg;
  const m = msg.trim();
  if (!/internet|ligação|rede|network|Verifica/i.test(m)) return m;
  if (isBrowserOnlineFlag()) {
    if (ctx === "video_preview" || /preview|pré-visualiz|codec|HEVC/i.test(m)) {
      return tr("upload_err_preview", t);
    }
    return tr("upload_err_send_online_short", t);
  }
  return tr("upload_err_offline", t);
}

function offlineMessage(t) {
  return tr("upload_err_offline", t);
}

function onlineSendMessage(t) {
  return tr("upload_err_send_online", t);
}

/**
 * @param {unknown} err
 * @param {string} [fallback]
 * @param {{ context?: string, t?: (k: string, v?: object) => string }} [opts]
 */
export function formatHttpError(err, fallback, opts = {}) {
  const raw = String(err?.response?.data?.detail || err?.message || "");
  const ctx = opts.context || "";
  const t = opts.t;
  const fb = fallback ?? tr("common_fail", t);

  if (/compress_too_large/i.test(raw) || err?.code === "COMPRESS_TOO_LARGE") {
    return tr("upload_compress_fail", t);
  }

  if (/FUNCTION_PAYLOAD_TOO_LARGE|Request Entity Too Large/i.test(raw)) {
    if (ctx === "image_upload" || ctx === "image_pick") {
      return tr("upload_err_image_large", t);
    }
    return tr("upload_err_payload_video", t);
  }

  if (/preview|pré-visualiz|codec|HEVC|canPlayType/i.test(raw) || ctx === "video_preview") {
    return tr("upload_err_preview", t);
  }

  if (/FUNCTION_INVOCATION_FAILED|A server error has occurred/i.test(raw)) {
    return tr("upload_err_maintenance", t);
  }

  const status = err?.response?.status;
  const apiCode = err?.response?.data?.code;

  if (status === 413) {
    const detail = err?.response?.data?.detail;
    const mapped = resolveApiDetail(detail, status, t);
    if (mapped) return mapped;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
    if (ctx === "video_upload" || /vídeo|video/i.test(raw)) {
      return tr("upload_err_video_large", t);
    }
    if (ctx === "image_upload" || ctx === "image_pick") {
      return tr("upload_err_image_large", t);
    }
    return tr("upload_err_file_large", t);
  }
  if (status === 500) {
    const detail = err?.response?.data?.detail;
    const mapped = resolveApiDetail(detail, status, t);
    if (mapped) return mapped;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
    return tr("upload_err_server", t);
  }
  if (status === 502 || status === 503 || status === 504) {
    return tr("upload_err_maintenance", t);
  }

  if (status != null && status >= 400) {
    const detail = err?.response?.data?.detail;
    if (apiCode === "INSUFFICIENT_CREDITS") return tr("common_err_insufficient_credits", t);
    if (typeof detail === "string" && detail.trim()) {
      const mapped = resolveApiDetail(detail.trim(), status, t);
      if (mapped) return mapped;
    }
    if (status === 401) return tr("common_err_session_expired", t);
    if (status === 402) return tr("common_err_insufficient_credits", t);
    if (status === 429) return tr("common_err_rate_limit", t);
    return tr("common_err_http", t, { status });
  }

  if (err?.name === "AbortError" || err?.code === "ECONNABORTED" || /timeout|demorou demasiado|esgotado/i.test(raw)) {
    return tr("upload_err_server_timeout", t);
  }

  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
    return isBrowserOnlineFlag()
      ? tr("upload_err_send_online_short", t)
      : offlineMessage(t);
  }

  if (!err?.response) {
    if (/upload em nuvem|blob|cloud|nuvem/i.test(raw)) {
      return raw.trim() || tr("upload_err_cloud", t);
    }
    if (/Failed to fetch|Load failed|fetch failed|NetworkError/i.test(raw)) {
      if (ctx === "video_preview") return tr("upload_err_preview", t);
      return isBrowserOnlineFlag()
        ? onlineSendMessage(t)
        : offlineMessage(t);
    }
    if (err?.message && String(err.message).trim()) {
      const msg = String(err.message).trim();
      const mapped = resolveApiDetail(msg, null, t);
      if (mapped && mapped !== msg) return mapped;
      return sanitizeLegacyInternetMessage(msg, ctx, t);
    }
    if (ctx === "video_preview") return tr("upload_err_preview", t);
    return isBrowserOnlineFlag()
      ? (fb || tr("upload_err_send_online_short", t))
      : offlineMessage(t);
  }

  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") {
    const mapped = resolveApiDetail(detail, status, t);
    return mapped || detail;
  }
  if (err?.message) return sanitizeLegacyInternetMessage(err.message, ctx, t);
  return fb;
}

/**
 * Erro de rede XHR/fetch — mensagem async quando precisamos de probe.
 */
export async function createUploadNetworkError(label = "upload") {
  const offline = await isEffectivelyOffline();
  const lang = getClientLang();
  const dict = lang === "pt" ? FALLBACK_PT : FALLBACK_EN;
  const err = new Error(
    offline
      ? dict.upload_err_offline
      : dict.upload_err_send_online_short,
  );
  err.code = "ERR_NETWORK";
  err.uploadLabel = label;
  return err;
}

export { formatGenerationFailure, getClientLang };
