const { getCreditCostsForRegion, getRegionConfig } = require("../pricingRegions.cjs");
const { computeVideoEditCostFromConfig } = require("./creditPricing.cjs");

const PREMIUM_RESOLUTIONS = new Set(["1080p", "720p"]);
const PREMIUM_DURATIONS = new Set([8, 10]);

function getSurchargesForRegion(regionId = "intl") {
  const cfg = getRegionConfig(regionId);
  return cfg.surcharges || {};
}

function computeVideoEditCost(baseCost, { resolution = "original", duration = 6, regionId = "intl" } = {}) {
  const CREDIT = getCreditCostsForRegion(regionId);
  const surcharges = getSurchargesForRegion(regionId);
  const fromConfig = computeVideoEditCostFromConfig(CREDIT, surcharges, { resolution, duration });
  if (baseCost && baseCost !== CREDIT.videoEdit) {
    const delta = fromConfig - (CREDIT.videoEdit ?? 120);
    return Math.max(1, Number(baseCost) || 120) + delta;
  }
  return fromConfig;
}

function validateVideoEditOptions({ resolution, duration }) {
  const res = String(resolution || "original").trim().toLowerCase();
  const dur = Math.round(Number(duration));

  if (!["original", "720p", "1080p"].includes(res)) {
    const err = new Error("Resolução inválida.");
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

function mapResolutionForModel(resolution) {
  const res = String(resolution || "original").trim().toLowerCase();
  if (res === "720p") return "720p";
  return "1080p";
}

function buildSurchargeDisplay(regionId = "intl") {
  const s = getSurchargesForRegion(regionId);
  return {
    duration: { 8: s.videoEditDuration8 ?? 25, 10: s.videoEditDuration10 ?? 50 },
    resolution: { "720p": s.videoEditResolutionHd ?? 15, "1080p": s.videoEditResolutionHd ?? 15 },
  };
}

module.exports = {
  SURCHARGE: buildSurchargeDisplay(),
  computeVideoEditCost,
  validateVideoEditOptions,
  mapResolutionForModel,
  PREMIUM_RESOLUTIONS,
  PREMIUM_DURATIONS,
  buildSurchargeDisplay,
};
