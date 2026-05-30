/**
 * AI Lab (admin) — Qwen Image Edit 2511 (melhor consistência de rosto/corpo).
 * Override: ARTISTIC_LAB_QWEN_MODEL=qwen/qwen-image-edit (versão antiga)
 */

const QWEN_EDIT_MODEL =
  String(process.env.ARTISTIC_LAB_QWEN_MODEL || "").trim() || "qwen/qwen-image-edit-2511";

function isNsfwStyleId(styleId) {
  const id = String(styleId || "").trim();
  if (!id) return false;
  return id.startsWith("lab_") || id.startsWith("nsfw_");
}

function resolveArtisticLabModel() {
  return {
    modelKey: "qwen",
    modelId: QWEN_EDIT_MODEL,
    label: "Qwen Image Edit 2511",
  };
}

/** Estilos com foto (não Lab) → Flux Klein — preserva identidade na edição. */
function resolveStylizedPhotoModel() {
  return {
    modelKey: "artistic",
    modelId: String(process.env.ARTISTIC_PHOTO_FLUX_MODEL || "").trim()
      || "black-forest-labs/flux-2-klein-9b",
    label: "Flux 2 Klein",
  };
}

module.exports = {
  QWEN_EDIT_MODEL,
  isNsfwStyleId,
  resolveArtisticLabModel,
  resolveStylizedPhotoModel,
};
