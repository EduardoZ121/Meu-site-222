/** Client helpers — mirrors api/lib/marketingVideo pricing. */

export const MARKETING_VIDEO_DURATIONS = [4, 6, 10, 15];

export const MARKETING_VIDEO_STAGE_KEYS = [
  "mktvid_stage_analyze",
  "mktvid_stage_identify",
  "mktvid_stage_concept",
  "mktvid_stage_strategy",
  "mktvid_stage_generate",
  "mktvid_stage_finalize",
  "mktvid_stage_email",
];

export function stageIndexForElapsed(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  if (s < 12) return 0;
  if (s < 28) return 1;
  if (s < 45) return 2;
  if (s < 70) return 3;
  if (s < 120) return 4;
  if (s < 180) return 5;
  return 6;
}

export function computeMarketingVideoCostFromPricing(pricingMap, duration) {
  const dur = Math.round(Number(duration));
  if (pricingMap && pricingMap[dur] != null) return pricingMap[dur];
  const fallback = { 4: 72, 6: 95, 10: 145, 15: 195 };
  return fallback[dur] ?? 95;
}

export function statusLabelKey(status) {
  if (status === "completed") return "mktvid_status_completed";
  if (status === "refunded") return "mktvid_status_refunded";
  if (status === "starting") return "mktvid_status_starting";
  return "mktvid_status_processing";
}
