const { fetchWebsiteSnapshot, normalizeUrl } = require("./brandCampaignScraper.cjs");
const { analyzeBrandCampaign, CONCEPT_COUNT } = require("./brandCampaignAnalyzer.cjs");
const { buildBrandCampaignImagePrompt } = require("./brandCampaignPrompts.cjs");

const MAX_OUTPUTS = 10;
const MIN_OUTPUTS = 1;

function getBrandCampaignPerImageCost(CREDIT) {
  return CREDIT.brandCampaignPerImage ?? CREDIT.posterPro ?? 40;
}

function clampOutputCount(n) {
  return Math.max(MIN_OUTPUTS, Math.min(MAX_OUTPUTS, Math.round(Number(n) || 1)));
}

const { listBrandCampaignCategories } = require("./brandCampaignCategories.cjs");
const { pickBrandCampaignPreset, presetCount, listPresetsForCategory } = require("./brandCampaignPresetLibrary.cjs");

module.exports = {
  fetchWebsiteSnapshot,
  normalizeUrl,
  analyzeBrandCampaign,
  buildBrandCampaignImagePrompt,
  getBrandCampaignPerImageCost,
  clampOutputCount,
  listBrandCampaignCategories,
  listPresetsForCategory,
  pickBrandCampaignPreset,
  presetCount,
  CONCEPT_COUNT,
  MAX_OUTPUTS,
  MIN_OUTPUTS,
};
