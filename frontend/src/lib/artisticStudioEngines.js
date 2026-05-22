import { getStyleById } from "./buildArtisticStudioPrompt";

/** @typedef {"grok" | "flux" | "kontext"} ArtisticEngineKey */

const MODEL_LABELS = {
  grok: "Grok Imagine",
  flux: "Flux Klein 9B",
  kontext: "Flux Kontext Max",
};

/**
 * Resolve Replicate motor for Estúdio Artístico from style + input mode.
 * @param {{ styleId?: string | null, hasPhoto?: boolean }} opts
 */
export function resolveArtisticEngine({ styleId, hasPhoto = false }) {
  const style = getStyleById(styleId);
  if (!style) {
    return {
      modelKey: hasPhoto ? "standard" : "standard",
      label: MODEL_LABELS.grok,
      engineId: "grok",
    };
  }

  const isNsfw = style.cat === "nsfw";
  if (!isNsfw) {
    return {
      modelKey: "standard",
      label: MODEL_LABELS.grok,
      engineId: "grok",
    };
  }

  const textEngine = style.textEngine || style.engine || "flux";
  const editEngine = style.editEngine || (style.labPreset ? "kontext" : style.engine) || "kontext";

  if (hasPhoto && editEngine === "kontext") {
    return { modelKey: "kontext", label: MODEL_LABELS.kontext, engineId: "kontext" };
  }
  if (hasPhoto && editEngine === "flux") {
    return { modelKey: "pro", label: MODEL_LABELS.flux, engineId: "flux" };
  }
  if (!hasPhoto && textEngine === "flux") {
    return { modelKey: "pro", label: MODEL_LABELS.flux, engineId: "flux" };
  }
  if (!hasPhoto && textEngine === "kontext") {
    return { modelKey: "pro", label: MODEL_LABELS.flux, engineId: "flux" };
  }
  return { modelKey: "standard", label: MODEL_LABELS.grok, engineId: "grok" };
}

export function getArtisticEngineLabel(styleId, hasPhoto, t) {
  const { engineId } = resolveArtisticEngine({ styleId, hasPhoto });
  if (t) {
    const key = `art_engine_${engineId}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return MODEL_LABELS[engineId] || MODEL_LABELS.grok;
}
