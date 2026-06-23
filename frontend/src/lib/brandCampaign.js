/** Client helpers — Campanha on-brand */

export const BRAND_CAMPAIGN_MAX = 10;

export function computeBrandCampaignCost(perImage, count) {
  const n = Math.max(1, Math.min(BRAND_CAMPAIGN_MAX, Math.round(Number(count) || 1)));
  return { count: n, total: (Number(perImage) || 40) * n, perImage: Number(perImage) || 40 };
}

export const BRAND_CAMPAIGN_ASPECTS = [
  { id: "4:5", labelKey: "bc_aspect_feed" },
  { id: "9:16", labelKey: "bc_aspect_story" },
  { id: "1:1", labelKey: "bc_aspect_square" },
  { id: "16:9", labelKey: "bc_aspect_landscape" },
];
