/**
 * Mensagens HTTP / rede (regra: não assumir falha de internet sem navigator.onLine).
 */

function isBrowserOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

function networkHint() {
  return isBrowserOnline()
    ? "Tenta outra vez ou recarrega a página (Ctrl+F5)."
    : "Sem ligação à internet. Liga-te à rede e tenta outra vez.";
}

/**
 * @param {unknown} err
 * @param {string} [fallback]
 * @param {{ context?: "video_preview" | "video_upload" | "image_upload" }} [opts]
 */
export function formatHttpError(err, fallback = "Falhou.", opts = {}) {
  const raw = String(err?.response?.data?.detail || err?.message || "");
  const ctx = opts.context || "";

  if (/preview|pré-visualiz|codec|HEVC|canPlayType/i.test(raw) || ctx === "video_preview") {
    return "Não foi possível pré-visualizar o vídeo. Verifique o formato ou tente novamente.";
  }

  if (/FUNCTION_INVOCATION_FAILED|A server error has occurred/i.test(raw)) {
    return "Servidor temporariamente indisponível. Recarrega a página em 30 segundos e tenta de novo.";
  }
  const status = err?.response?.status;

  if (status === 413) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
    if (ctx === "video_upload" || /vídeo|video/i.test(raw)) {
      return "Vídeo muito grande. Máximo 50MB.";
    }
    if (ctx === "image_upload") {
      return "Imagem muito grande. Máximo 5 MB.";
    }
    return "Ficheiro demasiado grande para enviar. Tenta um mais pequeno.";
  }
  if (status === 500) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
    return "Erro no servidor. Tenta dentro de 1 minuto.";
  }
  if (status === 502 || status === 503) return "Servidor em manutenção.";
  if (status === 504) return "Servidor em manutenção.";

  if (status != null && status >= 400) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return `Erro ${status}: ${detail.trim()}`;
    if (status === 404) return "Erro 404: não encontrado.";
    if (status === 401) return "Erro 401: sessão expirada. Entra novamente.";
    if (status === 402) return "Erro 402: créditos insuficientes.";
    if (status === 429) return "Erro 429: demasiados pedidos. Espera um minuto.";
    return `Erro HTTP ${status}.`;
  }

  if (err?.name === "AbortError" || err?.code === "ECONNABORTED" || /timeout/i.test(err?.message || "")) {
    return "Servidor demorou muito. Clica em 'Tentar novamente'.";
  }

  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
    return isBrowserOnline()
      ? "Ligação interrompida com o servidor. Tenta outra vez."
      : "Sem ligação à internet. Liga-te à rede e tenta outra vez.";
  }

  if (!err?.response) {
    if (/upload em nuvem|blob|cloud|nuvem/i.test(raw)) {
      return raw.trim() || `Falhou o upload em nuvem. ${networkHint()}`;
    }
    if (/Failed to fetch|Load failed|fetch failed|NetworkError/i.test(raw)) {
      if (ctx === "video_preview") {
        return "Não foi possível pré-visualizar o vídeo. Verifique o formato ou tente novamente.";
      }
      return isBrowserOnline()
        ? "O pedido não chegou ao servidor. Recarrega (Ctrl+F5) e tenta outra vez."
        : "Sem ligação à internet. Liga-te à rede e tenta outra vez.";
    }
    if (/timeout|demorou demasiado|ECONNABORTED|Tempo esgotado|esgotado/i.test(raw) || err?.code === "ECONNABORTED") {
      return raw.trim() || "O servidor demorou demasiado. Tenta com um ficheiro mais pequeno ou mais tarde.";
    }
    if (err?.message && String(err.message).trim()) {
      const msg = String(err.message).trim();
      if (/Verifica a (tua )?internet|ligação/i.test(msg) && isBrowserOnline() && ctx === "video_preview") {
        return "Não foi possível pré-visualizar o vídeo. Verifique o formato ou tente novamente.";
      }
      return msg;
    }
    if (ctx === "video_preview") {
      return "Não foi possível pré-visualizar o vídeo. Verifique o formato ou tente novamente.";
    }
    return isBrowserOnline()
      ? (fallback || "Não houve resposta do servidor. Tenta outra vez.")
      : `Não houve resposta do servidor. ${networkHint()}`;
  }

  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (err?.message) return err.message;
  return fallback;
}
