import {
  ARTISTIC_STUDIO_STYLES,
  ARTISTIC_EFFECT_SECTIONS,
} from "./artisticStudioData";
import {
  buildArtisticEditPrompt,
  buildArtisticTextPrompt,
} from "./artisticLabPrompt";

export function getStyleById(styleId) {
  return ARTISTIC_STUDIO_STYLES.find((s) => s.id === styleId) || null;
}

/**
 * Universal artistic prompt builder.
 *
 * Key fix (vs. previous version): EVERY style category now goes through a
 * proper identity-preserving edit pipeline when a photo is uploaded, not just
 * "photography" and "nsfw". This stops the bug where applying anime / cartoon /
 * classic / modern styles to an uploaded photo would age, replace or distort
 * the subject's face and body.
 */
export function buildArtisticStudioPrompt({
  userPrompt = "",
  styleId = null,
  styleCat = null,
  effects = {},
  imageMode = false,
}) {
  const style = getStyleById(styleId);
  const cat = style?.cat || styleCat || null;
  const isAiLab = cat === "nsfw" || Boolean(style?.labPreset);
  const isPhotography = cat === "photography";

  const effectParts = collectEffectPromptParts(effects);
  const trimmed = String(userPrompt || "").trim();

  // PHOTO MODE → identity-preserving edit pipeline (universal).
  if (imageMode) {
    return buildArtisticEditPrompt({
      userPrompt: trimmed,
      styleSuffix: style?.suffix || "",
      styleCat: cat,
      isAiLab,
      isPhotography,
      extras: effectParts,
    });
  }

  // TEXT-ONLY MODE → pure generation, no identity lock needed.
  return buildArtisticTextPrompt({
    userPrompt: trimmed,
    styleSuffix: style?.suffix || "",
    extras: effectParts,
  });
}

export function buildRecipeChips({ styleId, effects = {} }) {
  const chips = [];
  const style = getStyleById(styleId);
  if (style) chips.push({ emoji: "🎨", label: style.label });

  for (const section of ARTISTIC_EFFECT_SECTIONS) {
    const value = effects[section.id];
    if (section.type === "radio" && value) {
      const opt = section.options.find((o) => o.id === value);
      if (opt) chips.push({ emoji: sectionEmoji(section.id), label: opt.label });
    }
    if (section.type === "checkbox" && value) {
      for (const opt of section.options) {
        if (value[opt.id]) chips.push({ emoji: sectionEmoji(section.id), label: opt.label });
      }
    }
  }
  return chips;
}

function collectEffectPromptParts(effects = {}) {
  const effectParts = [];
  for (const section of ARTISTIC_EFFECT_SECTIONS) {
    const value = effects[section.id];
    if (section.type === "radio" && value) {
      const opt = section.options.find((o) => o.id === value);
      if (opt?.prompt) effectParts.push(opt.prompt);
    }
    if (section.type === "checkbox" && value && typeof value === "object") {
      for (const opt of section.options) {
        if (value[opt.id] && opt.prompt) effectParts.push(opt.prompt);
      }
    }
  }
  return effectParts;
}

function sectionEmoji(sectionId) {
  const map = {
    lighting: "🌅",
    lens: "📷",
    atmosphere: "🌫️",
    color: "🎨",
  };
  return map[sectionId] || "✦";
}

export const EMPTY_EFFECTS = {
  lighting: null,
  lens: null,
  atmosphere: {},
  color: null,
};
