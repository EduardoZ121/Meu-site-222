const MODELS = {
  grok: "xai/grok-imagine-image",
};

const { openaiConfigured } = require("./openaiEnv.cjs");

/**
 * grok / flux2 → Grok (Replicate)
 * gpt_image → OpenAI GPT Image 1 (texto + foto via JSON edits)
 */
function resolvePosterModel(modelKey) {
  const key = String(modelKey || "grok").trim();

  if (key === "gpt_image") {
    if (!openaiConfigured()) {
      const err = new Error("Motor GPT indisponível — OPENAI_API_KEY em falta na Vercel.");
      err.status = 503;
      throw err;
    }
    return {
      engine: "openai",
      modelKey: "gpt_image",
      modelId: null,
      modelUsed: "openai/gpt-image-1",
    };
  }

  return {
    engine: "grok",
    modelKey: key === "flux2" ? "pro" : "standard",
    modelId: MODELS.grok,
    modelUsed: MODELS.grok,
  };
}

function openaiPosterEnabled() {
  return openaiConfigured();
}

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
