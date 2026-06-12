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

const GROK_VIDEO_EDIT_MAX_SEC = 8;

function validateVideoEditOptions({ resolution, duration, engine = "kling_edit" }) {
  if (engine === "grok_edit") {
    const dur = Math.round(Number(duration));
    if (dur !== GROK_VIDEO_EDIT_MAX_SEC) {
      const err = new Error(`Grok só gera clips até ${GROK_VIDEO_EDIT_MAX_SEC} segundos.`);
      err.status = 400;
      throw err;
    }
    return { resolution: "original", duration: GROK_VIDEO_EDIT_MAX_SEC };
  }
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
  if (res === "1080p") return "1080p";
  return "720p";
}

function buildSurchargeDisplay(regionId = "intl") {
  const s = getSurchargesForRegion(regionId);
  return {
    duration: { 8: s.videoEditDuration8 ?? 25, 10: s.videoEditDuration10 ?? 50 },
    resolution: { "720p": s.videoEditResolutionHd ?? 15, "1080p": s.videoEditResolutionHd ?? 15 },
  };
}

function computeVideoEditCostForEngine(CREDIT, surcharges, editTool, resOpts) {
  const base = CREDIT.videoEdit ?? 65;
  if (editTool === "grok_edit") return base;
  return computeVideoEditCostFromConfig(CREDIT, surcharges, resOpts);
}

module.exports = {
  SURCHARGE: buildSurchargeDisplay(),
  computeVideoEditCost,
  computeVideoEditCostForEngine,
  validateVideoEditOptions,
  mapResolutionForModel,
  PREMIUM_RESOLUTIONS,
  PREMIUM_DURATIONS,
  buildSurchargeDisplay,
};
