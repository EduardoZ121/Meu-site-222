/** Sufixos de qualidade aplicados automaticamente a gerações de imagem. */

const POSITIVE_SUFFIX =
  ", same person, exact same face, preserve face identity 100%, consistent age, highly detailed face, sharp eyes, natural skin texture, anatomically correct body, perfect proportions, no deformations";

/** Edição com foto (estúdio artístico, Pro, etc.) — sem forçar micro-detalhe que envelhece o rosto. */
const PHOTO_EDIT_POSITIVE_SUFFIX =
  ", same person, exact same face, preserve face identity 100%, preserve exact age from reference photo, "
  + "no aging, no added wrinkles, same skin tone and ethnicity, natural proportions, seamless in-place edit";

const NEGATIVE_PROMPT =
  "deformed, ugly, bad anatomy, extra limbs, fused fingers, mutated hands, deformed face, old, wrinkled, different person, bad proportions";

const PHOTO_EDIT_NEGATIVE_PROMPT =
  "deformed, ugly, bad anatomy, deformed face, warped face, asymmetrical face, melted face, "
  + "different person, aged face, looks older than reference, added wrinkles, sagging skin, "
  + "gray hair from aging, wrong skin tone, bleached skin, skin tone shift, face morph, bad proportions";

const NEGATIVE_INLINE = ` Avoid: ${NEGATIVE_PROMPT}.`;
const PHOTO_EDIT_NEGATIVE_INLINE = ` Avoid: ${PHOTO_EDIT_NEGATIVE_PROMPT}.`;

function applyImageQualityPositive(prompt) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (base.includes("preserve face identity 100%")) return base;
  return `${base}${POSITIVE_SUFFIX}`;
}

function applyPhotoEditPositive(prompt) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (base.includes("preserve exact age from reference")) return base;
  return `${base}${PHOTO_EDIT_POSITIVE_SUFFIX}`;
}

/** Flux/Grok sem negative_prompt nativo — reforço no texto do prompt. */
function applyImageQualityNegative(prompt) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (base.includes("deformed, ugly, bad anatomy")) return base;
  return `${base}${NEGATIVE_INLINE}`;
}

function applyPhotoEditNegative(prompt) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (base.includes("looks older than reference")) return base;
  return `${base}${PHOTO_EDIT_NEGATIVE_INLINE}`;
}

function finalizeImagePrompt(prompt, { posterFood, poster, hasPersonPhoto, photoEdit } = {}) {
  const base = String(prompt || "").trim();
  if (!base) return base;

  if (photoEdit) {
    return applyPhotoEditNegative(applyPhotoEditPositive(base));
  }

  if (poster) {
    if (posterFood) {
      return applyImageQualityNegative(base);
    }
    if (hasPersonPhoto) {
      return applyImageQualityNegative(applyImageQualityPositive(base));
    }
    return applyImageQualityNegative(base);
  }

  if (posterFood) {
    return applyImageQualityNegative(base);
  }
  return applyImageQualityNegative(applyImageQualityPositive(base));
}

module.exports = {
  POSITIVE_SUFFIX,
  PHOTO_EDIT_POSITIVE_SUFFIX,
  NEGATIVE_PROMPT,
  PHOTO_EDIT_NEGATIVE_PROMPT,
  applyImageQualityPositive,
  applyPhotoEditPositive,
  applyImageQualityNegative,
  applyPhotoEditNegative,
  finalizeImagePrompt,
};
