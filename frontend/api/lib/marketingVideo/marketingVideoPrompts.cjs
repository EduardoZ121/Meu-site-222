/**
 * Hidden prompt registry — add 3–10 prompts per category later.
 *
 * Entry shape:
 * {
 *   id: "fashion_hero_pan_01",
 *   durations: [4, 6, 10, 15],       // optional filter
 *   weight: 1,                        // optional priority
 *   storyboard: "Opening hero shot…",   // internal concept line
 *   prompt: "Full Seedance prompt…",   // hidden from user
 * }
 */

const PROMPTS_BY_CATEGORY = {
  fashion: [],
  drinks: [],
  cars: [],
  cosmetics: [],
  websites: [],
  food: [],
  jewelry: [],
  realEstate: [],
  gaming: [],
};

function listPromptSlots(categoryId) {
  const key = String(categoryId || "").trim();
  return Array.isArray(PROMPTS_BY_CATEGORY[key]) ? PROMPTS_BY_CATEGORY[key] : [];
}

function selectHiddenPrompt(categoryId, duration) {
  const pool = listPromptSlots(categoryId).filter((p) => {
    if (!p?.prompt) return false;
    if (!Array.isArray(p.durations) || !p.durations.length) return true;
    return p.durations.includes(Math.round(Number(duration)));
  });
  if (!pool.length) return null;
  pool.sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0));
  return pool[0];
}

function buildFallbackStoryboard(categoryId, duration, productLabel) {
  const label = productLabel || "the product";
  const cat = String(categoryId || "product").replace(/([A-Z])/g, " $1").trim();
  return {
    id: "auto_fallback",
    storyboard:
      `Vertical ${duration}s premium marketing ad for ${cat}. `
      + `Hero showcase of ${label} using [Image1]. `
      + `Use reference images for angles, branding and context. `
      + `Smooth cinematic camera, soft professional lighting, ad-ready pacing.`,
    prompt: null,
  };
}

function buildFinalPrompt({ categoryId, duration, productLabel, imageCount }) {
  const selected = selectHiddenPrompt(categoryId, duration);
  const story = selected?.storyboard
    || buildFallbackStoryboard(categoryId, duration, productLabel).storyboard;

  const refLine = imageCount > 1
    ? `Reference images [Image2]${imageCount > 2 ? ` through [Image${imageCount}]` : ""} for brand, angles and visual context.`
    : "";

  const hidden = selected?.prompt
    ? `\n\nCreative direction (internal): ${selected.prompt}`
    : "";

  return {
    promptId: selected?.id || "auto_fallback",
    storyboard: story,
    prompt:
      `${story} ${refLine} `
      + "Vertical 9:16 commercial format, smooth transitions, natural motion, "
      + "high-end cinematography, no text overlays, no watermarks, no logos unless from reference images."
      + hidden,
  };
}

module.exports = {
  PROMPTS_BY_CATEGORY,
  listPromptSlots,
  selectHiddenPrompt,
  buildFinalPrompt,
};
