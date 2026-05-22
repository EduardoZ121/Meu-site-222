/** IDs de estilos AI Lab / experimental — partilhado frontend + documentação API. */

export const ARTISTIC_LAB_STYLE_IDS = new Set([
  "lab_qwen_edit",
  "lab_ai_rapid",
  "lab_cinematic_edit",
  "lab_advanced_prompt",
  "lab_experimental_ai",
  "lab_ultra_style",
  "lab_flux_edit",
  "lab_realistic_edit",
  "lab_hybrid_nsfw",
]);

export const ARTISTIC_EXPERIMENTAL_STYLE_IDS = new Set([
  ...ARTISTIC_LAB_STYLE_IDS,
  "nsfw_boudoir",
  "nsfw_pinup",
  "nsfw_dark",
  "nsfw_fantasy",
]);

export function isArtisticLabStyle(styleId) {
  return Boolean(styleId && ARTISTIC_LAB_STYLE_IDS.has(styleId));
}

export function isArtisticExperimentalStyle(styleId) {
  if (!styleId) return false;
  return (
    ARTISTIC_EXPERIMENTAL_STYLE_IDS.has(styleId)
    || styleId.startsWith("lab_")
    || styleId.startsWith("nsfw_")
  );
}
