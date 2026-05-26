/**
 * Mensagens de upload/rede — nunca culpar internet se o browser está online e a API responde.
 */

import { isBrowserOnlineFlag, isEffectivelyOffline } from "./uploadReachability";

const FALLBACK = {
  upload_err_offline: "Sem ligação à rede. Verifica Wi‑Fi ou dados móveis e tenta outra vez.",
  upload_err_send_online:
    "Não foi possível enviar o ficheiro ao servidor. Recarrega a página (Ctrl+F5) e tenta outra vez.",
  upload_err_send_online_short: "Falha ao enviar. Tenta outra vez.",
  upload_err_server_timeout: "O envio demorou demasiado. Usa uma imagem mais pequena ou tenta mais tarde.",
  upload_err_preview:
    "Não foi possível mostrar a pré-visualização neste browser. O ficheiro pode ser usado na mesma ao gerar.",
  upload_err_payload_video:
    "Ficheiro demasiado grande. Aguarda o upload para a nuvem ou usa um clip mais curto.",
  upload_err_image_large: "Imagem demasiado grande. Máximo 5 MB.",
  upload_err_video_large: "Vídeo demasiado grande. Máximo 50 MB.",
  upload_err_file_large: "Ficheiro demasiado grande. Tenta um mais pequeno.",
  upload_err_cloud: "Falhou o envio para a nuvem. Tenta outra vez ou usa um ficheiro mais pequeno.",
  upload_err_server: "Erro no servidor. Tenta dentro de um minuto.",
  upload_err_maintenance: "Servidor temporariamente indisponível. Tenta em breve.",
};

function tr(key, t, vars) {
  if (t) {
    const v = t(key, vars);
    if (v && v !== key) return v;
  }
  const fb = FALLBACK[key] || key;
  if (!vars) return fb;
  return String(fb).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
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
export function formatHttpError(err, fallback = "Falhou.", opts = {}) {
  const raw = String(err?.response?.data?.detail || err?.message || "");
  const ctx = opts.context || "";
  const t = opts.t;

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

  if (status === 413) {
    const detail = err?.response?.data?.detail;
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
    if (typeof detail === "string" && detail.trim()) return detail.trim();
    return tr("upload_err_server", t);
  }
  if (status === 502 || status === 503 || status === 504) {
    return tr("upload_err_maintenance", t);
  }

  if (status != null && status >= 400) {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return `Erro ${status}: ${detail.trim()}`;
    if (status === 401) return "Erro 401: sessão expirada. Entra novamente.";
    if (status === 402) return "Erro 402: créditos insuficientes.";
    if (status === 429) return "Erro 429: demasiados pedidos. Espera um minuto.";
    return `Erro HTTP ${status}.`;
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
      return sanitizeLegacyInternetMessage(String(err.message).trim(), ctx, t);
    }
    if (ctx === "video_preview") return tr("upload_err_preview", t);
    return isBrowserOnlineFlag()
      ? (fallback || tr("upload_err_send_online_short", t))
      : offlineMessage(t);
  }

  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (err?.message) return sanitizeLegacyInternetMessage(err.message, ctx, t);
  return fallback;
}

/**
 * Erro de rede XHR/fetch — mensagem async quando precisamos de probe.
 */
export async function createUploadNetworkError(label = "upload") {
  const offline = await isEffectivelyOffline();
  const err = new Error(
    offline
      ? FALLBACK.upload_err_offline
      : FALLBACK.upload_err_send_online_short,
  );
  err.code = "ERR_NETWORK";
  err.uploadLabel = label;
  return err;
}
