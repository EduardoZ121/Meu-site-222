/**
 * Shared friendly generation / API error mapping.
 * Keys are stable for i18n + sibling agents: err_nsfw_blocked, err_safety_blocked,
 * err_moderation, err_contact_support, err_insufficient_credits, err_maintenance.
 */

const NSFW_RE =
  /nsfw|not\s*safe\s*for\s*work|explicit\s*content|adult\s*content|sexual\s*content|pornograph|nude\s*content|nudity|erotic|\bnude\b|\bnaked\b|conteúdo (sensível|adulto)|contenido (sensible|adulto)/i;

const SAFETY_RE =
  /e005|flagged\s*as\s*sensitive|input\s*or\s*output\s*was\s*flagged|safety[\s_-]*(checker|filter|system)|content[\s_-]*(policy|filter|moderation)|política de conteúdo|filtro de segurança|flagged|blocked\s*by\s*(the\s*)?(model|safety|filter)|unsafe\s*content|sensitive\s*content|violat(es|ion)|against\s*(our|the)\s*(policies|guidelines)|openai.*refus|refus(ed|es|al)\s*to\s*(generate|create|assist|help)|i\s*can'?t\s*(assist|help)|i'?m\s*(not\s*|unable\s*to\s*)?(able|allowed)\s*to|cannot\s*(assist|help|generate)|couldn'?t\s*generate.*policy|output\s*blocked|image\s*was\s*filtered|filtered\s*out|moderat(ed|ion)|prohibited|harmful\s*content/i;

/** MIME / upload "not allowed" — must NOT map to NSFW. */
const UPLOAD_MIME_RE =
  /content.?type|allowedContentTypes|formato inválido|unsupported (media|file|format|type)|mime|not allowed.*(type|format|file)|file type.*not allowed/i;

const PROVIDER_BILLING_RE =
  /insufficient credit.*(replicate|account)?|replicate.*(insufficient|out of credit)|spend(ing)? limit|payment required|add (a )?payment method|out of credit|ran out of credit|quota exceeded/i;

const JUNK_RE =
  /traceback|stack\s*trace|ECONNREFUSED|ENOTFOUND|socket hang up|internal server error|FUNCTION_INVOCATION|Request failed with status|axioserror|unexpected token|json\.parse|replicate\.com\/v1|prediction\.error|undefined is not|null is not|TypeError:|ReferenceError:|Erro do servidor|A server error has occurred/i;

const FALLBACK = {
  err_nsfw_blocked:
    "This request was blocked for sensitive or adult content (NSFW). Try a different prompt or image — credits for this attempt are usually refunded.",
  err_safety_blocked:
    "The AI safety filter blocked this generation. Soften the prompt or try another photo. Credits for this attempt are usually refunded.",
  err_moderation:
    "This content didn’t pass moderation. Adjust the prompt or reference image and try again.",
  err_contact_support:
    "Something went wrong with this generation. Try again in a moment. If it keeps happening, talk to Sofia in the support chat or email suporte@remakepix.com.",
  err_insufficient_credits: "Not enough credits. Buy more in Billing.",
  err_maintenance:
    "The generation service is temporarily unavailable. Your credits were refunded. Try again later or contact support.",
};

function tr(key, t) {
  if (typeof t === "function") {
    const v = t(key);
    if (v && v !== key) return v;
  }
  return FALLBACK[key] || key;
}

function looksAlreadyHumanized(raw) {
  return (
    /créditos (foram )?devolvidos|credits refunded|créditos remboursés|créditos devueltos/i.test(raw)
    || /bloqueado por conteúdo sensível|blocked for sensitive|filtro de segurança|safety filter blocked|política de conteúdo|content policy\s*\/\s*NSFW|isn't allowed \(NSFW\)|não é permitido \(NSFW\)/i.test(raw)
    || /serviço de geração está temporariamente|generation service is temporarily unavailable/i.test(raw)
  );
}

export function isNsfwOrSafetyError(message) {
  const m = String(message || "");
  if (!m.trim() || UPLOAD_MIME_RE.test(m)) return false;
  return NSFW_RE.test(m) || SAFETY_RE.test(m);
}

/**
 * Map raw API / Replicate / model errors to a friendly user-facing string.
 * Returns null if no special mapping applies (caller keeps original / other handlers).
 */
export function mapFriendlyGenerationError(rawMessage, t) {
  const raw = String(rawMessage || "").trim();
  if (!raw) return null;

  // Upload MIME / format — never treat as NSFW
  if (UPLOAD_MIME_RE.test(raw)) return null;

  // Already polished by API or previous pass — keep language as-is
  if (looksAlreadyHumanized(raw)) return raw;

  if (/cr[eé]ditos (hq )?insuficientes|insufficient (premium )?credits/i.test(raw)) {
    return raw;
  }

  if (PROVIDER_BILLING_RE.test(raw)) {
    return tr("err_maintenance", t);
  }

  if (NSFW_RE.test(raw)) return tr("err_nsfw_blocked", t);

  if (SAFETY_RE.test(raw)) {
    if (/moderat/i.test(raw) && !/content[\s_-]*policy|safety|nsfw|flagged|política/i.test(raw)) {
      return tr("err_moderation", t);
    }
    if (/\bnsfw\b|adult|sexual|explicit|nude|pornograph/i.test(raw)) {
      return tr("err_nsfw_blocked", t);
    }
    return tr("err_safety_blocked", t);
  }

  // Opaque junk / stack dumps → contact support (don’t show raw API noise)
  if (JUNK_RE.test(raw) || raw.length > 280) {
    return tr("err_contact_support", t);
  }

  // Generic English/Portuguese failure without useful detail
  if (
    /^(failed|falhou|error|erro|generation failed|geração falhou|prediction failed|a geração falhou)\.?$/i.test(raw)
    || /^erro\s*\d{3}\s*:?\s*$/i.test(raw)
    || /^erro\s*\d{3}\s*:/i.test(raw)
    || /^Erro HTTP\s*\d+/i.test(raw)
  ) {
    return tr("err_contact_support", t);
  }

  return null;
}

/** Always returns a string — mapped or original (trimmed). */
export function humanizeGenerationError(rawMessage, t, fallbackKey = "err_contact_support") {
  const mapped = mapFriendlyGenerationError(rawMessage, t);
  if (mapped) return mapped;
  const raw = String(rawMessage || "").trim();
  if (raw) return raw;
  return tr(fallbackKey, t);
}
