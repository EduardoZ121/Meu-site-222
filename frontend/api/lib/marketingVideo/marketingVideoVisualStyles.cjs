/**
 * Hidden visual style modifiers — never shown as raw prompts in UI.
 * Combined with category storyboard prompts at generation time.
 */

const VISUAL_STYLES = {
  cinematic_luxury: {
    id: "cinematic_luxury",
    labelPt: "Cinema Luxury",
    labelEn: "Cinematic Luxury",
    prompt:
      "Ultra-premium luxury commercial aesthetic: rich blacks, gold rim light, slow elegant camera, "
      + "volumetric haze, high-end fragrance-ad energy, flawless product hero moments!",
  },
  dark_moody: {
    id: "dark_moody",
    labelPt: "Dark & Moody",
    labelEn: "Dark & Moody",
    prompt:
      "Dark moody cinematic atmosphere: deep shadows, single key light, smoke and contrast, "
      + "mysterious premium tone, dramatic chiaroscuro product reveals!",
  },
  neon_urban: {
    id: "neon_urban",
    labelPt: "Neon Urbano",
    labelEn: "Neon Urban",
    prompt:
      "Neon urban night aesthetic: vibrant color gels, wet reflections, cyber-city bokeh, "
      + "high-energy youth brand energy, punchy saturated highlights!",
  },
  minimal_clean: {
    id: "minimal_clean",
    labelPt: "Minimal Clean",
    labelEn: "Minimal Clean",
    prompt:
      "Minimal clean studio aesthetic: soft white cyclorama, precise shadows, Apple-level product clarity, "
      + "breathing room, refined slow camera, premium simplicity!",
  },
  golden_hour: {
    id: "golden_hour",
    labelPt: "Golden Hour",
    labelEn: "Golden Hour",
    prompt:
      "Warm golden-hour lifestyle aesthetic: sun flares, natural warmth, soft lens bloom, "
      + "aspirational outdoor glow, emotional premium storytelling!",
  },
  high_fashion: {
    id: "high_fashion",
    labelPt: "Alta Moda",
    labelEn: "High Fashion",
    prompt:
      "High-fashion editorial film: bold poses, wind machine, Vogue-level styling, "
      + "striking angles, couture runway energy, magazine-cover impact!",
  },
  tech_futuristic: {
    id: "tech_futuristic",
    labelPt: "Tech Futurista",
    labelEn: "Tech Futuristic",
    prompt:
      "Futuristic tech launch aesthetic: holographic accents, sleek motion graphics feel, "
      + "precision macro on materials, sci-fi product reveal, cutting-edge innovation vibe!",
  },
  organic_natural: {
    id: "organic_natural",
    labelPt: "Orgânico Natural",
    labelEn: "Organic Natural",
    prompt:
      "Organic natural wellness aesthetic: earthy tones, soft daylight, botanical textures, "
      + "authentic handcrafted feel, calm premium sustainability story!",
  },
  retro_vintage: {
    id: "retro_vintage",
    labelPt: "Retro Vintage",
    labelEn: "Retro Vintage",
    prompt:
      "Retro vintage film aesthetic: grain texture, warm analog color grade, nostalgic 70s-90s ad rhythm, "
      + "classic storytelling charm with modern polish!",
  },
  sports_energy: {
    id: "sports_energy",
    labelPt: "Sports Energy",
    labelEn: "Sports Energy",
    prompt:
      "High-octane sports commercial: dynamic handheld, impact dust, slow-motion hero beats, "
      + "adrenaline soundtrack sync, powerful athletic energy!",
  },
  asmr_tactile: {
    id: "asmr_tactile",
    labelPt: "ASMR Tátil",
    labelEn: "ASMR Tactile",
    prompt:
      "ASMR tactile macro aesthetic: extreme close-ups, satisfying textures, liquid pour and fizz detail, "
      + "crisp sound-design moments, sensory product obsession!",
  },
  epic_blockbuster: {
    id: "epic_blockbuster",
    labelPt: "Epic Blockbuster",
    labelEn: "Epic Blockbuster",
    prompt:
      "Epic blockbuster trailer aesthetic: massive scale, lens flares, orchestral rise, "
      + "heroic slow-motion, IMAX-level grandeur for the product!",
  },
  soft_pastel: {
    id: "soft_pastel",
    labelPt: "Pastel Suave",
    labelEn: "Soft Pastel",
    prompt:
      "Soft pastel beauty aesthetic: dreamy diffusion, gentle pinks and lavenders, "
      + "K-beauty glow, delicate feminine premium tone!",
  },
  industrial_raw: {
    id: "industrial_raw",
    labelPt: "Industrial Raw",
    labelEn: "Industrial Raw",
    prompt:
      "Industrial raw aesthetic: concrete textures, hard light, mechanical precision, "
      + "authentic workshop grit meets premium craft!",
  },
  holiday_magic: {
    id: "holiday_magic",
    labelPt: "Holiday Magic",
    labelEn: "Holiday Magic",
    prompt:
      "Holiday magic seasonal aesthetic: warm twinkle lights, festive bokeh, gift-unwrapping energy, "
      + "cozy premium celebration mood!",
  },
};

const STYLE_IDS = Object.keys(VISUAL_STYLES);

function listVisualStyles(lang = "pt") {
  const l = String(lang || "pt").slice(0, 2).toLowerCase();
  return STYLE_IDS.map((id) => {
    const s = VISUAL_STYLES[id];
    return { id, label: l === "en" ? s.labelEn : s.labelPt };
  });
}

function pickRandomStyleId() {
  const pool = STYLE_IDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function resolveVisualStyle(styleId) {
  const key = String(styleId || "").trim();
  if (!key || key === "auto") return { id: "auto", prompt: "" };
  if (key === "random") {
    const picked = pickRandomStyleId();
    return { id: picked, prompt: VISUAL_STYLES[picked].prompt, random: true };
  }
  const hit = VISUAL_STYLES[key];
  if (!hit) return { id: "auto", prompt: "" };
  return { id: hit.id, prompt: hit.prompt };
}

function isValidVisualStyleId(id) {
  return !id || id === "auto" || id === "random" || STYLE_IDS.includes(String(id));
}

module.exports = {
  VISUAL_STYLES,
  STYLE_IDS,
  listVisualStyles,
  pickRandomStyleId,
  resolveVisualStyle,
  isValidVisualStyleId,
};
