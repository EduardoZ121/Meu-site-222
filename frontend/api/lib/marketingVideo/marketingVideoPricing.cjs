/**
 * Marketing video credits — 15s only (Seedance 2.0 @ 720p + vision + margin).
 *
 * API cost estimate: Replicate Seedance 2.0 ~$0.18–0.22/sec @ 720p with refs
 * → ~$2.70–3.30 per 15s + OpenAI vision ~$0.01 → price at 240 credits (intl starter ~$7.90, ~72% margin).
 *
 * Env override: MARKETING_VIDEO_PRICING='{"15":240}'
 */
const { getCreditCostsForRegion } = require("../../pricingRegions.cjs");

const MARKETING_VIDEO_DURATION = 15;

const FALLBACK_BY_DURATION = {
  15: 240,
};

const ALLOWED_DURATIONS = [15];

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
  return {
    15: Math.max(0, Math.round(Number(base[15] ?? FALLBACK_BY_DURATION[15] ?? 240))),
  };
}

function computeMarketingVideoCost(regionId, duration) {
  validateMarketingVideoDuration(duration);
  const map = getMarketingVideoPricingMap(regionId);
  return map[15];
}

function validateMarketingVideoDuration(duration) {
  const dur = Math.round(Number(duration));
  if (dur !== MARKETING_VIDEO_DURATION) {
    const err = new Error(`Duração inválida. Vídeos de marketing são apenas ${MARKETING_VIDEO_DURATION}s.`);
    err.status = 400;
    throw err;
  }
  return dur;
}

module.exports = {
  MARKETING_VIDEO_DURATION,
  ALLOWED_DURATIONS,
  FALLBACK_BY_DURATION,
  getMarketingVideoPricingMap,
  computeMarketingVideoCost,
  validateMarketingVideoDuration,
};
