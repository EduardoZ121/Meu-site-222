const MODELS = {
  grok: "xai/grok-imagine-image",
};

/**
 * Posters: Pro/Premium deixam de usar Flux (texto ilegível). Todos com foto → Grok.
 */
function resolvePosterModel(modelKey, { hasPhoto } = {}) {
  const key = String(modelKey || "grok").trim();
  if (key === "gpt_image" && !hasPhoto && openaiPosterEnabled()) {
    return {
      engine: "openai",
      modelKey: "openai_poster",
      modelId: null,
      modelUsed: "openai/gpt-image-1",
    };
  }
  return {
    engine: "grok",
    modelKey: "standard",
    modelId: MODELS.grok,
    modelUsed: MODELS.grok,
  };
}

function openaiPosterEnabled() {
  return Boolean(String(process.env.OPENAI_API_KEY || "").trim());
}

/** Lista explícita de copy para o modelo não inventar texto. */
function buildPosterTextManifest(placeholders = {}, templatePlaceholders = []) {
  const keys = templatePlaceholders?.length
    ? templatePlaceholders
    : Object.keys(placeholders || {});
  const lines = [];
  for (const k of keys) {
    const v = String(placeholders[k] || "").trim();
    if (!v) continue;
    lines.push(`• "${v}" (label field: ${k})`);
  }
  if (!lines.length) return "";
  return [
    "EXACT COPY BLOCK (mandatory — render every line below verbatim on the poster):",
    "Spell each word exactly as written. No gibberish, no random letters, no placeholder Latin.",
    "Use clean professional typography with high contrast.",
    ...lines,
  ].join("\n");
}

function buildPosterLogoInstruction(hasLogo, hasPhoto) {
  if (!hasLogo) return "";
  if (hasPhoto) {
    return (
      "BRAND LOGO: A small brand logo is already composited in the top-left of the reference image. "
      + "Keep it sharp, readable, same colors and shape — do not duplicate, distort or replace it."
    );
  }
  return (
    "BRAND LOGO: Use the uploaded logo reference as the business mark in the designated logo zone. "
    + "Preserve exact colors, shape and proportions."
  );
}

function aspectToOpenAISize(aspectRatio) {
  const ar = String(aspectRatio || "4:5");
  if (ar === "1:1") return "1024x1024";
  if (ar === "16:9" || ar === "2:1" || ar === "21:9") return "1536x1024";
  if (ar === "9:16" || ar === "1:2" || ar === "2:3" || ar === "3:4" || ar === "4:5") {
    return "1024x1536";
  }
  return "1024x1536";
}

module.exports = {
  resolvePosterModel,
  buildPosterTextManifest,
  buildPosterLogoInstruction,
  aspectToOpenAISize,
  openaiPosterEnabled,
};
