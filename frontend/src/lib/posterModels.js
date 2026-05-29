/** Normaliza modelos de pôster vindos da API (legado dizia «GPT» mas o motor é Replicate Pro). */
export function normalizePosterModel(model) {
  if (!model) return model;
  const key = model.key;
  if (key === "gpt_image") {
    return {
      ...model,
      label: "Motor Premium",
      tag: "Qualidade Máxima",
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
