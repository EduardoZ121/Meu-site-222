/** Sufixos automáticos no servidor — Estúdio Artístico evita forçar “rosto detalhado” em texto. */

const POSITIVE_SUFFIX =
  ", same person, exact same face, preserve face identity 100%, consistent age, highly detailed face, sharp eyes, natural skin texture, anatomically correct body, perfect proportions, no deformations";

const NEGATIVE_PROMPT =
  "deformed, ugly, bad anatomy, extra limbs, fused fingers, mutated hands, deformed face, old, wrinkled, different person, bad proportions";

const NEGATIVE_INLINE = ` Avoid: ${NEGATIVE_PROMPT}.`;

const ARTISTIC_PHOTO_NEGATIVE =
  "different person, face morph, aged face, looks older, looks younger, added wrinkles, sagging skin, gray hair from aging, "
  + "deformed face, warped face, melted face, wrong skin tone, bleached skin, skin tone shift, bad anatomy, "
  + "over-retouched plastic skin, uncanny valley";

const ARTISTIC_TEXT_NEGATIVE =
  "aged face, looks older, added wrinkles, sagging skin, gray hair from aging, deformed face, different person, bad anatomy";

const ARTISTIC_PHOTO_NEGATIVE_INLINE = ` Avoid: ${ARTISTIC_PHOTO_NEGATIVE}.`;
const ARTISTIC_TEXT_NEGATIVE_INLINE = ` Avoid: ${ARTISTIC_TEXT_NEGATIVE}.`;

const HD_QUALITY_SUFFIX =
  "\n\nUltra high detail, sharp focus, professional photography quality, 8K clarity, refined textures.";

function appendHdQualityPrompt(prompt, wantsHd) {
  if (!wantsHd) return String(prompt || "").trim();
  const base = String(prompt || "").trim();
  if (!base || base.includes("8K clarity")) return base;
  return `${base}${HD_QUALITY_SUFFIX}`;
}

/** Pro retouch: map slider 0–100 to a prompt the model can follow at every step. */
function buildProIntensitySuffix(intensity) {
  const n = Math.max(0, Math.min(100, Number(intensity)));
  if (!Number.isFinite(n)) return "";
  if (n < 34) {
    return `\n\nApply a very subtle, gentle enhancement (intensity ${n}/100). Do not change apparent age or add facial lines.`;
  }
  if (n > 66) {
    return `\n\nApply a stronger visible enhancement (intensity ${n}/100) while strictly preserving identity and exact apparent age — never add wrinkles, aged texture, or make the subject look older.`;
  }
  return `\n\nApply a balanced professional enhancement (intensity ${n}/100). Preserve identity and natural skin texture.`;
}

function applyImageQualityPositive(prompt) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (base.includes("preserve face identity 100%")) return base;
  return `${base}${POSITIVE_SUFFIX}`;
}

function applyImageQualityNegative(prompt) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (base.includes("deformed, ugly, bad anatomy")) return base;
  return `${base}${NEGATIVE_INLINE}`;
}

function applyArtisticPhotoNegative(prompt) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (base.includes("looks older")) return base;
  return `${base}${ARTISTIC_PHOTO_NEGATIVE_INLINE}`;
}

function applyArtisticTextNegative(prompt) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (base.includes("looks older")) return base;
  return `${base}${ARTISTIC_TEXT_NEGATIVE_INLINE}`;
}

function finalizeImagePrompt(prompt, {
  posterFood,
  poster,
  hasPersonPhoto,
  photoEdit,
  artisticPhotoEdit,
  artisticTextOnly,
} = {}) {
  const base = String(prompt || "").trim();
  if (!base) return base;

  if (artisticPhotoEdit) {
    return applyArtisticPhotoNegative(base);
  }

  if (artisticTextOnly) {
    return applyArtisticTextNegative(base);
  }

  if (photoEdit) {
    return applyArtisticPhotoNegative(base);
  }

  if (poster) {
    if (posterFood) return applyImageQualityNegative(base);
    if (hasPersonPhoto) return applyImageQualityNegative(applyImageQualityPositive(base));
    return applyImageQualityNegative(base);
  }

  if (posterFood) return applyImageQualityNegative(base);
  return applyImageQualityNegative(applyImageQualityPositive(base));
}

module.exports = {
  POSITIVE_SUFFIX,
  NEGATIVE_PROMPT,
  HD_QUALITY_SUFFIX,
  appendHdQualityPrompt,
  buildProIntensitySuffix,
  applyImageQualityPositive,
  applyImageQualityNegative,
  applyArtisticPhotoNegative,
  applyArtisticTextNegative,
  finalizeImagePrompt,
};
