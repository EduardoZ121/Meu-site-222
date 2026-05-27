const SURCHARGE = {
  duration: { 8: 10, 10: 18 },
  resolution: { "720p": 8, "1080p": 14 },
};

export function computeVideoEditCost(baseCost, { resolution = "original", duration = 6 } = {}) {
  const base = Math.max(1, Number(baseCost) || 95);
  const dur = Math.round(Number(duration));
  const res = String(resolution || "original").trim().toLowerCase();
  let cost = base;
  if (SURCHARGE.duration[dur]) cost += SURCHARGE.duration[dur];
  if (SURCHARGE.resolution[res]) cost += SURCHARGE.resolution[res];
  return cost;
}

export function isPremiumResolution(resolution) {
  return resolution === "1080p" || resolution === "720p";
}

export function isPremiumDuration(duration) {
  return duration === 8 || duration === 10;
}

export { SURCHARGE };
