import { getRegionConfig, pricingData } from "./pricingRegions";

export function getPricingMeta() {
  const root = pricingData?.meta || {};
  return {
    creditsPerEuro: root.creditsPerEuro ?? 50,
    minCustomCredits: root.minCustomCredits ?? 150,
    marginTargetPct: root.marginTargetPct ?? 75,
  };
}

export function getSurcharges(regionId = "intl") {
  const cfg = getRegionConfig(regionId);
  return { ...(cfg.surcharges || {}) };
}

export function getPremiumArtisticEffects(regionId = "intl") {
  const cfg = getRegionConfig(regionId);
  return cfg.premiumArtisticEffects || [];
}

export function restoreCostForLevel(costs, level) {
  const key = String(level || "medio").toLowerCase();
  if (key === "leve" || key === "light") return costs.restoreLight ?? costs.restore ?? 12;
  if (key === "profundo" || key === "deep") return costs.restoreDeep ?? 22;
  return costs.restoreMedium ?? costs.restore ?? 15;
}

export function customPurchasePrice(credits) {
  const meta = getPricingMeta();
  const rate = meta.creditsPerEuro || 30;
  const minCr = meta.minCustomCredits || 150;
  const cr = Math.max(minCr, Math.round(Number(credits) || 0));
  const price = Math.ceil(cr / rate);
  return { credits: cr, price, perUnit: (cr / price).toFixed(1) };
}

export function computeVideoGenerateCost(costs, surcharges, { duration = 6, mode = "text", testMode = false } = {}) {
  if (testMode) return 0;
  let cost = mode === "image"
    ? (costs.videoImage ?? costs.video ?? 150)
    : (costs.video ?? 40);
  const dur = Math.round(Number(duration));
  if (dur >= 10) cost += surcharges.videoDuration10 ?? 50;
  else if (dur >= 8) cost += surcharges.videoDuration8 ?? 25;
  return cost;
}

export function computeVideoEditCostFromConfig(costs, surcharges, { resolution = "original", duration = 6 } = {}) {
  let cost = costs.videoEdit ?? 120;
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

export function computeArtisticEffectSurcharge(effects, regionId = "intl") {
  const surcharges = getSurcharges(regionId);
  const per = surcharges.artisticEffectPremium ?? 4;
  const max = surcharges.artisticEffectPremiumMax ?? 8;
  const count = countPremiumArtisticEffects(effects, regionId);
  return Math.min(max, count * per);
}

export function applyGenerationSurcharges(cost, surcharges, {
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
