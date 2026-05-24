/** Sufixos de qualidade aplicados automaticamente a gerações de imagem. */

const POSITIVE_SUFFIX =
  ", same person, exact same face, preserve face identity 100%, consistent age, highly detailed face, sharp eyes, natural skin texture, anatomically correct body, perfect proportions, no deformations";

const NEGATIVE_PROMPT =
  "deformed, ugly, bad anatomy, extra limbs, fused fingers, mutated hands, deformed face, old, wrinkled, different person, bad proportions";

const NEGATIVE_INLINE = ` Avoid: ${NEGATIVE_PROMPT}.`;

function applyImageQualityPositive(prompt) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (base.includes("preserve face identity 100%")) return base;
  return `${base}${POSITIVE_SUFFIX}`;
}

/** Flux/Grok sem negative_prompt nativo — reforço no texto do prompt. */
function applyImageQualityNegative(prompt, { modelKey } = {}) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (base.includes("deformed, ugly, bad anatomy")) return base;
  return `${base}${NEGATIVE_INLINE}`;
}

function finalizeImagePrompt(prompt, { modelKey, posterFood } = {}) {
  const base = String(prompt || "").trim();
  if (!base) return base;
  if (posterFood) {
    return applyImageQualityNegative(base, { modelKey });
  }
  return applyImageQualityNegative(applyImageQualityPositive(base), { modelKey });
}

const CLOTHES_POSITIVE_SUFFIX =
  ", single clean image, only the final result, no split screen, no before after panels, "
  + "no text, no captions, no instructions, no borders, clean photorealistic image only, "
  + "same person, exact same face and pose, only change the clothing";

const CLOTHES_NEGATIVE_EXTRA =
  "split image, two panels, before after, text on image, caption, instructions, "
  + "keep the same outfit, two panels, side by side, collage, comparison, diptych, "
  + "labeled panels, arrows, watermark";

function finalizeClothesPrompt(prompt) {
  let base = String(prompt || "").trim();
  if (!base) return base;
  if (!base.includes("single clean image")) {
    base = `${base}${CLOTHES_POSITIVE_SUFFIX}`;
  }
  base = applyImageQualityPositive(base);
  if (!base.includes("split image, two panels")) {
    base = `${base} Avoid: ${CLOTHES_NEGATIVE_EXTRA}, ${NEGATIVE_PROMPT}.`;
  }
  return base;
}

module.exports = {
  POSITIVE_SUFFIX,
  NEGATIVE_PROMPT,
  applyImageQualityPositive,
  applyImageQualityNegative,
  finalizeImagePrompt,
  finalizeClothesPrompt,
};
