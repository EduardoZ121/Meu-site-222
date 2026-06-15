/**
 * Variações de layout para templates da categoria flyers.
 * Cada template base tem 5 estilos (1 = original + 4 prompts ocultos).
 */

import { POSTER_REFERENCE_PERSON } from "./identityPrompts";
import { FLYER_PALETTES } from "./posterFlyerVariantsData.js";
import { registerPremiumStyleVariants } from "./posterPremiumFamilies.js";
import { registerExtendedStyleVariants } from "./posterExtendedFamilies.js";
import { registerRichStyleVariants } from "./posterRichFamilies.js";
import { registerSocialMarketingStyleVariants } from "./posterSocialMarketingFamilies.js";
import { registerPdfReleaseStyleVariants } from "./posterPdfReleaseFamilies.js";

/** @typedef {{ variantKey: string, labelKey?: string, label?: string, useBase?: boolean, gradient?: string, prompt?: string }} PosterFlyerVariant */

/** @type {Record<string, PosterFlyerVariant[]>} */
export const FLYER_VARIANTS_BY_TEMPLATE_ID = {};

/** @type {Record<string, PosterFlyerVariant[]>} */
export const STYLE_VARIANTS_BY_TEMPLATE_ID = {};

const VARIANT_META = [
  {
    variantKey: "classic",
    labelKey: "post_variant_classic",
    useBase: true,
    gradient: "linear-gradient(135deg,#1A1A1C 0%,#4B5563 45%,#F4F1EA 100%)",
  },
  {
    variantKey: "split",
    labelKey: "post_variant_split",
    gradient: "linear-gradient(135deg,#0B0B0C 0%,#7C3AED 42%,#EC4899 100%)",
  },
  {
    variantKey: "stacked",
    labelKey: "post_variant_stacked",
    gradient: "linear-gradient(135deg,#111827 0%,#F59E0B 50%,#FDE68A 100%)",
  },
  {
    variantKey: "diagonal",
    labelKey: "post_variant_diagonal",
    gradient: "linear-gradient(135deg,#020617 0%,#06B6D4 48%,#A855F7 100%)",
  },
  {
    variantKey: "minimal",
    labelKey: "post_variant_minimal",
    gradient: "linear-gradient(135deg,#18181B 0%,#3F3F46 55%,#E4E4E7 100%)",
  },
];

function quoteLines(texts) {
  return texts.map((p) => `"${p}"`).join("\n");
}

/** Texto que aparece no prompt (replacements), não a chave line_1. */
export function flyerDisplayTextsForTemplate(template) {
  return (template?.placeholders || []).map((key) => {
    const rep = template?.replacements?.[key];
    if (rep && String(rep).trim()) return String(rep).trim();
    return String(key).trim();
  }).filter(Boolean);
}

function buildSplitPrompt(texts, palette) {
  return `${POSTER_REFERENCE_PERSON}

Vertical editorial flyer, ${palette} duotone with bold split layout.
Subject on the left 38% of the frame, three-quarter body turned toward the right, dynamic confident pose, unified studio lighting.
Right side: tall solid color panel with oversized stacked headline (top to bottom):
${quoteLines(texts)}
Small supporting paragraph under the headline block.
Crisp sans-serif typography, high contrast, magazine cover energy, no text over the face.`;
}

function buildStackedPrompt(texts, palette) {
  return `${POSTER_REFERENCE_PERSON}

Vertical editorial flyer, ${palette} color story with stacked hierarchy.
Top third: massive centered headline in condensed display type:
${quoteLines(texts)}
Middle: subject centered, waist-up portrait, facing camera, soft key light and gentle rim light.
Bottom: narrow caption band with minimal icons and short paragraph text.
Clean grid, generous spacing, premium print poster finish, typography never overlaps the face.`;
}

function buildDiagonalPrompt(texts, palette) {
  return `${POSTER_REFERENCE_PERSON}

Vertical editorial flyer, ${palette} palette with diagonal graphic energy.
Bold diagonal color band from top-left to bottom-right cuts across the frame.
Subject positioned in the upper-right triangle, slight low-angle portrait, strong shadow depth.
Headline follows the diagonal edge in heavy brush/display lettering:
${quoteLines(texts)}
Secondary microcopy in the lower-left negative space.
Street-meets-editorial mood, gritty grain, cinematic contrast.`;
}

function buildMinimalPrompt(texts, palette) {
  return `${POSTER_REFERENCE_PERSON}

Vertical minimalist editorial flyer, ${palette} restrained palette, abundant negative space.
Thin double-line frame inset from the edges.
Subject centered smaller (about 55% frame height), calm neutral pose, soft diffused daylight.
Headline anchored bottom-left in elegant serif + sans pairing:
${quoteLines(texts)}
Tiny caption and barcode-style detail row along the bottom margin.
Quiet luxury, gallery poster aesthetic, ultra-clean typography.`;
}

export function registerFlyerVariants(templateId, displayTexts, palette) {
  const texts = displayTexts?.length ? displayTexts : ["HEADLINE"];
  const pal = palette || "editorial duotone";
  const prompts = {
    split: buildSplitPrompt(texts, pal),
    stacked: buildStackedPrompt(texts, pal),
    diagonal: buildDiagonalPrompt(texts, pal),
    minimal: buildMinimalPrompt(texts, pal),
  };

  FLYER_VARIANTS_BY_TEMPLATE_ID[templateId] = VARIANT_META.map((meta) => {
    if (meta.useBase) return { ...meta };
    return { ...meta, prompt: prompts[meta.variantKey] };
  });
  STYLE_VARIANTS_BY_TEMPLATE_ID[templateId] = FLYER_VARIANTS_BY_TEMPLATE_ID[templateId];
}

registerPremiumStyleVariants((familyId, variants) => {
  STYLE_VARIANTS_BY_TEMPLATE_ID[familyId] = variants;
});

registerExtendedStyleVariants((familyId, variants) => {
  STYLE_VARIANTS_BY_TEMPLATE_ID[familyId] = variants;
});

registerRichStyleVariants((familyId, variants) => {
  STYLE_VARIANTS_BY_TEMPLATE_ID[familyId] = variants;
});

registerSocialMarketingStyleVariants((familyId, variants) => {
  STYLE_VARIANTS_BY_TEMPLATE_ID[familyId] = variants;
});

registerPdfReleaseStyleVariants((familyId, variants) => {
  STYLE_VARIANTS_BY_TEMPLATE_ID[familyId] = variants;
});

/** Garante 5 variações para o template (API usa line_1 + replacements). */
export function ensureFlyerVariants(template) {
  const id = String(template?.id || "");
  if (!id || template?.category !== "flyers") return;
  if (FLYER_VARIANTS_BY_TEMPLATE_ID[id]?.length) return;
  const palette = FLYER_PALETTES[id] || "editorial duotone";
  registerFlyerVariants(id, flyerDisplayTextsForTemplate(template), palette);
}

export function posterTemplateHasVariants(template) {
  if (template?.styleVariants && STYLE_VARIANTS_BY_TEMPLATE_ID[template.id]?.length) {
    return true;
  }
  if (template?.category !== "flyers") return false;
  ensureFlyerVariants(template);
  return Boolean(FLYER_VARIANTS_BY_TEMPLATE_ID[template.id]?.length);
}

export function getFlyerVariants(templateId, template) {
  if (STYLE_VARIANTS_BY_TEMPLATE_ID[templateId]?.length) {
    return STYLE_VARIANTS_BY_TEMPLATE_ID[templateId];
  }
  if (template) ensureFlyerVariants(template);
  return FLYER_VARIANTS_BY_TEMPLATE_ID[templateId] || [];
}

/**
 * @param {object} base
 * @param {PosterFlyerVariant} variant
 */
export function resolvePosterWithVariant(base, variant) {
  if (!base || !variant) return base;
  return {
    ...base,
    variantParentId: base.id,
    variantKey: variant.variantKey,
    variantLabelKey: variant.labelKey,
    variantLabel: variant.label,
    prompt: variant.useBase ? base.prompt : (variant.prompt || base.prompt),
    placeholders: variant.placeholders || base.placeholders,
    replacements: variant.replacements || base.replacements,
    optional: variant.optional ?? base.optional,
    productTemplate: variant.productTemplate ?? base.productTemplate,
    requiresDualPhoto: variant.requiresDualPhoto ?? base.requiresDualPhoto,
    id: `${base.id}__${variant.variantKey}`,
  };
}
