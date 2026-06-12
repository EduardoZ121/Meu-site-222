/** Credit costs, surcharges, and package math — shared pricing rules. */
const { getRegionConfig, pricingData } = require("../pricingRegions.cjs");

function getPricingMeta() {
  const root = pricingData?.meta || {};
  return {
    creditsPerEuro: root.creditsPerEuro ?? 30,
    minCustomCredits: root.minCustomCredits ?? 150,
    marginTargetPct: root.marginTargetPct ?? 75,
  };
}

function getSurcharges(regionId = "intl") {
  const cfg = getRegionConfig(regionId);
  return { ...(cfg.surcharges || {}) };
}

function getPremiumArtisticEffects(regionId = "intl") {
  const cfg = getRegionConfig(regionId);
  return cfg.premiumArtisticEffects || [];
}

function restoreCostForLevel(CREDIT, level) {
  const key = String(level || "medio").toLowerCase();
  if (key === "leve" || key === "light") return CREDIT.restoreLight ?? CREDIT.restore ?? 12;
  if (key === "profundo" || key === "deep") return CREDIT.restoreDeep ?? 22;
  return CREDIT.restoreMedium ?? CREDIT.restore ?? 15;
}

function customPurchaseAmountCents(credits) {
  const meta = getPricingMeta();
  const rate = meta.creditsPerEuro || 30;
  const minCr = meta.minCustomCredits || 150;
  const cr = Math.max(minCr, Math.round(Number(credits) || 0));
  return Math.ceil(cr / rate) * 100;
}

function computeVideoGenerateCost(CREDIT, surcharges, { duration = 6, mode = "text", testMode = false } = {}) {
  if (testMode) return 0;
  let cost = mode === "image"
    ? (CREDIT.videoImage ?? CREDIT.video ?? 150)
    : (CREDIT.video ?? 40);
  const dur = Math.round(Number(duration));
  if (dur >= 10) cost += surcharges.videoDuration10 ?? 50;
  else if (dur >= 8) cost += surcharges.videoDuration8 ?? 25;
  return cost;
}

function computeVideoExtendCostFromConfig(CREDIT, surcharges, { resolution = "1080p", duration = 6 } = {}) {
  let cost = CREDIT.videoExtend ?? CREDIT.videoEdit ?? 70;
  const res = String(resolution || "1080p").trim().toLowerCase();
  const dur = Math.round(Number(duration));
  if (res === "720p" || res === "1080p") cost += surcharges.videoEditResolutionHd ?? 8;
  if (dur >= 10) cost += surcharges.videoEditDuration10 ?? 25;
  else if (dur >= 8) cost += surcharges.videoEditDuration8 ?? 12;
  return cost;
}

function computeVideoEditCostFromConfig(CREDIT, surcharges, { resolution = "original", duration = 6 } = {}) {
  let cost = CREDIT.videoEdit ?? 100;
  const res = String(resolution || "original").trim().toLowerCase();
  const dur = Math.round(Number(duration));
  if (res === "720p" || res === "1080p") cost += surcharges.videoEditResolutionHd ?? 15;
  if (dur >= 10) cost += surcharges.videoEditDuration10 ?? 50;
  else if (dur >= 8) cost += surcharges.videoEditDuration8 ?? 25;
  return cost;
}

function countPremiumArtisticEffects(effects, regionId = "intl") {
  const premium = new Set(getPremiumArtisticEffects(regionId));
  if (!effects || typeof effects !== "object") return 0;
  let n = 0;
  for (const [sectionId, val] of Object.entries(effects)) {
    if (typeof val === "string" && val) {
      if (premium.has(`${sectionId}:${val}`)) n += 1;
    } else if (val && typeof val === "object") {
      for (const [optId, on] of Object.entries(val)) {
        if (on && premium.has(`${sectionId}:${optId}`)) n += 1;
      }
    }
  }
  return n;
}

function computeArtisticEffectSurcharge(effects, regionId = "intl") {
  const surcharges = getSurcharges(regionId);
  const per = surcharges.artisticEffectPremium ?? 4;
  const max = surcharges.artisticEffectPremiumMax ?? 8;
  const count = countPremiumArtisticEffects(effects, regionId);
  return Math.min(max, count * per);
}

function applyGenerationSurcharges(cost, surcharges, {
  improvePrompt = false,
  hdQuality = false,
  hdMode = "image",
} = {}) {
  let total = cost;
  if (improvePrompt) total += surcharges.enhancePrompt ?? 5;
  if (hdQuality) {
    total += hdMode === "simple"
      ? (surcharges.hdSimple ?? 5)
      : hdMode === "video"
        ? (surcharges.hdVideo ?? 15)
        : (surcharges.hdImage ?? 8);
  }
  return total;
}

module.exports = {
  getPricingMeta,
  getSurcharges,
  getPremiumArtisticEffects,
  restoreCostForLevel,
  customPurchaseAmountCents,
  computeVideoGenerateCost,
  computeVideoEditCostFromConfig,
  computeVideoExtendCostFromConfig,
  countPremiumArtisticEffects,
  computeArtisticEffectSurcharge,
  applyGenerationSurcharges,
};
