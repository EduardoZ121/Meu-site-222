const { getCreditCostsForRegion, getRegionConfig } = require("../pricingRegions.cjs");
const { computeVideoExtendCostFromConfig } = require("./creditPricing.cjs");

function getSurchargesForRegion(regionId = "intl") {
  const cfg = getRegionConfig(regionId);
  return cfg.surcharges || {};
}

function computeVideoExtendCost({ resolution = "1080p", duration = 6, regionId = "intl" } = {}) {
  const CREDIT = getCreditCostsForRegion(regionId);
  const surcharges = getSurchargesForRegion(regionId);
  return computeVideoExtendCostFromConfig(CREDIT, surcharges, { resolution, duration });
}

function validateVideoExtendOptions({ resolution, duration }) {
  const res = String(resolution || "1080p").trim().toLowerCase();
  const dur = Math.round(Number(duration));
  if (!["720p", "1080p"].includes(res)) {
    const err = new Error("Resolução inválida — usa 720p ou 1080p.");
    err.status = 400;
    throw err;
  }
  if (![4, 6, 8, 10].includes(dur)) {
    const err = new Error("Duração inválida — usa 4, 6, 8 ou 10 segundos.");
    err.status = 400;
    throw err;
  }
  return { resolution: res, duration: dur };
}

function buildSurchargeDisplay(regionId = "intl") {
  const s = getSurchargesForRegion(regionId);
  return {
    duration: { 8: s.videoEditDuration8 ?? 12, 10: s.videoEditDuration10 ?? 25 },
    resolution: { "720p": s.videoEditResolutionHd ?? 8, "1080p": s.videoEditResolutionHd ?? 8 },
  };
}

module.exports = {
  computeVideoExtendCost,
  validateVideoExtendOptions,
  buildSurchargeDisplay,
};
