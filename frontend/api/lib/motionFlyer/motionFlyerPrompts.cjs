/**
 * Hidden prompt registry — prompts never shown in UI.
 */
const { PROMPTS_BY_CATEGORY, allPromptEntries } = require("./motionFlyerPromptLibrary.cjs");

const FLYER_DEFAULT = "the flyer in [Image1]";

function listPromptSlots(categoryId) {
  const key = String(categoryId || "").trim();
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

function selectHiddenPrompt(categoryId) {
  let pool = listPromptSlots(categoryId).filter((p) => p?.prompt);
  if (!pool.length && categoryId !== "general") {
    pool = listPromptSlots("general").filter((p) => p?.prompt);
  }
  return pickWeightedRandom(pool);
}

function applyFlyerLabel(prompt, flyerLabel) {
  let p = String(prompt || "");
  const label = String(flyerLabel || "").trim();
  const phrase = label ? `${label} (flyer in [Image1])` : FLYER_DEFAULT;
  return p.replace(/__FLYER__/g, phrase);
}

function buildFallbackStoryboard(categoryId, flyerLabel) {
  const label = flyerLabel || "the flyer";
  const cat = String(categoryId || "event").replace(/([A-Z])/g, " $1").trim();
  return {
    id: "auto_fallback",
    storyboard:
      `10s premium After Effects motion flyer for ${cat}. `
      + `Animate ${label} using [Image1] with parallax, kinetic typography, and cinematic camera. `
      + `Preserve all branding and text readability.`,
    prompt: null,
  };
}

function buildFinalPrompt({
  categoryId,
  flyerLabel,
  motionMood = "",
  layerNotes = "",
}) {
  const selected = selectHiddenPrompt(categoryId);
  const fallback = buildFallbackStoryboard(categoryId, flyerLabel);

  if (selected?.prompt) {
    let prompt = applyFlyerLabel(selected.prompt, flyerLabel);
    if (motionMood) {
      prompt = `${prompt}\n\nMotion mood: ${motionMood}`;
    }
    if (layerNotes) {
      prompt = `${prompt}\n\nLayer emphasis: ${layerNotes}`;
    }
    return {
      promptId: selected.id,
      storyboard: selected.storyboard || fallback.storyboard,
      prompt,
      generateAudio: Boolean(selected.generateAudio),
    };
  }

  const label = flyerLabel || "the flyer";
  let prompt =
    `Create a professional 10-second After Effects-style motion flyer for ${label} in [Image1]. `
    + `${fallback.storyboard} `
    + "Preserve original design, colors, logos, and text. Premium motion graphics, parallax depth, kinetic typography, cinematic camera. "
    + "Maintain text readability. No redesign.";
  if (motionMood) prompt = `${prompt}\n\nMotion mood: ${motionMood}`;
  if (layerNotes) prompt = `${prompt}\n\nLayer emphasis: ${layerNotes}`;

  return {
    promptId: "auto_fallback",
    storyboard: fallback.storyboard,
    prompt,
    generateAudio: true,
  };
}

module.exports = {
  PROMPTS_BY_CATEGORY,
  listPromptSlots,
  selectHiddenPrompt,
  buildFinalPrompt,
  allPromptEntries,
};
