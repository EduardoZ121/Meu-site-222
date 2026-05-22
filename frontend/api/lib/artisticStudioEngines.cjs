/**
 * AI Lab (admin) — sempre Qwen Image Edit na Replicate (edição com foto).
 * O Rapid AIO NSFW do Hugging Face não está publicado na Replicate; usamos
 * qwen/qwen-image-edit com disable_safety_checker (parâmetro oficial).
 *
 * Override opcional: ARTISTIC_LAB_QWEN_MODEL=usamaehsan/qwen-image-edit-fastest
 */

const QWEN_EDIT_MODEL =
  String(process.env.ARTISTIC_LAB_QWEN_MODEL || "").trim() || "qwen/qwen-image-edit";

function isNsfwStyleId(styleId) {
  const id = String(styleId || "").trim();
  if (!id) return false;
  return id.startsWith("lab_") || id.startsWith("nsfw_");
}

function resolveArtisticLabModel() {
  return {
    modelKey: "qwen",
    modelId: QWEN_EDIT_MODEL,
    label: "Qwen Image Edit (Replicate)",
  };
}

module.exports = {
  QWEN_EDIT_MODEL,
  isNsfwStyleId,
  resolveArtisticLabModel,
};
