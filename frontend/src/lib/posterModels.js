/** Normaliza modelos de pôster vindos da API. */
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
      label: model.label || "Baixa qualidade",
      tag: model.tag || "Rápido · económico",
      wallet: "standard",
      supports_photo: true,
    };
  }
  if (key === "flux2" || key === "nano_banana") {
    return {
      ...model,
      key: "flux2",
      label: model.label || "Média qualidade",
      tag: model.tag || "Foto-realista",
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
