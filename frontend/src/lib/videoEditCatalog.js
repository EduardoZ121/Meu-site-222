/**
 * Unified video-to-video catalog — modes + templates (OpenArt SwitchX layout).
 */

export const VIDEO_EDIT_MODES = [
  {
    id: "background",
    preset: "background",
    nameKey: "vid_mode_background",
    descKey: "vid_mode_background_desc",
    icon: "image",
  },
  {
    id: "relight",
    preset: "relight",
    nameKey: "vid_mode_relight",
    descKey: "vid_mode_relight_desc",
    icon: "sun",
  },
  {
    id: "vfx",
    preset: "vfx",
    nameKey: "vid_mode_vfx",
    descKey: "vid_mode_vfx_desc",
    icon: "sparkles",
  },
  {
    id: "outfit",
    preset: "outfit",
    nameKey: "vid_mode_outfit",
    descKey: "vid_mode_outfit_desc",
    icon: "shirt",
  },
  {
    id: "restyle",
    preset: "restyle",
    nameKey: "vid_mode_restyle",
    descKey: "vid_mode_restyle_desc",
    icon: "palette",
  },
];

const tpl = (id, nameKey, prompt, gradient, accent) => ({
  id,
  nameKey,
  prompt,
  gradient,
  accent,
});

export const VIDEO_EDIT_TEMPLATES = {
  background: [
    tpl(
      "bg-studio",
      "vid_tpl_bg_studio",
      "Modern minimalist white photography studio with soft diffused lighting and clean floor.",
      "from-neutral-200 via-neutral-100 to-white",
      "#e5e5e5",
    ),
    tpl(
      "bg-beach",
      "vid_tpl_bg_beach",
      "Tropical beach at golden hour, turquoise ocean, warm sunset sky, soft sand.",
      "from-orange-400 via-amber-300 to-cyan-400",
      "#fcd34d",
    ),
    tpl(
      "bg-snow",
      "vid_tpl_bg_snow",
      "Snowy city street at night with soft bokeh lights and gentle falling snow.",
      "from-slate-800 via-blue-950 to-indigo-900",
      "#93c5fd",
    ),
    tpl(
      "bg-forest",
      "vid_tpl_bg_forest",
      "Lush green forest with dappled sunlight filtering through trees, natural depth.",
      "from-green-900 via-emerald-800 to-lime-900",
      "#4ade80",
    ),
    tpl(
      "bg-cyber",
      "vid_tpl_bg_cyber",
      "Neon cyberpunk alley at night, wet pavement reflections, magenta and cyan signs.",
      "from-fuchsia-950 via-purple-950 to-cyan-950",
      "#22d3ee",
    ),
    tpl(
      "bg-space",
      "vid_tpl_bg_space",
      "Deep space nebula background with stars and cosmic purple-blue gas clouds.",
      "from-indigo-950 via-violet-950 to-black",
      "#818cf8",
    ),
  ],
  relight: [
    tpl(
      "relight-golden",
      "vid_vfx_relight_golden",
      "Relight the scene to warm golden hour sunlight: soft orange rim light, long shadows, cinematic sunset glow on skin. Same composition, pose and motion — lighting change only.",
      "from-amber-900 via-orange-800 to-yellow-900",
      "#fdba74",
    ),
    tpl(
      "relight-neon",
      "vid_vfx_relight_neon",
      "Relight to neon cyberpunk night: magenta and cyan edge lights, wet reflective surfaces, urban night atmosphere. Same subject, pose and motion — lighting and color grade only.",
      "from-fuchsia-950 via-purple-950 to-cyan-950",
      "#22d3ee",
    ),
    tpl(
      "relight-studio",
      "vid_vfx_relight_studio",
      "Relight to professional studio softbox lighting: clean key light, subtle fill, beauty commercial look, even skin tones. Same composition and motion — lighting only.",
      "from-neutral-800 via-zinc-700 to-neutral-900",
      "#e5e5e5",
    ),
    tpl(
      "relight-noir",
      "vid_tpl_relight_noir",
      "Film noir relight: high-contrast chiaroscuro, deep shadows, single hard key light, moody black and white with subtle warm accents.",
      "from-neutral-950 via-zinc-900 to-black",
      "#a3a3a3",
    ),
    tpl(
      "relight-moon",
      "vid_tpl_relight_moon",
      "Cool blue moonlight relight: soft lunar glow, silvery highlights, night atmosphere, gentle rim light on the subject.",
      "from-slate-950 via-blue-950 to-indigo-950",
      "#60a5fa",
    ),
  ],
  vfx: [
    tpl(
      "medusa",
      "vid_vfx_medusa",
      "Cinematic Medusa SFX makeup transformation: living serpent hair writhing naturally, pale stone-like skin texture, golden reptilian eyes, ancient Greek goddess horror-beauty. Photorealistic VFX, temporally stable on face and hair in every frame.",
      "from-emerald-950 via-stone-900 to-emerald-800",
      "#34d399",
    ),
    tpl(
      "knight-dj",
      "vid_vfx_knight_dj",
      "Transform into a medieval knight DJ: polished plate armor with modern DJ headphones, mixing at a festival stage, epic anachronistic party energy. Same person, same pose and motion from the source clip.",
      "from-slate-900 via-zinc-800 to-amber-950",
      "#fbbf24",
    ),
    tpl(
      "mecha",
      "vid_vfx_mecha",
      "Mecha robot transformation VFX: metallic armor panels assemble across the body, glowing energy cores, sci-fi exoskeleton emerging through clothing. Cinematic sparks, light trails, Iron Man-style transformation, temporally smooth.",
      "from-slate-950 via-indigo-950 to-cyan-900",
      "#22d3ee",
    ),
    tpl(
      "hellfire-vehicle",
      "vid_vfx_hellfire",
      "Hellfire vehicle VFX: wheels and exhaust burst into supernatural orange flames, demonic fire trails, dark cinematic atmosphere, heat distortion and ember particles. High-speed action look; if no vehicle, apply fiery energy aura to the main subject.",
      "from-black via-orange-950 to-red-900",
      "#f97316",
    ),
    tpl(
      "pineapple",
      "vid_vfx_pineapple",
      "Surreal macro VFX: camera travels inside a golden pineapple juice world, liquid fruit pulp textures, tropical advertising look, vibrant yellow-orange tones, immersive beverage tunnel perspective with glossy fluid motion.",
      "from-yellow-700 via-amber-600 to-orange-800",
      "#fde047",
    ),
    tpl(
      "jewel-horse",
      "vid_vfx_jewel",
      "Jewel crystal transformation VFX: body and clothing refract like cut gemstones, ruby sapphire and emerald facets, magical sparkle particles, luxury fantasy shine. Preserve human silhouette while surfaces become crystalline and luminous.",
      "from-violet-950 via-fuchsia-900 to-pink-800",
      "#e879f9",
    ),
    tpl(
      "ryu",
      "vid_vfx_ryu",
      "Street Fighter Ryu fighter transformation: white karate gi, red headband, muscular fighter look, subtle blue energy aura, anime-realistic hybrid VFX. Same pose and motion timing as the source video.",
      "from-neutral-900 via-stone-800 to-red-950",
      "#ef4444",
    ),
    tpl(
      "iceman",
      "vid_vfx_iceman",
      "Iceman frozen transformation VFX: skin and outfit freeze into crystalline blue-white ice, frost breath, ice shards forming on the body, cold mist particles, frozen superhero aesthetic.",
      "from-sky-950 via-cyan-900 to-blue-950",
      "#67e8f9",
    ),
    tpl(
      "fire-man",
      "vid_vfx_fireman",
      "Fire Man VFX: body wrapped in controlled supernatural flames, floating embers, heat distortion waves, superhero fire aesthetic. Flames follow motion naturally; background stays mostly unchanged unless lit by the fire glow.",
      "from-orange-950 via-red-900 to-black",
      "#fb923c",
    ),
    tpl(
      "gold-coins",
      "vid_vfx_gold_coins",
      "Gushing gold coins VFX: torrents of golden coins pour and swirl around the subject, treasure explosion, casino jackpot moment, metallic gleam with motion blur and sparkles.",
      "from-yellow-900 via-amber-800 to-yellow-950",
      "#fcd34d",
    ),
  ],
  outfit: [
    tpl(
      "outfit-black-dress",
      "vid_tpl_outfit_dress",
      "Change to an elegant black evening dress with subtle shimmer, keep exact pose and motion.",
      "from-neutral-950 via-zinc-900 to-black",
      "#d4d4d4",
    ),
    tpl(
      "outfit-denim",
      "vid_tpl_outfit_denim",
      "Swap to a casual denim jacket and white t-shirt, relaxed street style, same pose.",
      "from-blue-900 via-indigo-900 to-slate-800",
      "#60a5fa",
    ),
    tpl(
      "outfit-red-suit",
      "vid_tpl_outfit_suit",
      "Replace with a sharp red power suit, professional confident look, same pose and motion.",
      "from-red-950 via-rose-900 to-neutral-900",
      "#f87171",
    ),
    tpl(
      "changing-suits",
      "vid_vfx_changing_suits",
      "Rapid outfit morph VFX: clothing seamlessly transitions between multiple stylish outfits in sequence — suits, dresses, streetwear. Fashion runway magic. Same person, face, body proportions, pose and motion throughout.",
      "from-zinc-900 via-neutral-800 to-violet-950",
      "#a78bfa",
    ),
    tpl(
      "hair-color",
      "vid_vfx_hair_color",
      "Change hair color only with smooth VFX color grade: vibrant new hair hue with natural shine and strand detail. Face, skin, body, clothing, background and motion stay identical.",
      "from-purple-950 via-violet-900 to-fuchsia-900",
      "#c084fc",
    ),
  ],
  restyle: [
    tpl(
      "restyle-cinematic",
      "vid_tpl_restyle_cine",
      "Cinematic film grain, teal and orange color grade, anamorphic lens flare, Hollywood blockbuster look.",
      "from-teal-950 via-slate-900 to-orange-950",
      "#2dd4bf",
    ),
    tpl(
      "restyle-anime",
      "vid_tpl_restyle_anime",
      "Anime cel-shaded style with vibrant colors, clean outlines, Studio Ghibli-inspired warmth.",
      "from-sky-400 via-pink-300 to-violet-400",
      "#f472b6",
    ),
    tpl(
      "restyle-oil",
      "vid_tpl_restyle_oil",
      "Oil painting aesthetic with visible brush strokes, impressionist texture, museum art quality.",
      "from-amber-800 via-orange-900 to-yellow-950",
      "#fbbf24",
    ),
    tpl(
      "restyle-8mm",
      "vid_tpl_restyle_8mm",
      "Vintage 8mm home movie look: warm faded colors, light leaks, soft vignette, nostalgic grain.",
      "from-amber-950 via-orange-950 to-yellow-900",
      "#fcd34d",
    ),
    tpl(
      "restyle-comic",
      "vid_tpl_restyle_comic",
      "Comic book halftone style with bold ink lines, pop-art colors, Ben-Day dots texture.",
      "from-red-600 via-yellow-500 to-blue-600",
      "#fef08a",
    ),
  ],
};

export function findVideoEditMode(id) {
  return VIDEO_EDIT_MODES.find((m) => m.id === id) || VIDEO_EDIT_MODES[2];
}

export function templatesForMode(modeId) {
  return VIDEO_EDIT_TEMPLATES[modeId] || [];
}

export function isValidEditMode(id) {
  return VIDEO_EDIT_MODES.some((m) => m.id === id);
}

/** Legacy route ids → unified mode id (query param on /app/video/edit) */
export const LEGACY_EDIT_MODE_MAP = {
  "change-bg": "background",
  "change-outfit": "outfit",
  restyle: "restyle",
  vfx: "vfx",
};

export function resolveEditMode(raw) {
  const key = String(raw || "").trim().toLowerCase();
  if (isValidEditMode(key)) return key;
  if (LEGACY_EDIT_MODE_MAP[key]) return LEGACY_EDIT_MODE_MAP[key];
  return "vfx";
}

const V2V_COVER_VERSION = "2";

/** Capa JPG 4:3 para card de template (gerada por generate-v2v-template-covers.mjs). */
export function getV2vTemplateCover(id) {
  return `/images/tools/video/v2v/${id}.jpg?v=${V2V_COVER_VERSION}`;
}
