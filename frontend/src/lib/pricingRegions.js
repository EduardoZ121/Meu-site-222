import pricingData from "../config/pricing.json";

const STORAGE_KEY = "rp_pricing_region";
const LOCK_KEY = "rp_pricing_region_locked";

export const PRICING_USD_COUNTRIES = new Set(
  (pricingData.regions.usd.countries || []).map((c) => c.toUpperCase())
);

export function countryToRegion(countryCode) {
  const cc = String(countryCode || "").trim().toUpperCase();
  if (PRICING_USD_COUNTRIES.has(cc)) return "usd";
  return "intl";
}

export function getRegionConfig(regionId) {
  return pricingData.regions[regionId] || pricingData.regions.intl;
}

export function getPackagesForRegion(regionId) {
  const cfg = getRegionConfig(regionId);
  const divisor = cfg.currency === "usd" ? 100 : 100;
  return Object.entries(cfg.packages).map(([id, pkg]) => ({
    id,
    ...pkg,
    currency: cfg.currency,
    region: cfg.id,
    amount_display: pkg.amount_cents / divisor,
    amount_eur: cfg.currency === "eur" ? pkg.amount_cents / 100 : undefined,
  }));
}

export function getSubscriptionPlansForRegion(regionId) {
  const cfg = getRegionConfig(regionId);
  const plans = cfg.subscription || {};
  return Object.entries(plans).map(([id, plan]) => ({
    id,
    ...plan,
    currency: cfg.currency,
    region: cfg.id,
    amount_display: plan.amount_cents / 100,
  }));
}

export function getPremiumPackagesForRegion(regionId) {
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

export function getPosterHqPremiumCost() {
  const n = Number(pricingData?.meta?.posterHqPremiumCostPerOutput);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 50;
}

export function getCreditCostsForRegion(regionId) {
  return { ...getRegionConfig(regionId).costs };
}

/** Região guardada no browser (definida pela API / primeira compra). */
export function getStoredPricingRegion() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "usd" || v === "intl") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function setStoredPricingRegion(regionId, { lock = false } = {}) {
  if (regionId !== "usd" && regionId !== "intl") return;
  try {
    localStorage.setItem(STORAGE_KEY, regionId);
    if (lock) localStorage.setItem(LOCK_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isPricingRegionLocked() {
  try {
    return localStorage.getItem(LOCK_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Servidor: país do IP manda; cliente não pode pedir USD fora de BR/AO.
 */
export function resolvePricingRegion({ countryCode, clientRegion } = {}) {
  const fromCountry = countryToRegion(countryCode);
  const client = clientRegion === "usd" || clientRegion === "intl" ? clientRegion : null;
  if (fromCountry === "usd") return "usd";
  if (client === "usd") return "intl";
  return client || "intl";
}

export function posterModelCosts(regionId) {
  const c = getCreditCostsForRegion(regionId);
  const hq = getPosterHqPremiumCost();
  return {
    grok: c.posterFast,
    flux2: c.posterPro,
    gpt_image: hq,
  };
}

export function carouselModelCosts(regionId) {
  const c = getCreditCostsForRegion(regionId);
  return {
    grok: c.carouselFastPerSlide,
    gpt_image: c.carouselPremiumPerSlide,
  };
}

/** Custo por id da grelha de ferramentas (toolsCatalogue). */
export function toolCatalogueCost(toolId, regionId) {
  const c = getCreditCostsForRegion(regionId);
  const map = {
    studio: c.image,
    clothes: c.clothes,
    art: c.artistic,
    artistic: c.artistic,
    pro: c.pro,
    bg_remove: c.bgRemove,
    upscale: c.upscale,
    restore: c.restore,
    colorize: c.colorize,
    inpaint: c.inpaint,
    posters: c.posterFast,
    carousel: c.carouselFastPerSlide,
    manga: c.mangaPanel,
    manga_studio: c.mangaPanel,
    video: c.video,
    wizard: 0,
    motion_flyer: c.motionFlyerByDuration?.[10] ?? 200,
    marketing_video: c.marketingVideoByDuration?.[15] ?? 240,
    brand_campaign: c.brandCampaignPerImage ?? c.posterPro ?? 40,
  };
  return map[toolId] ?? c.image;
}

/** Custo mostrado nos cartões do hub Vídeo (suporta duração em pricing.json). */
export function videoCatalogueCost(costs, category) {
  if (!category) return costs?.video ?? 50;
  if (category.id === "motion-flyer-ai" || category.flow === "motion-flyer") {
    return costs?.motionFlyerByDuration?.[10] ?? 200;
  }
  if (category.id === "marketing-video-ai" || category.flow === "marketing-video") {
    return costs?.marketingVideoByDuration?.[15] ?? 240;
  }
  if (category.costKey === "motionFlyerByDuration") {
    return costs?.motionFlyerByDuration?.[category.costDuration || 10] ?? 200;
  }
  if (category.costKey === "marketingVideoByDuration") {
    return costs?.marketingVideoByDuration?.[category.costDuration || 15] ?? 240;
  }
  return costs?.[category.costKey] ?? costs?.video ?? 50;
}

export { pricingData };
