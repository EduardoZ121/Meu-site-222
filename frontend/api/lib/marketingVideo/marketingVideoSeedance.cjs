/**
 * Seedance 2.0 input builder (Replicate).
 */
const { getMarketingVideoProvider } = require("./marketingVideoModels.cjs");

function buildSeedanceInput({
  prompt,
  imageUrls,
  duration,
  providerId,
}) {
  const provider = getMarketingVideoProvider(providerId);
  const urls = (imageUrls || []).filter(Boolean).slice(0, provider.maxReferenceImages);
  if (!urls.length) {
    const err = new Error("Envia pelo menos uma imagem.");
    err.status = 400;
    throw err;
  }

  const dur = Math.min(provider.maxDuration, Math.max(4, Math.round(Number(duration) || 6)));

  return {
    modelId: provider.replicateModel,
    providerId: provider.id,
    input: {
      prompt: String(prompt || "").trim(),
      reference_images: urls,
      duration: dur,
      aspect_ratio: provider.defaultAspect,
      resolution: provider.defaultResolution,
      generate_audio: provider.generateAudio,
    },
  };
}

module.exports = {
  buildSeedanceInput,
};
