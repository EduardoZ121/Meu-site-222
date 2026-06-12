import { getCreditCostsForRegion } from "./pricingRegions";
import { computeVideoEditCostFromConfig, getSurcharges } from "./creditPricing";

export function buildVideoEditSurcharge(regionId = "intl") {
  const s = getSurcharges(regionId);
  return {
    duration: { 8: s.videoEditDuration8 ?? 25, 10: s.videoEditDuration10 ?? 50 },
    resolution: { "720p": s.videoEditResolutionHd ?? 15, "1080p": s.videoEditResolutionHd ?? 15 },
  };
}

export const SURCHARGE = buildVideoEditSurcharge();

export function computeVideoEditCost(baseCost, {
  resolution = "original",
  duration = 6,
  regionId = "intl",
  engine = "kling_edit",
} = {}) {
  const costs = getCreditCostsForRegion(regionId);
  const surcharges = getSurcharges(regionId);
  const base = costs.videoEdit ?? 120;
  if (engine === "grok_edit") {
    if (baseCost && baseCost !== base) return Math.max(1, Number(baseCost) || base);
    return base;
  }
  const fromConfig = computeVideoEditCostFromConfig(costs, surcharges, { resolution, duration });
  if (baseCost && baseCost !== base) {
    const delta = fromConfig - base;
    return Math.max(1, Number(baseCost) || base) + delta;
  }
  return fromConfig;
}

export function isPremiumResolution(resolution) {
  return resolution === "1080p" || resolution === "720p";
}

export function isPremiumDuration(duration) {
  return duration === 8 || duration === 10;
}
