/**
 * Mensagens HTTP / rede (regra: nunca “erro de rede” para respostas do servidor).
 */
export function formatHttpError(err, fallback = "Falhou.") {
  const raw = String(err?.response?.data?.detail || err?.message || "");
  if (/FUNCTION_INVOCATION_FAILED|A server error has occurred/i.test(raw)) {
    return "Servidor temporariamente indisponível. Recarrega a página em 30 segundos e tenta de novo.";
  }
  const status = err?.response?.status;

  if (status === 413) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
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
    return "Ligação interrompida. Verifica a internet e tenta outra vez.";
  }

  if (!err?.response) {
    if (/upload em nuvem|blob|cloud|nuvem/i.test(raw)) {
      return raw.trim() || "Falhou o upload em nuvem. Tenta um vídeo mais curto ou recarrega a página (Ctrl+F5).";
    }
    if (/Failed to fetch|Load failed|fetch failed|NetworkError/i.test(raw)) {
      return "O navegador não conseguiu falar com o servidor ou com a nuvem. Verifica a internet, faz Ctrl+F5 e tenta outra vez.";
    }
    if (/timeout|demorou demasiado|ECONNABORTED|Tempo esgotado|esgotado/i.test(raw) || err?.code === "ECONNABORTED") {
      return raw.trim() || "O servidor demorou demasiado. Tenta com um ficheiro mais pequeno ou mais tarde.";
    }
    if (err?.message && String(err.message).trim()) {
      return String(err.message).trim();
    }
    return "Não houve resposta do servidor. Verifica a ligação e tenta outra vez.";
  }

  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (err?.message) return err.message;
  return fallback;
}
