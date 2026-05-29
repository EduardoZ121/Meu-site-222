import {
  ARTISTIC_STUDIO_STYLES,
  ARTISTIC_EFFECT_SECTIONS,
} from "./artisticStudioData";
import {
  buildArtisticPhotoEditPrompt,
  buildArtisticTextPrompt,
} from "./artisticLabPrompt";
import {
  getArtisticStyleEditPrompt,
  getArtisticStyleTextPrompt,
  sanitizeEffectPrompt,
} from "./artisticStylePrompts";

export function getStyleById(styleId) {
  return ARTISTIC_STUDIO_STYLES.find((s) => s.id === styleId) || null;
}

function collectEffectPromptParts(effects = {}) {
  const effectParts = [];
  for (const section of ARTISTIC_EFFECT_SECTIONS) {
    const value = effects[section.id];
    if (section.type === "radio" && value) {
      const opt = section.options.find((o) => o.id === value);
      if (opt?.prompt) effectParts.push(sanitizeEffectPrompt(opt.prompt));
    }
    if (section.type === "checkbox" && value && typeof value === "object") {
      for (const opt of section.options) {
        if (value[opt.id] && opt.prompt) {
          effectParts.push(sanitizeEffectPrompt(opt.prompt));
        }
      }
    }
  }
  return effectParts;
}

export function buildArtisticStudioPrompt({
  userPrompt = "",
  styleId = null,
  effects = {},
  imageMode = false,
}) {
  const trimmed = String(userPrompt || "").trim();
  const style = getStyleById(styleId);
  const effectParts = collectEffectPromptParts(effects);

  if (imageMode) {
    return buildArtisticPhotoEditPrompt({
      userPrompt: trimmed,
      stylePrompt: getArtisticStyleEditPrompt(style),
      effects: effectParts,
    });
  }

  return buildArtisticTextPrompt({
    userPrompt: trimmed,
    stylePrompt: getArtisticStyleTextPrompt(style),
    effects: effectParts,
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
