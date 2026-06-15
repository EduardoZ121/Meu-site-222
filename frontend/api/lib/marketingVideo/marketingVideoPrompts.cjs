/**
 * Hidden prompt registry — prompts never shown in UI.
 * Selection: random weighted pick from category pool (or all pools for "random").
 */
const { PROMPTS_BY_CATEGORY, allPromptEntries } = require("./marketingVideoPromptLibrary.cjs");

const PRODUCT_DEFAULT = "the product in [Image1]";

function listPromptSlots(categoryId) {
  const key = String(categoryId || "").trim();
  if (key === "random") return allPromptEntries();
  return Array.isArray(PROMPTS_BY_CATEGORY[key]) ? PROMPTS_BY_CATEGORY[key] : [];
}

function pickWeightedRandom(pool) {
  if (!pool.length) return null;
  const total = pool.reduce((s, p) => s + (Number(p.weight) || 1), 0);
  let r = Math.random() * total;
  for (const p of pool) {
    r -= Number(p.weight) || 1;
    if (r <= 0) return p;
  }
  return pool[pool.length - 1];
}

function selectHiddenPrompt(categoryId, duration) {
  const dur = Math.round(Number(duration) || 15);
  let pool = listPromptSlots(categoryId).filter((p) => {
    if (!p?.prompt) return false;
    if (!Array.isArray(p.durations) || !p.durations.length) return true;
    return p.durations.includes(dur);
  });

  if (!pool.length) {
    pool = listPromptSlots(categoryId).filter((p) => p?.prompt);
  }
  if (!pool.length && categoryId !== "general") {
    pool = listPromptSlots("general").filter((p) => p?.prompt);
  }
  return pickWeightedRandom(pool);
}

function applyImageRefs(prompt, imageCount) {
  let p = String(prompt || "");
  if (imageCount > 1) {
    const refs = imageCount === 2 ? "[Image2]" : `[Image2] through [Image${imageCount}]`;
    p = p.replace(
      "__REFS__",
      `Use ${refs} for branding, colors, textures, angles, and visual identity.`,
    );
  } else {
    p = p.replace("__REFS__", "");
  }
  return p.replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function applyProductLabel(prompt, productLabel) {
  let p = String(prompt || "");
  const label = String(productLabel || "").trim();
  const productPhrase = label ? `${label} in [Image1]` : PRODUCT_DEFAULT;
  p = p.replace(/__PRODUCT__/g, productPhrase);
  if (label) {
    p = p.replace(/\bthe product in \[Image1\]/gi, `${label} in [Image1]`);
    p = p.replace(/\bthe product\b/gi, label);
  }
  return p;
}

function buildFallbackStoryboard(categoryId, productLabel) {
  const label = productLabel || "the product";
  const cat = String(categoryId || "product").replace(/([A-Z])/g, " $1").trim();
  return {
    id: "auto_fallback",
    storyboard:
      `15s premium marketing ad for ${cat}. `
      + `Hero showcase of ${label} using [Image1]. `
      + `Smooth cinematic camera, professional lighting, ad-ready pacing!`,
    prompt: null,
  };
}

function buildFinalPrompt({
  categoryId,
  duration,
  productLabel,
  imageCount,
  creativeAngle = "",
  visualStyle = "",
}) {
  const selected = selectHiddenPrompt(categoryId, duration);
  const fallback = buildFallbackStoryboard(categoryId, productLabel);
  const { resolveVisualStyle } = require("./marketingVideoVisualStyles.cjs");
  const style = resolveVisualStyle(visualStyle);

  if (selected?.prompt) {
    let prompt = applyProductLabel(selected.prompt, productLabel);
    prompt = applyImageRefs(prompt, imageCount);
    if (style.prompt) {
      prompt = `${prompt}\n\nVisual direction: ${style.prompt}`;
    }
    if (creativeAngle) {
      prompt = `${prompt}\n\nCreative emphasis: ${creativeAngle}`;
    }
    return {
      promptId: selected.id,
      storyboard: selected.storyboard || fallback.storyboard,
      prompt,
      generateAudio: Boolean(selected.generateAudio),
      visualStyleId: style.id,
    };
  }

  const label = productLabel || "the product";
  const refLine = imageCount > 1
    ? `Reference images [Image2]${imageCount > 2 ? ` through [Image${imageCount}]` : ""} for brand and context.`
    : "";
  let prompt = applyImageRefs(
    `Create a cinematic 15-second premium marketing advertisement for ${label} in [Image1]. __REFS__ `
    + `${refLine} `
    + `${fallback.storyboard} `
    + "Smooth transitions, high-end cinematography, dynamic camera! "
    + "No text overlays or watermarks unless on reference packaging.",
    imageCount,
  );
  if (style.prompt) {
    prompt = `${prompt}\n\nVisual direction: ${style.prompt}`;
  }

  return {
    promptId: "auto_fallback",
    storyboard: fallback.storyboard,
    prompt,
    generateAudio: true,
    visualStyleId: style.id,
  };
}

function countPromptsByCategory(categoryId) {
  return listPromptSlots(categoryId).filter((p) => p?.prompt).length;
}

module.exports = {
  PROMPTS_BY_CATEGORY,
  listPromptSlots,
  selectHiddenPrompt,
  buildFinalPrompt,
  countPromptsByCategory,
  allPromptEntries,
};
