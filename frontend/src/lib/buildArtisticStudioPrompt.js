import {
  ARTISTIC_STUDIO_STYLES,
  ARTISTIC_EFFECT_SECTIONS,
} from "./artisticStudioData";
import {
  buildAiLabEditPrompt,
  buildArtisticImageEditPrompt,
  buildPhotographyEditPrompt,
} from "./artisticLabPrompt";

export function getStyleById(styleId) {
  return ARTISTIC_STUDIO_STYLES.find((s) => s.id === styleId) || null;
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

  if (style?.cat === "nsfw") {
    return buildAiLabEditPrompt({
      userPrompt: trimmed,
      styleSuffix: style?.suffix || "",
      extras: effectParts,
    });
  }

  const isPhotography =
    style?.cat === "photography" || styleCat === "photography";

  if (isPhotography && imageMode) {
    return buildPhotographyEditPrompt({
      userPrompt: trimmed,
      styleSuffix: style?.suffix || "",
      extras: effectParts,
    });
  }

  if (imageMode) {
    const suffixParts = [];
    if (style?.labPreset) {
      suffixParts.push(
        "Rapid image edit: apply style to the reference while preserving identity, face, exact age, pose and framing.",
      );
    }
    if (style?.suffix) suffixParts.push(style.suffix);
    return buildArtisticImageEditPrompt({
      userPrompt: trimmed,
      styleSuffix: suffixParts.filter(Boolean).join(". "),
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
  parts.push(
    "Ultra high quality, professional art direction, cohesive visual recipe.",
  );

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
