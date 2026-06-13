/**
 * End-to-end marketing video pipeline (no user-visible prompts).
 */
const { analyzeMarketingImages } = require("./marketingVideoAnalyzer.cjs");
const { buildFinalPrompt } = require("./marketingVideoPrompts.cjs");
const { buildSeedanceInput } = require("./marketingVideoSeedance.cjs");
const { getMarketingVideoProvider } = require("./marketingVideoModels.cjs");
const { isValidCategoryId } = require("./marketingVideoCategories.cjs");

async function runMarketingVideoPipeline({
  imageUrls,
  duration,
  manualCategory = "",
  lang = "pt",
  providerId,
}) {
  const urls = (imageUrls || []).filter(Boolean);
  if (!urls.length) {
    const err = new Error("Envia pelo menos uma imagem principal.");
    err.status = 400;
    throw err;
  }

  const mainImageUrl = urls[0];
  const referenceUrls = urls.slice(1);

  const analysis = await analyzeMarketingImages({
    mainImageUrl,
    referenceUrls,
    manualCategory,
    lang,
  });

  if (analysis.needs_manual && !isValidCategoryId(manualCategory)) {
    return {
      ok: false,
      needs_category: true,
      analysis,
    };
  }

  const categoryId = analysis.category || manualCategory;
  if (!isValidCategoryId(categoryId)) {
    const err = new Error("Seleciona uma categoria para continuar.");
    err.status = 422;
    err.code = "NEEDS_CATEGORY";
    throw err;
  }

  const { promptId, storyboard, prompt } = buildFinalPrompt({
    categoryId,
    duration,
    productLabel: analysis.product_label,
    imageCount: urls.length,
  });

  const provider = getMarketingVideoProvider(providerId);
  const { modelId, input } = buildSeedanceInput({
    prompt,
    imageUrls: urls,
    duration,
    providerId: provider.id,
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
    aspectRatio: provider.defaultAspect,
  };
}

module.exports = {
  runMarketingVideoPipeline,
};
