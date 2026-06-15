/**
 * Seedance 2.0 input builder (Replicate).
 */
const { getMarketingVideoProvider } = require("./marketingVideoModels.cjs");

const SEEDANCE_PROMPT_MAX = 3900;

function clampPromptForSeedance(prompt, max = SEEDANCE_PROMPT_MAX) {
  const s = String(prompt || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastBreak = Math.max(cut.lastIndexOf("\n\n"), cut.lastIndexOf(". "));
  if (lastBreak > max * 0.65) return cut.slice(0, lastBreak + 1).trim();
  return `${cut.trim()}…`;
}

function buildSeedanceInput({
  prompt,
  imageUrls,
  duration,
  providerId,
  aspectRatio,
  generateAudio,
}) {
  const provider = getMarketingVideoProvider(providerId);
  const urls = (imageUrls || []).filter(Boolean).slice(0, provider.maxReferenceImages);
  if (!urls.length) {
    const err = new Error("Envia pelo menos uma imagem.");
    err.status = 400;
    throw err;
  }

  const dur = Math.min(provider.maxDuration, Math.max(4, Math.round(Number(duration) || 6)));
  const ratio = String(aspectRatio || provider.defaultAspect || "9:16").trim() || "9:16";
  const audio = typeof generateAudio === "boolean" ? generateAudio : provider.generateAudio;
  const safePrompt = clampPromptForSeedance(String(prompt || "").trim());

  return {
    modelId: provider.replicateModel,
    providerId: provider.id,
    input: {
      prompt: safePrompt,
      reference_images: urls,
      duration: dur,
      aspect_ratio: ratio,
      resolution: provider.defaultResolution,
      generate_audio: audio,
    },
  };
}

module.exports = {
  SEEDANCE_PROMPT_MAX,
  clampPromptForSeedance,
  buildSeedanceInput,
};
