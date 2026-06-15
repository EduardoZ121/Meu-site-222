/**
 * Motion flyer credits — 10s only (Seedance 2.0 @ 720p + OpenAI vision + margin).
 *
 * API: Replicate Seedance 2.0 ~$0.18/s × 10s ≈ $1.80 + vision ~$0.03 → ~$1.83
 * Comparável a vídeo foto 10s (192 cr = 160 + surcharge 32) — 200 cr inclui análise IA.
 *
 * Env override: MOTION_FLYER_PRICING='{"10":200}'
 */
const { getCreditCostsForRegion } = require("../../pricingRegions.cjs");

const MOTION_FLYER_DURATION = 10;

const FALLBACK_BY_DURATION = {
  10: 200,
};

const ALLOWED_DURATIONS = [10];

function parseEnvPricing() {
  const raw = String(process.env.MOTION_FLYER_PRICING || "").trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function getMotionFlyerPricingMap(regionId = "intl") {
  const costs = getCreditCostsForRegion(regionId);
  const fromConfig = costs.motionFlyerByDuration;
  const fromEnv = parseEnvPricing();
  const base = { ...FALLBACK_BY_DURATION, ...(fromConfig || {}), ...(fromEnv || {}) };
  return {
    10: Math.max(0, Math.round(Number(base[10] ?? FALLBACK_BY_DURATION[10] ?? 200))),
  };
}

function computeMotionFlyerCost(regionId, duration) {
  validateMotionFlyerDuration(duration);
  const map = getMotionFlyerPricingMap(regionId);
  return map[10];
}

function validateMotionFlyerDuration(duration) {
  const dur = Math.round(Number(duration));
  if (dur !== MOTION_FLYER_DURATION) {
    const err = new Error(`Duração inválida. Motion flyers são apenas ${MOTION_FLYER_DURATION}s.`);
    err.status = 400;
    throw err;
  }
  return dur;
}

module.exports = {
  MOTION_FLYER_DURATION,
  ALLOWED_DURATIONS,
  FALLBACK_BY_DURATION,
  getMotionFlyerPricingMap,
  computeMotionFlyerCost,
  validateMotionFlyerDuration,
};
