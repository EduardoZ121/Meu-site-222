/** Normaliza modelos de pôster vindos da API. */
export function normalizePosterModel(model) {
  if (!model) return model;
  const key = model.key;
  if (key === "gpt_image") {
    return {
      ...model,
      label: "Motor GPT",
      tag: "GPT Image 1 · texto nítido · com foto",
      supports_photo: true,
    };
  }
  if (key === "flux2") {
    return {
      ...model,
      label: model.label || "Motor Pro",
      tag: "Grok · com foto",
      supports_photo: true,
    };
  }
  if (key === "grok") {
    return {
      ...model,
      label: model.label || "Motor Rápido",
      tag: model.tag || "Grok · com foto",
      supports_photo: true,
    };
  }
  return model;
}

export function normalizePosterModels(models) {
  return (models || []).map(normalizePosterModel);
}
