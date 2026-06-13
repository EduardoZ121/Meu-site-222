/**
 * Marketing video credits by duration — adjust in pricing.json or env overrides.
 *
 * Env override (JSON): MARKETING_VIDEO_PRICING='{"4":72,"6":95,"10":145,"15":195}'
 */
const { getCreditCostsForRegion } = require("../../pricingRegions.cjs");

const FALLBACK_BY_DURATION = {
  4: 72,
  6: 95,
  10: 145,
  15: 195,
};

const ALLOWED_DURATIONS = [4, 6, 10, 15];

function parseEnvPricing() {
  const raw = String(process.env.MARKETING_VIDEO_PRICING || "").trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function getMarketingVideoPricingMap(regionId = "intl") {
  const costs = getCreditCostsForRegion(regionId);
  const fromConfig = costs.marketingVideoByDuration;
  const fromEnv = parseEnvPricing();
  const base = { ...FALLBACK_BY_DURATION, ...(fromConfig || {}), ...(fromEnv || {}) };
  const out = {};
  for (const d of ALLOWED_DURATIONS) {
    out[d] = Math.max(0, Math.round(Number(base[d] ?? FALLBACK_BY_DURATION[d] ?? 0)));
  }
  return out;
}

function computeMarketingVideoCost(regionId, duration) {
  const dur = Math.round(Number(duration));
  if (!ALLOWED_DURATIONS.includes(dur)) {
    const err = new Error(`Duração inválida. Escolhe: ${ALLOWED_DURATIONS.join(", ")}s.`);
    err.status = 400;
    throw err;
  }
  const map = getMarketingVideoPricingMap(regionId);
  return map[dur] ?? FALLBACK_BY_DURATION[dur];
}

function validateMarketingVideoDuration(duration) {
  const dur = Math.round(Number(duration));
  if (!ALLOWED_DURATIONS.includes(dur)) {
    const err = new Error(`Duração inválida. Escolhe: ${ALLOWED_DURATIONS.join(", ")}s.`);
    err.status = 400;
    throw err;
  }
  return dur;
}

module.exports = {
  ALLOWED_DURATIONS,
  FALLBACK_BY_DURATION,
  getMarketingVideoPricingMap,
  computeMarketingVideoCost,
  validateMarketingVideoDuration,
};
