/**
 * Dados legíveis para o painel Admin → Finanças (preços, pacotes, cenários).
 */
const { getCreditCostsForRegion, getPackagesForRegion, pricingData } = require("../pricingRegions.cjs");
const { getFinanceConfig } = require("./financeModel.cjs");

const CATALOG = [
  { key: "image", label: "Imagem / Estúdio" },
  { key: "edit", label: "Editar imagem" },
  { key: "pro", label: "Imagem Pro" },
  { key: "artistic", label: "Estúdio artístico" },
  { key: "bgRemove", label: "Remover fundo" },
  { key: "upscale", label: "Upscale" },
  { key: "restoreMedium", label: "Restaurar (médio)" },
  { key: "colorize", label: "Colorizar" },
  { key: "clothes", label: "Trocar roupa" },
  { key: "inpaint", label: "Inpaint" },
  { key: "posterFast", label: "Pôster rápido" },
  { key: "posterPro", label: "Pôster Pro" },
  { key: "posterPremium", label: "Pôster premium" },
  { key: "videoFast", label: "Vídeo rápido (5s)" },
  { key: "videoMarketing", label: "Vídeo marketing Kling (5s)" },
  { key: "videoEdit", label: "Vídeo para vídeo (6s base)" },
  { key: "videoExtend", label: "Estender vídeo" },
  { key: "marketingVideo15", label: "Marketing IA (15s)", costKey: "marketingVideoByDuration", duration: 15 },
  { key: "motionFlyer10", label: "Motion Flyer (10s)", costKey: "motionFlyerByDuration", duration: 10 },
];

function starterEuroPerCredit() {
  const pkg = pricingData?.regions?.intl?.packages?.starter;
  if (!pkg?.credits || !pkg?.amount_cents) return 5 / 150;
  return pkg.amount_cents / 100 / pkg.credits;
}

function creditCost(costs, item) {
  if (item.costKey === "marketingVideoByDuration") {
    return costs.marketingVideoByDuration?.[item.duration] ?? costs.marketingVideoByDuration?.[15] ?? 240;
  }
  if (item.costKey === "motionFlyerByDuration") {
    return costs.motionFlyerByDuration?.[item.duration] ?? costs.motionFlyerByDuration?.[10] ?? 200;
  }
  return costs[item.key] ?? null;
}

function buildFinanceDashboard() {
  const costs = getCreditCostsForRegion("intl");
  const packages = getPackagesForRegion("intl");
  const cfg = getFinanceConfig();
  const eurPerCredit = starterEuroPerCredit();
  const usdPerCreditReserve = cfg.replicate_usd_per_credit;

  const catalog = CATALOG.map((item) => {
    const credits = creditCost(costs, item);
    if (credits == null) return null;
    return {
      id: item.key,
      label: item.label,
      credits,
      eur_starter: Math.round(credits * eurPerCredit * 100) / 100,
      replicate_reserve_usd: Math.round(credits * usdPerCreditReserve * 100) / 100,
      generations_per_150: Math.floor(150 / credits),
    };
  }).filter(Boolean);

  const starter = packages.find((p) => p.id === "starter") || packages[0];
  const starterCredits = starter?.credits || 150;
  const starterEur = starter?.amount_display || 5;
  const starterUsd = starterEur * cfg.eur_usd;
  const stripeFee = starterEur * cfg.stripe_pct + cfg.stripe_fixed_eur;
  const worstCaseReplicateUsd = starterCredits * usdPerCreditReserve;
  const worstCaseMarginUsd = starterUsd - stripeFee * cfg.eur_usd - worstCaseReplicateUsd;

  return {
    meta: {
      credits_per_euro: pricingData?.meta?.creditsPerEuro ?? 30,
      margin_target_pct: pricingData?.meta?.marginTargetPct ?? 72,
      replicate_usd_per_credit: usdPerCreditReserve,
      eur_per_credit_starter: Math.round(eurPerCredit * 1000) / 1000,
      note_pt:
        "Cada crédito gasto reserva ~$" + usdPerCreditReserve
        + " no Replicate (configurável). Se o custo real for menor, a margem real é maior.",
    },
    packages: packages.map((p) => ({
      id: p.id,
      name: p.name,
      credits: p.credits,
      amount_eur: p.amount_eur ?? p.amount_display,
      eur_per_credit: Math.round((p.amount_display / p.credits) * 1000) / 1000,
      worst_case_replicate_usd: Math.round(p.credits * usdPerCreditReserve * 100) / 100,
    })),
    catalog,
    starter_scenario: {
      pack: "Starter",
      pay_eur: starterEur,
      credits: starterCredits,
      stripe_fee_eur: Math.round(stripeFee * 100) / 100,
      if_all_spent_replicate_usd: Math.round(worstCaseReplicateUsd * 100) / 100,
      estimated_margin_if_all_spent_usd: Math.round(worstCaseMarginUsd * 100) / 100,
      example_images_15cr: Math.floor(starterCredits / (costs.image || 15)),
      example_videos_edit: Math.floor(starterCredits / (costs.videoEdit || 112)),
      example_marketing_15s: Math.floor(starterCredits / (costs.marketingVideoByDuration?.[15] || 240)),
    },
  };
}

module.exports = { buildFinanceDashboard };
