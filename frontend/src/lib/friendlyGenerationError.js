/**
 * Shared friendly generation / API error mapping.
 * Keys are stable for i18n + sibling agents: err_nsfw_blocked, err_safety_blocked,
 * err_moderation, err_contact_support.
 */

const NSFW_RE =
  /nsfw|not\s*safe\s*for\s*work|explicit\s*content|adult\s*content|sexual\s*content|pornograph|nude\s*content|nudity|erotic|\bnude\b|\bnaked\b/i;

const SAFETY_RE =
  /e005|flagged\s*as\s*sensitive|input\s*or\s*output\s*was\s*flagged|safety[\s_-]*(checker|filter|system)|content[\s_-]*(policy|filter|moderation)|flagged|blocked\s*by\s*(the\s*)?(model|safety|filter)|unsafe\s*content|sensitive\s*content|violat(es|ion)|against\s*(our|the)\s*(policies|guidelines)|openai.*refus|refus(ed|es|al)\s*to\s*(generate|create|assist|help)|i\s*can'?t\s*(assist|help)|i'?m\s*(not\s*|unable\s*to\s*)?(able|allowed)\s*to|cannot\s*(assist|help|generate)|couldn'?t\s*generate.*policy|output\s*blocked|image\s*was\s*filtered|filtered\s*out|moderat(ed|ion)|not\s*allowed|prohibited|harmful\s*content/i;

const JUNK_RE =
  /traceback|stack\s*trace|ECONNREFUSED|ENOTFOUND|socket hang up|internal server error|FUNCTION_INVOCATION|Request failed with status|axioserror|unexpected token|json\.parse|replicate\.com\/v1|prediction\.error|undefined is not|null is not|TypeError:|ReferenceError:|Erro do servidor|A server error has occurred|insufficient credit|out of credit|spend(ing)? limit|billing|quota exceeded/i;

const FALLBACK = {
  err_nsfw_blocked:
    "This content isn’t allowed (NSFW). Try a different image or description.",
  err_safety_blocked:
    "The AI safety filter blocked this generation. Try a different image or a softer description.",
  err_moderation:
    "This content didn’t pass moderation. Adjust the prompt or reference image and try again.",
  err_contact_support:
    "Something went wrong with this generation. Try again in a moment. If it keeps happening, talk to Sofia in the support chat or email suporte@remakepix.com.",
};

function tr(key, t) {
  if (typeof t === "function") {
    const v = t(key);
    if (v && v !== key) return v;
  }
  return FALLBACK[key] || key;
}

export function isNsfwOrSafetyError(message) {
  const m = String(message || "");
  if (!m.trim()) return false;
  return NSFW_RE.test(m) || SAFETY_RE.test(m);
}

/**
 * Map raw API / Replicate / model errors to a friendly user-facing string.
 * Returns null if no special mapping applies (caller keeps original / other handlers).
 */
export function mapFriendlyGenerationError(rawMessage, t) {
  const raw = String(rawMessage || "").trim();
  if (!raw) return null;

  // Already our polished NSFW line (any language) — keep
  if (/conteúdo não é permitido \(NSFW\)|isn'?t allowed \(NSFW\)|no está permitido \(NSFW\)|n'est pas autorisé \(NSFW\)/i.test(raw)) {
    return raw;
  }

  // Already humanized by the API (refund + guidance) — don't re-bucket into NSFW
  if (
    /créditos (foram )?devolvidos|credits refunded|créditos remboursés|créditos devueltos/i.test(raw)
    && /Sofia|suporte@remakepix|false positive|falso positivo|neutra|neutral|prompt|imagem|image|descrição|description/i.test(raw)
  ) {
    return raw;
  }

  if (NSFW_RE.test(raw)) return tr("err_nsfw_blocked", t);
  if (SAFETY_RE.test(raw)) {
    if (/moderat/i.test(raw) && !/content[\s_-]*policy|safety|nsfw|flagged/i.test(raw)) {
      return tr("err_moderation", t);
    }
    // Prefer the clear NSFW wording for policy / safety blocks (user-facing)
    if (/content.?policy|nsfw|not allowed|prohibited|flagged|safety|E005|refuse|can'?t assist|cannot assist/i.test(raw)) {
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
