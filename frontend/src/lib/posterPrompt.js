/** Espelha a lógica do backend (poster_templates.py) para o editor Vercel. */

export const POSTER_DIRECTOR = (
  "Professional design poster, 8K resolution, magazine print quality, "
  + "perfectly legible typography rendered as crisp vector-like text with sharp edges, "
  + "strong typographic hierarchy with clear primary/secondary/tertiary text levels, "
  + "every word spelled exactly as given in the brief (no gibberish, no random letters), "
  + "high contrast between text and background for readability, "
  + "balanced composition with intentional negative space, "
  + "premium graphic design, art-directed by a senior creative director. "
);

export const POSTER_TYPOGRAPHY_GUARD = (
  "TYPOGRAPHY (mandatory): render every headline, subhead, CTA, date and label razor-sharp, "
  + "perfectly spelled character-by-character as written in the brief, high contrast, "
  + "no blurry, melted, warped, duplicated or invented letters; crisp vector-like type edges."
);

export const TEMPLATE_COLOR_GUARD = (
  "COLOR (template default): keep the exact color palette, lighting mood and typography colors "
  + "described in the template brief above. Do not invent a new color scheme or random recolor."
);

/** Stable mood ids — labels come from i18n (`post_mood_*`). */
export const POSTER_MOOD_IDS = [
  "cinematic",
  "neon",
  "minimal",
  "vintage",
  "bold",
  "luxury",
  "editorial",
  "brutalist",
  "pastel",
  "y2k",
  "mono",
  "sun_warm",
];

/**
 * Mood presets — alteram atmosfera/grading sem substituir a paleta do template,
 * exceto quando o utilizador define paleta personalizada (aí só lighting/texture).
 */
export const MOOD_EXPANSIONS = {
  cinematic:
    "MOOD — Cinematic: filmic contrast, gentle grain, depth and directional lighting. "
    + "Enhance drama through light and shadow, not by inventing new brand colors.",
  neon:
    "MOOD — Neon nightlife: controlled glow, rim light and light beams on existing elements. "
    + "Keep headline and background color roles from the template; add glow, do not flood the frame with random neon.",
  minimal:
    "MOOD — Minimal: more negative space, cleaner shapes, restrained decoration. "
    + "Same template hues; simplify clutter only.",
  vintage:
    "MOOD — Vintage print: soft halation, mild paper texture, nostalgic fade on edges. "
    + "Template color story stays; gentle age the finish only.",
  bold:
    "MOOD — Bold: stronger hierarchy and contrast on type blocks and graphics. "
    + "Do not swap the template palette — amplify impact within it.",
  luxury:
    "MOOD — Luxury: refined finish, subtle foil sheen on accents, premium spacing. "
    + "Template colors remain; elevate polish only.",
  editorial:
    "MOOD — Editorial magazine: crisp grid, refined type spacing, fashion-print polish. "
    + "Preserve template color assignments.",
  brutalist:
    "MOOD — Brutalist: raw typographic weight and hard edges on layout blocks. "
    + "Keep template color blocks; emphasize structure, not new hues.",
  pastel:
    "MOOD — Pastel soft light: diffuse highlights and gentler shadows. "
    + "Only soften intensity; do not replace bold template colors with unrelated pastels.",
  y2k:
    "MOOD — Y2K: light chrome highlights on type edges and UI accents. "
    + "Template palette stays primary.",
  mono:
    "MOOD — Mono: cohesive duotone using the template's dominant hue plus neutrals. "
    + "Do not introduce unrelated accent colors.",
  sun_warm:
    "MOOD — Sun-warm: golden-hour warmth on lighting and skin tones. "
    + "Template text and graphic color assignments stay readable and on-brief.",
};

const SIZE_HINTS = {
  small: "small supporting text, subtle weight",
  medium: "medium body text, clear readability",
  large: "large headline-level type, high impact",
  hero: "hero display typography, dominant focal point, oversized",
};

const POSITION_HINTS = {
  "top-left": "positioned top-left of the layout",
  "top-center": "positioned top-center, spanning the upper third",
  "top-right": "positioned top-right of the layout",
  center: "centered in the composition as a focal anchor",
  "bottom-left": "positioned bottom-left",
  "bottom-center": "positioned bottom-center in the lower third",
  "bottom-right": "positioned bottom-right",
};

const STYLE_HINTS = {
  sans: "clean modern sans-serif",
  serif: "elegant editorial serif",
  display: "bold condensed display face",
  script: "stylish script accent (use sparingly)",
};

export const POSTER_IDENTITY_GUARD = (
  "CRITICAL — Preserve the reference person's exact face, facial structure, skin tone, "
  + "body shape, proportions and pose fidelity. Do not change identity, age, or ethnicity. "
  + "Only adapt outfit, lighting and poster styling as the template describes."
);

export const POSTER_FOOD_GUARD = (
  "Preserve the reference dish exactly — same food identity, textures, colors and plating. "
  + "Do not replace with a different meal."
);

/** Campo satisfeito: valor do user, opcional, replacement ou texto já no prompt do template. */
export function posterFieldSatisfied(template, values, fieldKey) {
  if ((template?.optional || []).includes(fieldKey)) return true;
  if (String(values?.[fieldKey] || "").trim()) return true;
  const rep = (template?.replacements || {})[fieldKey];
  if (rep && String(rep).trim()) return true;
  const prompt = String(template?.prompt || "");
  if (fieldKey && prompt.includes(fieldKey)) return true;
  return false;
}

export function posterMissingFields(template, values = {}) {
  if (!template?.placeholders?.length) return [];
  return template.placeholders.filter((p) => !posterFieldSatisfied(template, values, p));
}

export function posterInitialValues(template) {
  const initial = {};
  for (const p of template?.placeholders || []) {
    const rep = (template.replacements || {})[p];
    if (rep && String(rep).trim()) initial[p] = String(rep).trim();
  }
  return initial;
}

export function isPosterFoodTemplate(template) {
  const cat = String(template?.category || "").toLowerCase();
  if (cat === "food") return true;
  const id = String(template?.id || "").toLowerCase();
  return id.startsWith("food_");
}

/** Com foto: todos os templates não-comida preservam rosto/corpo. */
export function posterNeedsIdentityGuard(template, hasPhoto) {
  if (!hasPhoto) return false;
  return !isPosterFoodTemplate(template);
}

export function templateUsesPersonReference(template) {
  return posterNeedsIdentityGuard(template, true)
    || (!isPosterFoodTemplate(template) && String(template?.prompt || "").toLowerCase().includes("reference image"));
}

export function newCustomTextBlock(partial = {}) {
  return {
    id: partial.id || `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: partial.title || "Título",
    text: partial.text || "",
    color: partial.color || "",
    position: partial.position || "top-center",
    size: partial.size || "large",
    style: partial.style || "display",
  };
}

export function formatCustomBlocks(blocks = []) {
  const active = (blocks || []).filter((b) => (b.text || "").trim());
  if (!active.length) return "";

  const lines = active.map((b, i) => {
    const title = (b.title || `Camada ${i + 1}`).trim();
    const text = b.text.trim();
    const pos = POSITION_HINTS[b.position] || b.position;
    const size = SIZE_HINTS[b.size] || SIZE_HINTS.medium;
    const style = STYLE_HINTS[b.style] || STYLE_HINTS.sans;
    const color = b.color?.trim()
      ? ` Render this text in color ${b.color.trim()} (exact hex tone for ink/UI).`
      : "";
    return (
      `${i + 1}. Layer "${title}": "${text}" — ${size}, ${style}, ${pos}.${color}`
    );
  });

  return (
    "Additional custom typography layers (mandatory — render all legibly in the final poster):\n"
    + `${lines.join("\n")}\n`
    + "Integrate these layers into the hierarchy without overlapping faces; respect positions and colors."
  );
}

function formatPaletteOverride(colors = []) {
  const list = (colors || []).map((c) => String(c || "").trim()).filter(Boolean);
  if (!list.length) return "";

  const joined = list.join(", ");
  return (
    "USER CUSTOM PALETTE (highest priority — mandatory): "
    + `Use ONLY these colors for the entire poster: ${joined}. `
    + "Apply them to background fills, graphic shapes, accents, gradients and typographic highlights. "
    + "DISREGARD any specific color names or hex instructions in the template brief above "
    + "(e.g. 'neon purple', 'red background', 'gold typography') — those describe layout roles only, not hues. "
    + "Map each role (background, headline, accent, CTA) to the closest swatch from this user palette. "
    + "Keep layout, hierarchy, subjects and all quoted text unchanged."
  );
}

function formatMoodExtra(moodId, { hasCustomPalette = false } = {}) {
  const id = String(moodId || "").trim();
  if (!id) return "";

  const base = MOOD_EXPANSIONS[id]
    || `MOOD — ${id}: adjust atmosphere and lighting only.`;

  if (hasCustomPalette) {
    return (
      `${base} Apply this mood through lighting, texture, grain and composition only — `
      + "all color must come from USER CUSTOM PALETTE below, not from the template brief."
    );
  }

  return (
    `${base} When no custom palette is set, keep the template's specified color roles for `
    + "background, typography and brand blocks; change atmosphere, not the color story."
  );
}

/**
 * Constrói o prompt final do pôster (template + campos + blocos + mood/paleta opcionais).
 * @param {object} options
 * @param {string} [options.mood] — vazio = cores/mood do template
 * @param {string[]} [options.paletteColors] — vazio = paleta do template
 * @param {boolean} [options.hasPhoto]
 */
export function buildPosterPrompt(template, values = {}, options = {}) {
  if (!template?.prompt) {
    return `${POSTER_DIRECTOR}Professional premium poster design.\n\n${POSTER_TYPOGRAPHY_GUARD}`;
  }

  let raw = template.prompt;

  for (const [field, original] of Object.entries(template.replacements || {})) {
    const userValue = String(values[field] || "").trim();
    if (userValue && original) {
      raw = raw.split(original).join(userValue);
    }
  }

  const appendsField = template.appends;
  if (appendsField) {
    const appended = String(values[appendsField] || "").trim();
    if (appended) raw = `${raw} ${appended}`;
  }

  if (raw.includes("{") && raw.includes("}")) {
    const fmt = {};
    for (const k of template.placeholders || []) {
      fmt[k] = String(values[k] || "").trim();
    }
    raw = raw.replace(/\{([^}]+)\}/g, (_, key) => fmt[key.trim()] ?? "");
  }

  for (const key of template.placeholders || []) {
    const v = String(values[k] || "").trim();
    if (!v || template.replacements?.[key]) continue;
    if (raw.includes(key)) raw = raw.split(key).join(v);
  }

  const blocksPart = formatCustomBlocks(options.customBlocks);
  if (blocksPart) raw = `${raw}\n\n${blocksPart}`;

  const palettePart = formatPaletteOverride(options.paletteColors);
  const hasCustomPalette = Boolean(palettePart);
  const moodPart = formatMoodExtra(options.mood, { hasCustomPalette });

  const extras = [];

  if (!hasCustomPalette && !moodPart) {
    extras.push(TEMPLATE_COLOR_GUARD);
  }

  if (moodPart) extras.push(moodPart);
  if (palettePart) extras.push(palettePart);

  extras.push(POSTER_TYPOGRAPHY_GUARD);

  let out = `${POSTER_DIRECTOR}${raw}`;
  if (extras.length) out = `${out}\n\n${extras.join("\n\n")}`;

  const hasPhoto = Boolean(options.hasPhoto);
  if (hasPhoto && isPosterFoodTemplate(template)) {
    out = `${out}\n\n${POSTER_FOOD_GUARD}`;
  } else if (posterNeedsIdentityGuard(template, hasPhoto)) {
    out = `${out}\n\n${POSTER_IDENTITY_GUARD}`;
  }

  return out;
}
