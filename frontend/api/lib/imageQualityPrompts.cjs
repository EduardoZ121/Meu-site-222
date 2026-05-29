/** Sufixos de qualidade aplicados automaticamente a gerações de imagem. */

const POSITIVE_SUFFIX =
  ", same person, exact same face, preserve face identity 100%, preserve exact skin tone and ethnicity, "
  + "no skin tone shift, no lightening or darkening of skin, consistent age, highly detailed face, sharp eyes, "
  + "natural skin texture with accurate undertones for all ethnicities including melanin-rich skin, "
  + "anatomically correct body, perfect proportions, symmetric natural features, seamless compositing, "
  + "no deformations, no morphing artifacts";

const NEGATIVE_PROMPT =
  "deformed, ugly, bad anatomy, extra limbs, fused fingers, mutated hands, deformed face, warped face, "
  + "asymmetrical face, melted face, wrong skin tone, bleached skin, ashy skin, skin tone shift, "
  + "different person, old, wrinkled, bad proportions, floating head, pasted cutout, sticker overlay, "
  + "disjointed face, text overlapping face, letters through face";

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

function finalizeImagePrompt(prompt, { modelKey, posterFood, poster, hasPersonPhoto } = {}) {
  const base = String(prompt || "").trim();
  if (!base) return base;

  if (poster) {
    if (posterFood) {
      return applyImageQualityNegative(base, { modelKey });
    }
    if (hasPersonPhoto) {
      return applyImageQualityNegative(applyImageQualityPositive(base), { modelKey });
    }
    return applyImageQualityNegative(base, { modelKey });
  }

  if (posterFood) {
    return applyImageQualityNegative(base, { modelKey });
  }
  return applyImageQualityNegative(applyImageQualityPositive(base), { modelKey });
}

module.exports = {
  POSITIVE_SUFFIX,
  NEGATIVE_PROMPT,
  applyImageQualityPositive,
  applyImageQualityNegative,
  finalizeImagePrompt,
};
