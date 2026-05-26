/** AI Lab usa Qwen Image Edit na Replicate (só modo imagem + foto). */
export const ARTISTIC_LAB_MODEL_LABEL = "Qwen Image Edit 2511";

export function isArtisticLabRoute(styleId) {
  if (!styleId) return false;
  return styleId.startsWith("lab_") || styleId.startsWith("nsfw_");
}
