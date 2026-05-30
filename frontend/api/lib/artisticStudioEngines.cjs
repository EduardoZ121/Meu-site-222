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

function isPhotographyStyleId(styleId) {
  const id = String(styleId || "").trim();
  if (!id) return false;
  return id.startsWith("photo_");
}

/** Fotografia com foto → Qwen 2511 (safety off, melhor identidade). Sem foto → Flux Klein. */
function resolvePhotographyModel(hasPhoto) {
  if (hasPhoto) {
    return resolveArtisticLabModel();
  }
  return {
    modelKey: "artistic",
    modelId: String(process.env.ARTISTIC_PHOTO_FLUX_MODEL || "").trim()
      || "black-forest-labs/flux-2-klein-9b",
    label: "Flux 2 Klein",
  };
}

function isPhotographyRequest(styleId, styleCat) {
  if (isPhotographyStyleId(styleId)) return true;
  return String(styleCat || "").trim().toLowerCase() === "photography";
}

function resolveArtisticLabModel() {
  return {
    modelKey: "qwen",
    modelId: QWEN_EDIT_MODEL,
    label: "Qwen Image Edit 2511",
  };
}

/** Estilos artísticos (anime, cartoon, etc.) com foto → Flux Klein — igual ao backend legado. */
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
  isPhotographyStyleId,
  isPhotographyRequest,
  resolveArtisticLabModel,
  resolvePhotographyModel,
  resolveStylizedPhotoModel,
};
