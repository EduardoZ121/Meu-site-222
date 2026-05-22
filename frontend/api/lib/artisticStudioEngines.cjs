/**
 * Motor por estilo — espelha artisticStudioData (cat nsfw + engine fields).
 * Mantido em sync com frontend/src/lib/artisticStudioData.js
 */

const NSFW_STYLE_ENGINES = {
  lab_qwen_edit: { textEngine: "flux", editEngine: "kontext", labPreset: true },
  lab_ai_rapid: { textEngine: "flux", editEngine: "kontext", labPreset: true },
  lab_cinematic_edit: { textEngine: "flux", editEngine: "kontext", labPreset: true },
  lab_advanced_prompt: { textEngine: "flux", editEngine: "kontext", labPreset: true },
  lab_experimental_ai: { textEngine: "flux", editEngine: "kontext", labPreset: true },
  lab_ultra_style: { textEngine: "flux", editEngine: "kontext", labPreset: true },
  lab_flux_edit: { textEngine: "flux", editEngine: "kontext", labPreset: true },
  lab_realistic_edit: { textEngine: "flux", editEngine: "kontext", labPreset: true },
  lab_hybrid_nsfw: { textEngine: "flux", editEngine: "kontext", labPreset: true },
  nsfw_swimwear: { textEngine: "flux", editEngine: "kontext", tier: "light" },
  nsfw_beach: { textEngine: "flux", editEngine: "kontext", tier: "light" },
  nsfw_lingerie_soft: { textEngine: "flux", editEngine: "kontext", tier: "light" },
  nsfw_fitness_glam: { textEngine: "flux", editEngine: "kontext", tier: "light" },
  nsfw_boudoir: { textEngine: "flux", editEngine: "kontext", tier: "light" },
  nsfw_pinup: { textEngine: "flux", editEngine: "kontext", tier: "light" },
  nsfw_dark: { textEngine: "flux", editEngine: "kontext", tier: "light" },
  nsfw_fantasy: { textEngine: "flux", editEngine: "kontext", tier: "light" },
  nsfw_sheer: { textEngine: "flux", editEngine: "kontext", tier: "heavy" },
  nsfw_figure_study: { textEngine: "flux", editEngine: "kontext", tier: "heavy" },
  nsfw_explicit_art: { textEngine: "flux", editEngine: "kontext", tier: "heavy" },
  nsfw_intimate_couple: { textEngine: "flux", editEngine: "kontext", tier: "heavy" },
};

function lookupStyleMeta(styleId) {
  const id = String(styleId || "").trim();
  if (!id) return null;
  if (NSFW_STYLE_ENGINES[id]) return { id, cat: "nsfw", ...NSFW_STYLE_ENGINES[id] };
  if (id.startsWith("lab_") || id.startsWith("nsfw_")) {
    return {
      id,
      cat: "nsfw",
      textEngine: "flux",
      editEngine: "kontext",
      labPreset: id.startsWith("lab_"),
    };
  }
  return null;
}

function resolveArtisticEngine({ styleId, hasPhoto }) {
  const style = lookupStyleMeta(styleId);
  if (!style || style.cat !== "nsfw") {
    return { modelKey: "standard", label: "Grok Imagine", engineId: "grok" };
  }
  const textEngine = style.textEngine || "flux";
  const editEngine = style.editEngine || "kontext";
  if (hasPhoto && editEngine === "kontext") {
    return { modelKey: "kontext", label: "Flux Kontext Max (AI Lab)", engineId: "kontext" };
  }
  if (hasPhoto && editEngine === "flux") {
    return { modelKey: "pro", label: "Flux Klein 9B", engineId: "flux" };
  }
  if (!hasPhoto && textEngine === "flux") {
    return { modelKey: "pro", label: "Flux Klein 9B (mature text)", engineId: "flux" };
  }
  return { modelKey: "standard", label: "Grok Imagine", engineId: "grok" };
}

function isNsfwStyleId(styleId) {
  const id = String(styleId || "").trim();
  if (!id) return false;
  return id.startsWith("lab_") || id.startsWith("nsfw_") || Boolean(NSFW_STYLE_ENGINES[id]);
}

module.exports = {
  NSFW_STYLE_ENGINES,
  lookupStyleMeta,
  resolveArtisticEngine,
  isNsfwStyleId,
};
