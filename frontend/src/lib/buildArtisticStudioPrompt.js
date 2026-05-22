import {
  ARTISTIC_STUDIO_STYLES,
  ARTISTIC_EFFECT_SECTIONS,
} from "./artisticStudioData";

export function getStyleById(styleId) {
  return ARTISTIC_STUDIO_STYLES.find((s) => s.id === styleId) || null;
}

export function buildArtisticStudioPrompt({
  userPrompt = "",
  styleId = null,
  effects = {},
  imageMode = false,
}) {
  const parts = [];
  const trimmed = String(userPrompt || "").trim();

  if (imageMode) {
    parts.push(
      "Edit and transform the provided reference image. Preserve the subject identity, face, and overall composition unless the edit explicitly requires change.",
    );
  }

  const style = getStyleById(styleId);

  if (trimmed) {
    parts.push(
      `Primary scene and subject — follow the user description exactly (wardrobe, pose, action): ${trimmed}`,
    );
  }
  if (style?.labPreset) {
    parts.push(
      imageMode
        ? "Rapid image edit: transform the reference photo while preserving identity, face, pose and framing."
        : "Experimental diffusion rendering with editorial finish.",
    );
  }
  if (style?.suffix) {
    parts.push(`Visual style preset (${style.label || style.id}): ${style.suffix}`);
  }

  for (const section of ARTISTIC_EFFECT_SECTIONS) {
    const value = effects[section.id];
    if (section.type === "radio" && value) {
      const opt = section.options.find((o) => o.id === value);
      if (opt?.prompt) parts.push(opt.prompt);
    }
    if (section.type === "checkbox" && value && typeof value === "object") {
      for (const opt of section.options) {
        if (value[opt.id] && opt.prompt) parts.push(opt.prompt);
      }
    }
  }

  parts.push(
    "Ultra high quality, professional art direction, cohesive visual recipe, 8K detail where applicable.",
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
