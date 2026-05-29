/**
 * Prompts ocultos NOVOS do Estúdio Artístico (v2).
 * Os sufixos antigos em artisticStudioData foram desactivados — usa só este ficheiro.
 *
 * Regra com foto: estilo afecta fundo, luz, cor, roupa, ambiente — NUNCA rosto, idade ou ossos.
 */

const EDIT_BY_CAT = {
  photography: (name) =>
    `${name}: professional photo grade — adjust lighting, contrast, lens blur and color on the scene only`,
  anime_manga: (name) =>
    `${name} atmosphere: illustrated color palette and background mood only; keep the reference face photoreal and identical`,
  cartoon: (name) =>
    `${name} atmosphere: stylized colors and playful background only; do not cartoonify or reshape the face`,
  illustration: (name) =>
    `${name} atmosphere: illustrated color and graphic mood on environment only; face stays photoreal from reference`,
  digital: (name) =>
    `${name} atmosphere: digital art color grade and sci-fi mood on background only; preserve reference face exactly`,
  classic: (name) =>
    `${name} atmosphere: painterly color and canvas mood on scene only; do not paint over or age the face`,
  modern: (name) =>
    `${name} atmosphere: graphic design color and layout mood on scene only; face unchanged from reference`,
  fantasy: (name) =>
    `${name} atmosphere: fantasy lighting and magical background only; same person and age as reference`,
  vintage: (name) =>
    `${name} atmosphere: retro color grade and period styling on scene and wardrobe only; same face age as reference`,
  nsfw: (name) =>
    `${name}: apply user wardrobe and scene changes only; preserve exact face, skin tone and age from reference`,
};

const TEXT_BY_CAT = {
  photography: (name) => `Professional ${name} photograph, balanced composition, editorial quality`,
  anime_manga: (name) => `${name} illustration, clean anime art style, vibrant colors`,
  cartoon: (name) => `${name} cartoon illustration, bold colors, expressive character art`,
  illustration: (name) => `${name} illustration, professional comic or editorial art style`,
  digital: (name) => `${name} digital art, polished concept illustration`,
  classic: (name) => `${name} fine art painting style on canvas`,
  modern: (name) => `${name} modern graphic illustration`,
  fantasy: (name) => `${name} fantasy art illustration, cinematic atmosphere`,
  vintage: (name) => `${name} retro aesthetic illustration or photo style`,
  nsfw: (name) => `${name} editorial photography or illustration, follow user prompt`,
};

/** Overrides para estilos que antes puxavam idade / morphing facial */
const EDIT_OVERRIDES = {
  photo_glamour:
    "Glamour lighting and soft beauty glow on scene only; no skin retouch that changes age or face shape",
  photo_documentary:
    "Documentary B&W grade and composition mood; film grain on background only, not on face",
  photo_hdr: "HDR tonal range and vibrant colors on scene; do not sharpen or detail skin on the face",
  photo_classic_portrait:
    "Classic portrait lighting and soft bokeh background; natural look, same face age as reference",
  dig_anime:
    "Anime-inspired colors and illustrated background only; reference face stays photoreal, same person",
  anime_ghibli: "Soft pastel Ghibli-like background and warm colors; face photoreal from reference",
  anime_vintage: "80s anime color palette on background only; face unchanged from reference photo",
  cls_oil: "Oil painting texture on background and clothing only; face stays photoreal from reference",
  cls_engraving: "Engraving-style graphic mood on scene edges only; face photoreal from reference",
  vin_1920s: "1920s sepia color grade and art deco styling on scene; do not age the subject",
  vin_film_grain: "Analog film color grade; grain on image edges only, not aging the face",
  vin_polaroid: "Polaroid frame and warm fade on scene; same face age as reference",
  dig_photoreal:
    "Polished digital art mood on environment only; do not hyper-detail or change the reference face",
  toon_disney_3d:
    "Pixar-like color mood on background only; do not turn the face into a 3D cartoon character",
  lab_qwen_edit: "Clean photoreal polish on scene; preserve exact face and body from reference",
  lab_ultra_style: "Sharp color and contrast polish; preserve exact face age from reference",
  nsfw_oil_render:
    "Glossy body sheen on skin below neck if requested; face must stay identical photoreal from reference",
};

const TEXT_OVERRIDES = {};

function pickName(style) {
  return String(style?.labelEn || style?.label || style?.id || "Artistic").trim();
}

function pickCat(style) {
  return String(style?.cat || "illustration").trim();
}

/**
 * Prompt oculto do estilo — edição com foto de referência.
 */
export function getArtisticStyleEditPrompt(style) {
  if (!style) return "";
  const id = String(style.id || "").trim();
  if (EDIT_OVERRIDES[id]) return EDIT_OVERRIDES[id];
  const fn = EDIT_BY_CAT[pickCat(style)];
  return fn ? fn(pickName(style)) : EDIT_BY_CAT.illustration(pickName(style));
}

/**
 * Prompt oculto do estilo — texto para imagem (sem foto).
 */
export function getArtisticStyleTextPrompt(style) {
  if (!style) return "";
  const id = String(style.id || "").trim();
  if (TEXT_OVERRIDES[id]) return TEXT_OVERRIDES[id];
  const fn = TEXT_BY_CAT[pickCat(style)];
  return fn ? fn(pickName(style)) : TEXT_BY_CAT.illustration(pickName(style));
}

/** Mega-lens / efeitos — só ambiente, nunca rosto */
export function sanitizeEffectPrompt(prompt) {
  const p = String(prompt || "").trim();
  if (!p) return "";
  return `${p} (background and grade only, not face or age)`;
}
