/**
 * Mensagens de upload/rede — nunca culpar internet se o browser está online e a API responde.
 */

import { isBrowserOnlineFlag, isEffectivelyOffline } from "./uploadReachability";
import { humanizeGenerationError, mapFriendlyGenerationError } from "./friendlyGenerationError";

const FALLBACK = {
  upload_err_offline: "Sem ligação à rede. Verifica Wi‑Fi ou dados móveis e tenta outra vez.",
  upload_err_send_online:
    "Não foi possível enviar o ficheiro ao servidor. Recarrega a página (Ctrl+F5) e tenta outra vez.",
  upload_err_send_online_short: "Falha ao enviar. Tenta outra vez.",
  upload_err_server_timeout: "O envio demorou demasiado. Usa um ficheiro mais pequeno ou tenta mais tarde.",
  upload_err_preview:
    "Não foi possível mostrar a pré-visualização neste browser. O ficheiro pode ser usado na mesma ao gerar.",
  upload_err_payload_video:
    "Ficheiro demasiado grande para envio directo. Aguarda o upload para a nuvem (barra de progresso) ou usa um clip mais curto.",
  upload_err_image_large: "Imagem demasiado grande. Máximo 10 MB.",
  upload_err_video_large: "Vídeo demasiado grande. Máximo 200 MB.",
  upload_err_file_large: "Ficheiro demasiado grande. Tenta um mais pequeno.",
  upload_err_cloud: "Falhou o envio para a nuvem. Tenta outra vez ou usa um ficheiro mais pequeno.",
  upload_err_server:
    "A geração falhou no servidor. Tenta outra vez; se continuar, fala com a Sofia no suporte.",
  upload_err_maintenance:
    "Servidor temporariamente indisponível. Tenta em breve ou contacta o suporte (Sofia / suporte@remakepix.com).",
  upload_err_video_type: "Formato de vídeo não aceite. Usa MP4, MOV, WEBM ou 3GP.",
  upload_err_video_network:
    "Rede instável durante o envio do vídeo. Mantém o Wi‑Fi/dados e toca em «Tentar upload outra vez».",
  upload_err_video_auth: "Sessão expirada. Entra outra vez e volta a enviar o vídeo.",
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
  /* Só reescrever culpas genéricas de “internet/rede” — preservar timeouts, auth, MIME, etc. */
  const blamesConnectivity = /sem ligação|sem internet|verifica (a )?rede|verifica wi‑?fi|check (your )?network|network error/i.test(m)
    && !/timeout|demorou|sessão|autentic|formato|MIME|S3|Blob|nuvem|payload|413|401|403/i.test(m);
  if (!blamesConnectivity) return m;
  if (isBrowserOnlineFlag()) {
    if (ctx === "video_preview" || /preview|pré-visualiz|codec|HEVC/i.test(m)) {
      return tr("upload_err_preview", t);
    }
    if (ctx === "video_upload") return tr("upload_err_video_network", t);
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

  // NSFW / safety / opaque API junk → shared friendly keys (err_nsfw_*, err_contact_support)
  const friendly = mapFriendlyGenerationError(raw, t)
    || mapFriendlyGenerationError(
      typeof err?.response?.data?.detail === "string" ? err.response.data.detail : "",
      t,
    );
  if (friendly) return friendly;

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

  if (/formato inválido|unsupported|content.?type|allowedContentTypes|not allowed/i.test(raw)) {
    if (ctx === "video_upload" || /vídeo|video/i.test(raw)) {
      return tr("upload_err_video_type", t);
    }
  }

  if (/FUNCTION_INVOCATION_FAILED|A server error has occurred/i.test(raw)) {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string" && detail.trim() && !/server error has occurred/i.test(detail)) {
      return mapFriendlyGenerationError(detail, t) || humanizeGenerationError(detail, t);
    }
    return tr("upload_err_maintenance", t);
  }

  const status = err?.response?.status;
  const detailFromBody = typeof err?.response?.data?.detail === "string"
    ? err.response.data.detail.trim()
    : "";

  if (status === 401) {
    return tr("upload_err_video_auth", t);
  }

  if (status === 413) {
    if (detailFromBody) return detailFromBody;
    if (ctx === "video_upload" || /vídeo|video/i.test(raw)) {
      return tr("upload_err_video_large", t);
    }
    if (ctx === "image_upload" || ctx === "image_pick") {
      return tr("upload_err_image_large", t);
    }
    return tr("upload_err_file_large", t);
  }
  if (status === 400 && (ctx === "video_upload" || /vídeo|video|formato/i.test(raw))) {
    if (detailFromBody) return detailFromBody;
    return tr("upload_err_video_type", t);
  }
  if (status === 500) {
    if (detailFromBody) {
      return mapFriendlyGenerationError(detailFromBody, t)
        || humanizeGenerationError(detailFromBody, t);
    }
    return tr("upload_err_server", t);
  }
  // Prefer API detail for 502/503/504 (e.g. brand-campaign analyze) over generic maintenance copy.
  if (status === 502 || status === 503 || status === 504) {
    if (detailFromBody && !/server error has occurred|FUNCTION_INVOCATION/i.test(detailFromBody)) {
      return mapFriendlyGenerationError(detailFromBody, t) || detailFromBody;
    }
    return tr("upload_err_maintenance", t);
  }

  if (status != null && status >= 400) {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      const mapped = mapFriendlyGenerationError(detail, t);
      if (mapped) return mapped;
      // Avoid dumping opaque API detail; suggest support for unknown 5xx-ish noise
      if (status >= 500 || detail.length > 200) return humanizeGenerationError("", t);
      return detail.trim();
    }
    if (status === 402) return tr("common_need_credits", t) !== "common_need_credits"
      ? tr("common_need_credits", t)
      : "Créditos insuficientes.";
    if (status === 429) return "Demasiados pedidos. Espera um minuto.";
    if (status >= 500) return humanizeGenerationError("", t);
    return humanizeGenerationError(`HTTP ${status}`, t);
  }

  if (err?.name === "AbortError" || err?.code === "ECONNABORTED" || /timeout|demorou demasiado|esgotado/i.test(raw)) {
    return tr("upload_err_server_timeout", t);
  }

  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
    if (ctx === "video_upload") {
      return isBrowserOnlineFlag()
        ? tr("upload_err_video_network", t)
        : offlineMessage(t);
    }
    return isBrowserOnlineFlag()
      ? tr("upload_err_send_online_short", t)
      : offlineMessage(t);
  }

  if (!err?.response) {
    if (/upload em nuvem|blob|cloud|nuvem|S3/i.test(raw)) {
      return raw.trim() || tr("upload_err_cloud", t);
    }
    if (/Failed to fetch|Load failed|fetch failed|NetworkError/i.test(raw)) {
      if (ctx === "video_preview") return tr("upload_err_preview", t);
      if (ctx === "video_upload") {
        return isBrowserOnlineFlag()
          ? tr("upload_err_video_network", t)
          : offlineMessage(t);
      }
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
  if (typeof detail === "string") {
    const mapped = mapFriendlyGenerationError(detail, t);
    if (mapped) return mapped;
    return detail;
  }
  if (err?.message) {
    const msg = sanitizeLegacyInternetMessage(err.message, ctx, t);
    return mapFriendlyGenerationError(msg, t) || msg;
  }
  return mapFriendlyGenerationError(fallback, t) || fallback;
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
