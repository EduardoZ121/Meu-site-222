import models from "../config/imageModels.json";

const BY_ID = Object.fromEntries(models.map((m) => [m.id, m]));

export const IMAGE_MODEL_OPTIONS = models;

export function getImageModel(id) {
  return BY_ID[id] || BY_ID.grok;
}

export function imageModelBaseCredits(id, costs = {}) {
  const m = getImageModel(id);
  return m?.credits ?? costs.image ?? 15;
}
