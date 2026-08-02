/** Normaliza modelos de pôster vindos da API — labels canónicos EN (UI traduz via i18n keys). */
export function normalizePosterModel(model) {
  if (!model) return model;
  const key = model.key;
  if (key === "gpt_image") {
    return {
      ...model,
      label: model.label || "High quality",
      tag: model.tag || "Sharp text · max detail",
      wallet: "premium",
      supports_photo: true,
    };
  }
  if (key === "grok") {
    return {
      ...model,
      label: model.label || "Low quality",
      tag: model.tag || "Fast · economical",
      wallet: "standard",
      supports_photo: true,
    };
  }
  if (key === "flux2" || key === "nano_banana") {
    return {
      ...model,
      key: "flux2",
      label: model.label || "Medium quality",
      tag: model.tag || "Photo-realistic",
      wallet: "standard",
      supports_photo: true,
    };
  }
  return model;
}

export function normalizePosterModels(models) {
  const normalized = (models || []).map(normalizePosterModel);
  const hasFlux2 = normalized.some((m) => m.key === "flux2");
  if (hasFlux2) return normalized.filter((m) => m.key !== "nano_banana");
  return normalized;
}
