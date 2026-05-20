/** Espelha a lógica do backend (poster_templates.py) para o editor Vercel. */

export const POSTER_DIRECTOR = (
  "Professional design poster, 8K resolution, magazine print quality, "
  + "perfectly legible typography rendered as crisp vector-like text, "
  + "strong typographic hierarchy with clear primary/secondary/tertiary text levels, "
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

export const MOOD_EXPANSIONS = {
  cinematic:
    "Cinematic teal-and-orange color grading, anamorphic shallow depth of field, dramatic backlit subject, atmospheric haze, film grain, 2.39:1 widescreen feel.",
  neon:
    "Saturated neon magenta and electric cyan, glossy reflections, dark mirror floor, dramatic rim light, cyberpunk aesthetic, halated glow on type.",
  minimal:
    "Minimalist Swiss-grid design, ample negative space, single accent color, refined sans-serif type, no ornaments, gallery-quality restraint.",
  vintage:
    "Vintage analog feel — soft halation, mild paper bleed, off-set CMYK misregistration, faded sun-warmed palette, retro 70s typography.",
  bold:
    "Bold high-contrast layout, oversized condensed display type, primary-color blocks, strong diagonal composition, attention-grabbing.",
  luxury:
    "Luxury editorial aesthetic — embossed gold foil accents, deep matte black, refined didone serif, monogram-level restraint, Hermès / Chanel level taste.",
  editorial:
    "Editorial magazine layout — modular grid, mixed serif headline + sans body, considered hierarchy, Vogue / The New Yorker quality.",
  brutalist:
    "Brutalist graphic design — raw typographic stacks, exposed grid, harsh contrast, oversized helvetica, off-balance composition, 90s anti-design.",
  pastel:
    "Pastel palette of dusty rose, butter, lavender and seafoam, soft diffuse light, fine rounded sans-serif, dreamy and gentle.",
  y2k:
    "Y2K aesthetic — chrome 3D type, candy color gradients, lens flares, bubbly forms, early-2000s tech-glam revival.",
  mono:
    "Strict monochrome palette in a single hue, photographic duotone treatment, refined museum-poster feel.",
  sun_warm:
    "Sun-warmed palette of amber, terracotta and ochre, golden-hour light, gentle film grain, optimistic mood.",
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

/**
 * Constrói o prompt final do pôster (template + campos + blocos + mood).
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
    const v = String(values[key] || "").trim();
    if (!v || template.replacements?.[key]) continue;
    if (raw.includes(key)) raw = raw.split(key).join(v);
  }

  const blocksPart = formatCustomBlocks(options.customBlocks);
  if (blocksPart) raw = `${raw}\n\n${blocksPart}`;

  const extras = [];
  const mood = String(options.mood || "").trim();
  if (mood) {
    extras.push(MOOD_EXPANSIONS[mood] || `Visual mood: ${mood}.`);
  }
  const colorHint = String(options.colorHint || "").trim();
  if (colorHint) {
    extras.push(
      `Anchor the dominant color palette around ${colorHint} — use it as the primary `
      + "accent hue across backgrounds, typographic highlights and graphic blocks.",
    );
  }

  let out = POSTER_DIRECTOR + raw;
  if (extras.length) out = `${out} ${extras.join(" ")}`;
  return out;
}
