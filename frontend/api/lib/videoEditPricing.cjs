const PREMIUM_RESOLUTIONS = new Set(["1080p", "720p"]);
const PREMIUM_DURATIONS = new Set([8, 10]);

/** Extra credits on top of base video-edit cost. */
const SURCHARGE = {
  duration: { 8: 10, 10: 18 },
  resolution: { "720p": 8, "1080p": 14 },
};

function computeVideoEditCost(baseCost, { resolution = "original", duration = 6 } = {}) {
  const base = Math.max(1, Number(baseCost) || 95);
  const dur = Math.round(Number(duration));
  const res = String(resolution || "original").trim().toLowerCase();
  let cost = base;
  if (SURCHARGE.duration[dur]) cost += SURCHARGE.duration[dur];
  if (SURCHARGE.resolution[res]) cost += SURCHARGE.resolution[res];
  return cost;
}

function validateVideoEditOptions({ resolution, duration }) {
  const res = String(resolution || "original").trim().toLowerCase();
  const dur = Math.round(Number(duration));

  if (!["original", "720p", "1080p"].includes(res)) {
    const err = new Error("Resolução inválida.");
    err.status = 400;
    throw err;
  }
  if (![4, 6, 8, 10].includes(dur)) {
    const err = new Error("Duração inválida — usa 4, 6, 8 ou 10 segundos.");
    err.status = 400;
    throw err;
  }
  return { resolution: res, duration: dur };
}

function mapResolutionForModel(resolution) {
  const res = String(resolution || "original").trim().toLowerCase();
  if (res === "720p") return "720p";
  // original → keep source profile (model default high tier)
  return "1080p";
}

module.exports = {
  SURCHARGE,
  computeVideoEditCost,
  validateVideoEditOptions,
  mapResolutionForModel,
  PREMIUM_RESOLUTIONS,
  PREMIUM_DURATIONS,
};
