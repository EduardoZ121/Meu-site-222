/** Normaliza modelos de pôster vindos da API (legado dizia «GPT» mas o motor é Replicate Pro). */
export function normalizePosterModel(model) {
  if (!model) return model;
  const key = model.key;
  if (key === "gpt_image") {
    return {
      ...model,
      label: "Motor Premium",
      tag: "Texto nítido · Grok",
      supports_photo: true,
    };
  }
  if (key === "flux2") {
    return {
      ...model,
      label: model.label || "Motor Pro",
      tag: "Grok + logo",
      supports_photo: true,
    };
  }
  const label = String(model.label || "");
  if (/gpt/i.test(label)) {
    return {
      ...model,
      label: label
        .replace(/motor\s*gpt/gi, "Motor Premium")
        .replace(/\bgpt\b/gi, "Premium")
        .trim(),
    };
  }
  return model;
}

export function normalizePosterModels(models) {
  return (models || []).map(normalizePosterModel);
}
