/** Créditos HQ (posters OpenAI) — unidades separadas dos créditos standard. */
const { pricingData } = require("../pricingRegions.cjs");

function getPosterHqPremiumCostPerOutput() {
  const n = Number(pricingData?.meta?.posterHqPremiumCostPerOutput);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 1;
}

function posterHqPremiumCost(numOutputs = 1) {
  const count = Math.max(1, Math.round(Number(numOutputs) || 1));
  return getPosterHqPremiumCostPerOutput() * count;
}

module.exports = {
  getPosterHqPremiumCostPerOutput,
  posterHqPremiumCost,
};
