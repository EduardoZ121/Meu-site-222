import {
  ARTISTIC_STUDIO_STYLES,
  ARTISTIC_EFFECT_SECTIONS,
} from "./artisticStudioData";
import {
  buildAiLabEditPrompt,
  buildPhotoStyleEditPrompt,
  buildPhotographyEditPrompt,
} from "./artisticLabPrompt";

export function getStyleById(styleId) {
  return ARTISTIC_STUDIO_STYLES.find((s) => s.id === styleId) || null;
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

export function buildArtisticStudioPrompt({
  userPrompt = "",
  styleId = null,
  styleCat = null,
  effects = {},
  imageMode = false,
}) {
  const trimmed = String(userPrompt || "").trim();
  const style = getStyleById(styleId);
  const effectParts = collectEffectPromptParts(effects);

  const styleSuffixParts = [];
  if (style?.labPreset && imageMode) {
    styleSuffixParts.push(
      "Rapid edit preserving identity, face, exact age, pose and framing.",
    );
  }
  if (style?.suffix) styleSuffixParts.push(style.suffix);
  const styleSuffix = styleSuffixParts.filter(Boolean).join(". ");

  if (style?.cat === "nsfw" && imageMode) {
    return buildAiLabEditPrompt({
      userPrompt: trimmed,
      styleSuffix,
      extras: effectParts,
    });
  }

  const isPhotography =
    style?.cat === "photography" || styleCat === "photography";

  if (imageMode) {
    if (isPhotography) {
      return buildPhotographyEditPrompt({
        userPrompt: trimmed,
        styleSuffix,
        extras: effectParts,
      });
    }
    return buildPhotoStyleEditPrompt({
      userPrompt: trimmed,
      styleSuffix,
      extras: effectParts,
    });
  }

  const parts = [];
  if (trimmed) parts.push(trimmed);
  if (style?.labPreset) {
    parts.push("Experimental diffusion rendering with editorial finish.");
  }
  if (style?.suffix) parts.push(style.suffix);
  parts.push(...effectParts);
  parts.push("Ultra high quality, professional art direction, cohesive visual recipe.");

  return parts.filter(Boolean).join(". ").replace(/\.\s*\./g, ".");
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
