import { getCreditCostsForRegion } from "./pricingRegions";
import { computeVideoExtendCostFromConfig, getSurcharges } from "./creditPricing";

export function buildVideoExtendSurcharge(regionId = "intl") {
  const s = getSurcharges(regionId);
  return {
    duration: { 8: s.videoEditDuration8 ?? 12, 10: s.videoEditDuration10 ?? 25 },
    resolution: { "720p": s.videoEditResolutionHd ?? 8, "1080p": s.videoEditResolutionHd ?? 8 },
  };
}

export function computeVideoExtendCost({ resolution = "1080p", duration = 6, regionId = "intl" } = {}) {
  const costs = getCreditCostsForRegion(regionId);
  const surcharges = getSurcharges(regionId);
  return computeVideoExtendCostFromConfig(costs, surcharges, { resolution, duration });
}
