/**
 * End-to-end marketing video pipeline (no user-visible prompts).
 */
const { analyzeMarketingImages } = require("./marketingVideoAnalyzer.cjs");
const { buildFinalPrompt, buildCgiFinalPrompt } = require("./marketingVideoPrompts.cjs");
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
  mode = "quick",
  templateId = "",
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

  const isCgiPreview = String(mode || "").trim() === "cgi_preview";

  const provider = getMarketingVideoProvider(providerId);

  const promptPlan = isCgiPreview
    ? buildCgiFinalPrompt({
      templateId,
      productLabel: analysis.product_label,
      imageCount: urls.length,
      creativeAngle: analysis.creative_angle,
      visualStyle: visualStyle || "epic_blockbuster",
    })
    : buildFinalPrompt({
      categoryId: resolvePipelineCategory(manualCategory, analysis.category),
      duration: dur,
      productLabel: analysis.product_label,
      imageCount: urls.length,
      creativeAngle: analysis.creative_angle,
      visualStyle: visualStyle,
    });

  const categoryId = isCgiPreview
    ? (promptPlan.cgiCategoryHint || "general")
    : resolvePipelineCategory(manualCategory, analysis.category);

  const aspectRatio = resolveMarketingVideoAspectRatio(formatId, provider.defaultAspect);

  const { modelId, input } = buildSeedanceInput({
    prompt: promptPlan.prompt,
    imageUrls: urls,
    duration: dur,
    providerId: provider.id,
    aspectRatio,
    generateAudio: promptPlan.generateAudio,
  });

  return {
    ok: true,
    analysis: { ...analysis, category: categoryId },
    storyboard: promptPlan.storyboard,
    promptId: promptPlan.promptId,
    visualStyleId: promptPlan.visualStyleId,
    cgiTemplateId: promptPlan.cgiTemplateId || null,
    adminStoryboard: promptPlan.adminStoryboard || null,
    prompt: promptPlan.prompt,
    modelId,
    input,
    providerId: provider.id,
    aspectRatio,
  };
}

module.exports = {
  runMarketingVideoPipeline,
};
