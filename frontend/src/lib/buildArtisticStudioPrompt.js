import {
  ARTISTIC_STUDIO_STYLES,
  ARTISTIC_EFFECT_SECTIONS,
} from "./artisticStudioData";
import {
  isStylizedArtCategory,
  resolveArtisticStyleSuffix,
} from "./artisticStyleSuffixes";

export function getStyleById(styleId) {
  return ARTISTIC_STUDIO_STYLES.find((s) => s.id === styleId) || null;
}

const PHOTO_IDENTITY =
  "Edit the reference photo. Keep the exact same person: same face, bone structure, skin tone, apparent age, expression, hair, and body. "
  + "Do not make them look older, younger, or like a different person.";

const STYLIZE_FROM_PHOTO =
  "Fully convert the entire image into the art style below—not a subtle photo filter or light retouch. "
  + "The result must clearly look like the chosen medium (anime, cartoon, painting, etc.) "
  + "while keeping the same recognizable person, face, and apparent age.";

const TEXT_SCENE =
  "Generate a single coherent image in the visual style below. Match the medium and aesthetics exactly.";

export function buildArtisticStudioPrompt({
  userPrompt = "",
  styleId = null,
  effects = {},
  imageMode = false,
}) {
  const trimmed = String(userPrompt || "").trim();
  const style = getStyleById(styleId);
  const styleSuffix = resolveArtisticStyleSuffix(style);

  const parts = [];

  if (imageMode) {
    parts.push(
      isStylizedArtCategory(style?.cat) ? STYLIZE_FROM_PHOTO : PHOTO_IDENTITY,
    );
  } else {
    parts.push(TEXT_SCENE);
  }

  if (trimmed) parts.push(trimmed);

  if (styleSuffix) {
    parts.push(`Style: ${styleSuffix}`);
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
