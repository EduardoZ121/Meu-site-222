/**
 * Client-side error copy — mirrors frontend/api/lib/generationErrors.cjs.
 */

const GENERATION_COPY = {
  pt: {
    timeout:
      "A geração demorou demasiado e foi cancelada. Os créditos foram devolvidos — tenta outra vez com um prompt mais simples.",
    empty:
      "O modelo não devolveu nenhuma imagem. Os créditos foram devolvidos — tenta outro prompt ou proporção.",
    capacity:
      "O servidor de IA está ocupado. Espera um minuto e tenta de novo — os créditos foram devolvidos.",
    content:
      "O modelo recusou este pedido (política de conteúdo). Os créditos foram devolvidos — tenta um prompt mais neutro.",
    generic:
      "A geração falhou. Os teus créditos foram devolvidos automaticamente.",
    noResult: "A geração terminou sem ficheiro de resultado. Os créditos foram devolvidos.",
    pollTimeout:
      "Tempo esgotado — a geração pode ainda estar em curso. Verifica a Galeria daqui a 1 min.",
  },
  en: {
    timeout:
      "Generation took too long and was cancelled. Credits refunded — try again with a simpler prompt.",
    empty:
      "The model returned no image. Credits refunded — try a different prompt or aspect ratio.",
    capacity:
      "The AI service is busy. Wait a minute and try again — credits refunded.",
    content:
      "The model refused this request (content policy). Credits were refunded — try a neutral prompt.",
    generic:
      "Generation failed. Your credits were refunded automatically.",
    noResult: "Generation finished with no output file. Credits were refunded.",
    pollTimeout:
      "Timed out — generation may still be running. Check Gallery in about a minute.",
  },
  es: {
    timeout:
      "La generación tardó demasiado y se canceló. Créditos devueltos — prueba con un prompt más simple.",
    empty: "El modelo no devolvió ninguna imagen. Créditos devueltos.",
    capacity: "El servicio de IA está ocupado. Espera un minuto — créditos devueltos.",
    content:
      "El modelo rechazó esta solicitud (política de contenido). Créditos devueltos — prueba un prompt neutro.",
    generic: "La generación falló. Tus créditos se devolvieron automáticamente.",
    noResult: "La generación terminó sin archivo de resultado. Créditos devueltos.",
    pollTimeout:
      "Tiempo agotado — la generación puede seguir en curso. Revisa la Galería en 1 min.",
  },
  fr: {
    timeout:
      "La génération a pris trop de temps. Crédits remboursés — réessayez avec un prompt plus simple.",
    empty: "Le modèle n'a renvoyé aucune image. Crédits remboursés.",
    capacity: "Le service IA est saturé. Attendez une minute — crédits remboursés.",
    content:
      "Le modèle a refusé cette demande (politique de contenu). Crédits remboursés — essayez un prompt neutre.",
    generic: "Échec de la génération. Vos crédits ont été remboursés automatiquement.",
    noResult: "Génération terminée sans fichier de sortie. Crédits remboursés.",
    pollTimeout:
      "Délai dépassé — la génération peut encore être en cours. Vérifiez la Galerie dans 1 min.",
  },
};

export function getClientLang() {
  try {
    const raw = localStorage.getItem("i18nextLng") || "en";
    const lang = String(raw).split("-")[0].toLowerCase();
    return GENERATION_COPY[lang] ? lang : "en";
  } catch {
    return "en";
  }
}

function pickCopy(lang) {
  return GENERATION_COPY[lang] || GENERATION_COPY.en;
}

/** @param {string} raw @param {string} [lang] */
export function formatGenerationFailure(raw, lang = getClientLang()) {
  const msg = String(raw || "").trim();
  const lower = msg.toLowerCase();
  const L = pickCopy(lang);

  if (/timeout|timed out|deadline|took too long|exceeded|tempo esgotado|time.?out/i.test(lower)) {
    return L.timeout;
  }
  if (/empty output|no output|no image|no urls|null output|sem resultado|sem ficheiro|no result/i.test(lower)) {
    return L.empty;
  }
  if (/rate limit|too many requests|503|502|overloaded|capacity|busy|ocupado/i.test(lower)) {
    return L.capacity;
  }
  if (/nsfw|safety|moderation|content.?policy|blocked|refused|explicit|adult|inappropriate|violat/i.test(lower)) {
    return L.content;
  }
  if (!msg || /^generation failed\.?$/i.test(msg) || /^failed\.?$/i.test(msg)
    || /^a geração falhou\.?$/i.test(msg) || /^geração falhou\.?$/i.test(msg)) {
    return L.generic;
  }
  if (msg.length > 220) return L.generic;
  return msg;
}

export function formatPollTimeout(lang = getClientLang()) {
  return pickCopy(lang).pollTimeout;
}

export function formatNoResultError(lang = getClientLang()) {
  return pickCopy(lang).noResult;
}

/** Map known API detail strings to i18n keys (resolved by caller's t()). */
export function matchApiDetailKey(detail, status) {
  const d = String(detail || "").trim();
  const lower = d.toLowerCase();
  if (status === 402 || /créditos insuficientes|insufficient credits|not enough credits/i.test(lower)) {
    return "common_err_insufficient_credits";
  }
  if (/nsfw|safety|moderation|content.?policy|blocked|refused|explicit|adult content|inappropriate/i.test(lower)) {
    return "studio_err_content_blocked";
  }
  if (status === 401 || /sessão|session expir|não autenticado|not authenticated|unauthorized/i.test(lower)) {
    return "common_err_session_expired";
  }
  if (status === 429 || /rate limit|too many requests|demasiados pedidos/i.test(lower)) {
    return "common_err_rate_limit";
  }
  if (/conta suspensa|account suspended/i.test(lower)) return "common_err_account_suspended";
  return null;
}
