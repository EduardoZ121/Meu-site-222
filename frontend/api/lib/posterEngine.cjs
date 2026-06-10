const REPLICATE_MODELS = {
  grok: "xai/grok-imagine-image",
  nano_banana: "google/nano-banana",
};

const LEGACY_ALIASES = {
  flux2: "nano_banana",
};

const { openaiConfigured } = require("./openaiEnv.cjs");

function normalizePosterModelKey(modelKey) {
  const key = String(modelKey || "grok").trim();
  return LEGACY_ALIASES[key] || key;
}

/** Custo por imagem consoante o motor escolhido. */
function posterCreditCost(modelKey, CREDIT = {}) {
  const key = normalizePosterModelKey(modelKey);
  if (key === "gpt_image") return CREDIT.posterPremium ?? 20;
  if (key === "nano_banana") return CREDIT.posterPro ?? 15;
  return CREDIT.posterFast ?? 10;
}

function resolvePosterModel(modelKey) {
  const key = normalizePosterModelKey(modelKey);

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

  if (key === "nano_banana") {
    return {
      engine: "nano_banana",
      modelKey: "nano_banana",
      modelId: REPLICATE_MODELS.nano_banana,
      modelUsed: REPLICATE_MODELS.nano_banana,
    };
  }

  return {
    engine: "grok",
    modelKey: "grok",
    modelId: REPLICATE_MODELS.grok,
    modelUsed: REPLICATE_MODELS.grok,
  };
}

function normalizeNanoBananaAspect(aspectRatio) {
  const ar = String(aspectRatio || "4:5");
  const map = {
    "4:5": "3:4",
    "5:4": "4:3",
    "2:1": "16:9",
    "1:2": "9:16",
    "21:9": "16:9",
    "9:21": "9:16",
  };
  const allowed = new Set(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]);
  if (allowed.has(ar)) return map[ar] || ar;
  return "3:4";
}

function buildNanoBananaPosterInput({ prompt, aspectRatio, photoRef, garmentRef }) {
  const input = {
    prompt,
    aspect_ratio: normalizeNanoBananaAspect(aspectRatio),
    output_format: "jpg",
  };
  const refs = [];
  if (photoRef) refs.push(photoRef);
  if (garmentRef) refs.push(garmentRef);
  if (refs.length) input.image_input = refs;
  return input;
}

function buildPosterFashionReferenceInstruction(hasPhoto, hasGarment) {
  if (!hasPhoto) return "";
  let out = (
    "FASHION REFERENCE LOCK (mandatory): Image 1 is the person — preserve 100% of their face, "
    + "facial features, skin tone, ethnicity, hair, body shape and proportions in EVERY panel. "
  );
  if (hasGarment) {
    out += (
      "Image 2 is the clothing/garment — copy exact fabric, cut, color, patterns and accessories "
      + "onto that same person across all panels. "
    );
  } else {
    out += (
      "Preserve the exact outfit, colors and accessories visible on the person in image 1 unless "
      + "the layout explicitly requires a detail zoom. "
    );
  }
  out += (
    "Output ONE finished editorial fashion sheet — NOT a side-by-side collage of the uploads, "
    + "NOT the input layout. Same identity and outfit in hero, turnaround and detail panels."
  );
  return out;
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

function buildPosterLogoInstruction(hasLogo, hasPhoto, opts = {}) {
  if (opts.fashion) return "";
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
  if (ar === "16:9" || ar === "2:1" || ar === "21:9" || ar === "3:2") return "1536x1024";
  return "1024x1536";
}

function openAISizeToAspectRatio(size) {
  const s = String(size || "");
  if (s === "1024x1024") return "1:1";
  if (s === "1536x1024") return "16:9";
  if (s === "1024x1536") return "2:3";
  return "2:3";
}

const POSTER_FULL_BLEED_GUARD = (
  "FULL BLEED (mandatory): The entire output canvas must be filled with poster artwork edge-to-edge. "
  + "NO black bars, NO letterboxing, NO empty strips at the top or bottom. "
  + "Reserve the upper third for large headline typography; place the subject in the middle-lower area. "
  + "Every text line from the brief must render fully inside the frame, never clipped."
);

const POSTER_FASHION_BLEED_GUARD = (
  "FULL BLEED (mandatory): Fill the canvas edge-to-edge with the fashion editorial sheet. "
  + "NO black bars or letterboxing. Clean panel gutters only — no empty strips."
);

function openaiPosterEnabled() {
  return openaiConfigured();
}

module.exports = {
  resolvePosterModel,
  normalizePosterModelKey,
  posterCreditCost,
  buildNanoBananaPosterInput,
  normalizeNanoBananaAspect,
  buildPosterFashionReferenceInstruction,
  buildPosterTextManifest,
  buildPosterLogoInstruction,
  aspectToOpenAISize,
  openAISizeToAspectRatio,
  POSTER_FULL_BLEED_GUARD,
  POSTER_FASHION_BLEED_GUARD,
  openaiPosterEnabled,
};
