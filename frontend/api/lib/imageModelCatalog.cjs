const MODELS_JSON = require("../../src/config/imageModels.json");

const BY_ID = Object.fromEntries(MODELS_JSON.map((m) => [m.id, m]));

function listImageModels() {
  return MODELS_JSON.slice();
}

function resolveImageModelChoice(fields, textFn) {
  const text = textFn || ((f, k, d) => {
    const v = f[k];
    const raw = Array.isArray(v) ? v[0] : v;
    return raw == null ? d : String(raw);
  });
  const key = text(fields, "model", "grok").trim().toLowerCase();
  return BY_ID[key] || BY_ID.grok;
}

function imageModelCredits(modelId, CREDIT = {}) {
  const m = BY_ID[modelId];
  if (m?.credits) return m.credits;
  return Number(CREDIT.image) || 15;
}

module.exports = {
  listImageModels,
  resolveImageModelChoice,
  imageModelCredits,
  IMAGE_MODELS: MODELS_JSON,
};
