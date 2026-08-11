/**
 * End-to-end motion flyer pipeline (no user-visible prompts).
 */
const { analyzeFlyerImage } = require("./motionFlyerAnalyzer.cjs");
const { buildFinalPrompt } = require("./motionFlyerPrompts.cjs");
const { buildSeedanceInput } = require("./motionFlyerSeedance.cjs");
const { getMotionFlyerProvider } = require("./motionFlyerModels.cjs");
const { resolvePipelineCategory } = require("./motionFlyerCategories.cjs");
const { resolveMotionFlyerAspectFromImage } = require("./motionFlyerFormats.cjs");
const { MOTION_FLYER_DURATION } = require("./motionFlyerPricing.cjs");

async function runMotionFlyerPipeline({
  imageUrls,
  duration,
  lang = "pt",
  providerId,
  aspectRatio = "",
  imageWidth = null,
  imageHeight = null,
}) {
  const urls = (imageUrls || []).filter(Boolean);
  if (!urls.length) {
    const err = new Error("Envia o flyer (imagem).");
    err.status = 400;
    throw err;
  }

  const dur = Math.round(Number(duration) || MOTION_FLYER_DURATION);
  const mainImageUrl = urls[0];

  const analysis = await analyzeFlyerImage({
    mainImageUrl,
    lang,
  });

  const categoryId = resolvePipelineCategory(analysis.category);
  const provider = getMotionFlyerProvider(providerId);

  const { promptId, storyboard, prompt, generateAudio } = buildFinalPrompt({
    categoryId,
    duration: dur,
    flyerLabel: analysis.flyer_label,
    motionMood: analysis.motion_mood,
    layerNotes: analysis.layer_notes,
  });

  const resolvedAspect = resolveMotionFlyerAspectFromImage({
    width: imageWidth,
    height: imageHeight,
    aspectRatio,
    fallback: provider.defaultAspect,
  });

  const { modelId, input } = buildSeedanceInput({
    prompt,
    imageUrls: [mainImageUrl],
    duration: dur,
    providerId: provider.id,
    aspectRatio: resolvedAspect,
    generateAudio,
  });

  return {
    ok: true,
    analysis: { ...analysis, category: categoryId },
    storyboard,
    promptId,
    prompt,
    modelId,
    input,
    providerId: provider.id,
    aspectRatio: resolvedAspect,
    imageWidth: imageWidth || null,
    imageHeight: imageHeight || null,
  };
}

module.exports = {
  runMotionFlyerPipeline,
};
