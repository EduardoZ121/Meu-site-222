/**
 * End-to-end marketing video pipeline (no user-visible prompts).
 */
const { analyzeMarketingImages } = require("./marketingVideoAnalyzer.cjs");
const { buildFinalPrompt } = require("./marketingVideoPrompts.cjs");
const { buildSeedanceInput } = require("./marketingVideoSeedance.cjs");
const { getMarketingVideoProvider } = require("./marketingVideoModels.cjs");
const { resolvePipelineCategory } = require("./marketingVideoCategories.cjs");
const { resolveMarketingVideoAspectRatio } = require("./marketingVideoFormats.cjs");
const { MARKETING_VIDEO_DURATION } = require("./marketingVideoPricing.cjs");

async function runMarketingVideoPipeline({
  imageUrls,
  duration,
  manualCategory = "",
  visualStyle = "",
  lang = "pt",
  providerId,
  formatId = "",
}) {
  const urls = (imageUrls || []).filter(Boolean);
  if (!urls.length) {
    const err = new Error("Envia pelo menos uma imagem principal.");
    err.status = 400;
    throw err;
  }

  const dur = Math.round(Number(duration) || MARKETING_VIDEO_DURATION);
  const mainImageUrl = urls[0];
  const referenceUrls = urls.slice(1);

  const analysis = await analyzeMarketingImages({
    mainImageUrl,
    referenceUrls,
    manualCategory,
    lang,
  });

  const categoryId = resolvePipelineCategory(manualCategory, analysis.category);

  const provider = getMarketingVideoProvider(providerId);

  const { promptId, storyboard, prompt, generateAudio, visualStyleId } = buildFinalPrompt({
    categoryId,
    duration: dur,
    productLabel: analysis.product_label,
    imageCount: urls.length,
    creativeAngle: analysis.creative_angle,
    visualStyle: visualStyle,
  });

  const aspectRatio = resolveMarketingVideoAspectRatio(formatId, provider.defaultAspect);

  const { modelId, input } = buildSeedanceInput({
    prompt,
    imageUrls: urls,
    duration: dur,
    providerId: provider.id,
    aspectRatio,
    generateAudio,
  });

  return {
    ok: true,
    analysis: { ...analysis, category: categoryId },
    storyboard,
    promptId,
    visualStyleId,
    prompt,
    modelId,
    input,
    providerId: provider.id,
    aspectRatio,
  };
}

module.exports = {
  runMarketingVideoPipeline,
};
