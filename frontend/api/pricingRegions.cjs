/** Espelha frontend/src/lib/pricingRegions.js + config (CommonJS para API Vercel). */
let pricingData;
try {
  pricingData = require("./lib/pricing.json");
} catch {
  pricingData = require("../src/config/pricing.json");
}

const USD_COUNTRIES = new Set(
  (pricingData.regions.usd.countries || []).map((c) => c.toUpperCase())
);

function countryToRegion(countryCode) {
  const cc = String(countryCode || "").trim().toUpperCase();
  if (USD_COUNTRIES.has(cc)) return "usd";
  return "intl";
}

function getRegionConfig(regionId) {
  return pricingData.regions[regionId] || pricingData.regions.intl;
}

function getPackagesForRegion(regionId) {
  const cfg = getRegionConfig(regionId);
  return Object.entries(cfg.packages).map(([id, pkg]) => ({
    id,
    ...pkg,
    currency: cfg.currency,
    region: cfg.id,
    amount_display: pkg.amount_cents / 100,
    amount_eur: cfg.currency === "eur" ? pkg.amount_cents / 100 : undefined,
  }));
}

function getPremiumPackagesForRegion(regionId) {
  const cfg = getRegionConfig(regionId);
  const pkgs = cfg.premium_packages || {};
  return Object.entries(pkgs).map(([id, pkg]) => ({
    id,
    ...pkg,
    currency: cfg.currency,
    region: cfg.id,
    amount_display: pkg.amount_cents / 100,
    amount_eur: cfg.currency === "eur" ? pkg.amount_cents / 100 : undefined,
  }));
}

function getSubscriptionPlansForRegion(regionId) {
  const cfg = getRegionConfig(regionId);
  const subs = cfg.subscription || {};
  return Object.entries(subs).map(([id, plan]) => ({
    id,
    ...plan,
    currency: cfg.currency,
    region: cfg.id,
    amount_display: plan.amount_cents / 100,
    amount_eur: cfg.currency === "eur" ? plan.amount_cents / 100 : undefined,
  }));
}

function getPricingMeta() {
  const root = pricingData?.meta || {};
  return {
    creditsPerEuro: root.creditsPerEuro ?? 30,
    minCustomCredits: root.minCustomCredits ?? 150,
    marginTargetPct: root.marginTargetPct ?? 72,
    posterHqPremiumCostPerOutput: root.posterHqPremiumCostPerOutput ?? 50,
  };
}

function getCreditCostsForRegion(regionId) {
  return { ...getRegionConfig(regionId).costs };
}

function resolvePricingRegion({ countryCode, clientRegion } = {}) {
  const fromCountry = countryToRegion(countryCode);
  const client = clientRegion === "usd" || clientRegion === "intl" ? clientRegion : null;
  if (fromCountry === "usd") return "usd";
  if (client === "usd") return "intl";
  return client || "intl";
}

function countryFromRequest(req) {
  const h = req.headers || {};
  return (
    h["x-vercel-ip-country"]
    || h["cf-ipcountry"]
    || h["x-country-code"]
    || ""
  ).toString().trim().toUpperCase();
}

module.exports = {
  pricingData,
  countryToRegion,
  getRegionConfig,
  getPackagesForRegion,
  getPremiumPackagesForRegion,
  getSubscriptionPlansForRegion,
  getPricingMeta,
  getCreditCostsForRegion,
  resolvePricingRegion,
  countryFromRequest,
};
