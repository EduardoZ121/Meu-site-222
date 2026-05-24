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
 * Mood presets — reforço leve; não substituem a paleta do template
 * (a menos que o utilizador defina cores personalizadas).
 */
export const MOOD_EXPANSIONS = {
  cinematic:
    "Subtle cinematic atmosphere: gentle contrast and depth, mild film grain. "
    + "Keep the template color palette and typography colors unchanged unless a custom user palette is specified.",
  neon:
    "Subtle neon nightlife accent on rims and highlights only — do not flood the whole poster with new colors. "
    + "Preserve template-specified background and text colors unless overridden by custom palette.",
  minimal:
    "Cleaner negative space and restrained ornament — keep original template hues and type colors.",
  vintage:
    "Soft vintage print texture and mild halation — preserve the template color story, only gentle fade.",
  bold:
    "Slightly stronger contrast and hierarchy — do not replace template palette or rewrite layout colors.",
  luxury:
    "Refined luxury finish (subtle foil sheen on accents only) — keep template palette and legible type.",
  editorial:
    "Magazine editorial polish on spacing and type hierarchy — colors stay as in the template brief.",
  brutalist:
    "Raw typographic emphasis — keep template color blocks; no random color shifts.",
  pastel:
    "Softer diffuse light — only if compatible with template; do not wash out specified bold colors.",
  y2k:
    "Light Y2K chrome accent on type edges only — template palette remains primary.",
  mono:
    "Duotone treatment using template's dominant hue — do not invent unrelated colors.",
  sun_warm:
    "Warm golden-hour lift on lighting only — template color assignments for text/background stay.",
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
  + "body shape and proportions. Do not change identity, age, or ethnicity. "
  + "Only adapt pose, outfit, lighting and poster styling as the template describes."
);

export const POSTER_FOOD_GUARD = (
  "Preserve the reference dish exactly — same food identity, textures, colors and plating. "
  + "Do not replace with a different meal."
);

export function isPosterFoodTemplate(template) {
  return String(template?.category || "").toLowerCase() === "food";
}

export function templateUsesPersonReference(template) {
  if (isPosterFoodTemplate(template)) return false;
  const p = String(template?.prompt || "").toLowerCase();
  return (
    p.includes("reference image as the identity")
    || p.includes("provided reference image")
    || p.includes("preserve identity")
    || p.includes("replace face and hair")
  );
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
    "USER CUSTOM PALETTE (mandatory override): "
    + `Replace the template's default color scheme with ONLY these colors: ${joined}. `
    + "Apply them to backgrounds, graphic blocks, accents and typographic highlights. "
    + "Ignore conflicting color instructions from the template brief (e.g. 'red background', 'neon purple') "
    + "and reinterpret the design using this palette while keeping layout, typography hierarchy and subject."
  );
}

function formatMoodExtra(moodId) {
  const id = String(moodId || "").trim();
  if (!id) return "";
  return MOOD_EXPANSIONS[id] || `Subtle visual mood (${id}) — preserve template colors unless custom palette is set.`;
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
    return POSTER_DIRECTOR + "Professional premium poster design.";
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
  const moodPart = formatMoodExtra(options.mood);

  const extras = [];
  if (palettePart) extras.push(palettePart);
  if (moodPart) extras.push(moodPart);

  if (!palettePart && !moodPart) {
    extras.push(
      "Keep the exact color palette, lighting mood and typography colors described in the template brief above. "
      + "Do not invent a new color scheme.",
    );
  }

  extras.push(
    "Typography: render every headline, subhead, CTA and label razor-sharp, perfectly spelled, "
    + "high contrast, no blurry or melted letters.",
  );

  let out = POSTER_DIRECTOR + raw;
  if (extras.length) out = `${out}\n\n${extras.join("\n")}`;

  const hasPhoto = Boolean(options.hasPhoto);
  if (hasPhoto && isPosterFoodTemplate(template)) {
    out = `${out}\n\n${POSTER_FOOD_GUARD}`;
  } else if (hasPhoto && templateUsesPersonReference(template)) {
    out = `${out}\n\n${POSTER_IDENTITY_GUARD}`;
  }

  return out;
}
