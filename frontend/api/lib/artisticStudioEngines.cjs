/**
 * AI Lab (admin) — Qwen Image Edit 2511 (melhor consistência de rosto/corpo).
 * Override: ARTISTIC_LAB_QWEN_MODEL=qwen/qwen-image-edit (versão antiga)
 */

const QWEN_EDIT_MODEL =
  String(process.env.ARTISTIC_LAB_QWEN_MODEL || "").trim() || "qwen/qwen-image-edit-2511";

const STYLIZED_CATEGORIES = new Set([
  "anime_manga",
  "cartoon",
  "illustration",
  "digital",
  "classic",
  "modern",
  "fantasy",
  "vintage",
]);

function isNsfwStyleId(styleId) {
  const id = String(styleId || "").trim();
  if (!id) return false;
  return id.startsWith("lab_") || id.startsWith("nsfw_");
}

function isStylizedCategory(styleCat) {
  return STYLIZED_CATEGORIES.has(String(styleCat || "").trim());
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

function resolveKontextPhotoModel() {
  return {
    modelKey: "kontext",
    modelId: String(process.env.ARTISTIC_KONTEXT_MODEL || "").trim()
      || "black-forest-labs/flux-kontext-max",
    label: "Flux Kontext",
  };
}

/** Foto + estilo ilustrado/anime → Kontext (mudança de medium). Foto + fotografia → Klein (retoque leve). */
function resolveArtisticStudioModel({ styleId, hasPhoto, styleCat }) {
  if (isNsfwStyleId(styleId)) {
    if (!hasPhoto) {
      const err = new Error("AI Lab exige uma foto (Qwen Image Edit edita a referência).");
      err.status = 400;
      throw err;
    }
    return resolveArtisticLabModel();
  }
  if (hasPhoto) {
    if (isStylizedCategory(styleCat)) {
      return resolveKontextPhotoModel();
    }
    return resolveStylizedPhotoModel();
  }
  return null;
}

module.exports = {
  QWEN_EDIT_MODEL,
  STYLIZED_CATEGORIES,
  isNsfwStyleId,
  isStylizedCategory,
  resolveArtisticLabModel,
  resolveStylizedPhotoModel,
  resolveKontextPhotoModel,
  resolveArtisticStudioModel,
};
