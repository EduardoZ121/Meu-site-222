/**
 * Posters Fashion — 2 templates separados (1 prompt cada, do TXT).
 */

const REF = `REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text overlap, cut through or hide behind the face; place headlines in negative space or on background layers behind the subject when needed.

`;

const FASHION_REF = `${REF}Use the uploaded photo for the person reference. If a second reference image (logo slot) is provided, use it as the clothing/garment reference.
Completely replace the original background and environment.

score_9, score_8_up, masterpiece, best quality, absurdres, ultra detailed, 8k UHD,
`;

const NEGATIVE_SHOWCASE = `
Avoid: original background, original environment, restaurant interior, resort interior, outdoor scenery, furniture, decorative elements, architecture from reference image, wireframe, uv map, texture map, topology view, T-pose, A-pose, technical blueprint, game development sheet, material spheres, anatomy guide, 3d modeling interface, software UI, developer notes, measurement guides, engineering diagram, crowded layout, low quality, blurry, distorted anatomy.`;

const NEGATIVE_PORTFOLIO = `
Avoid: original background, restaurant interior, resort interior, outdoor scenery, furniture, decorative plants, architectural elements, measurement charts, body statistics, height labels, weight labels, technical annotations, wireframe, uv maps, texture maps, topology view, material spheres, T-pose, A-pose, blueprints, 3D software interface, developer notes, engineering diagrams, crowded layout, low quality, blurry, distorted anatomy, oversaturated colors.`;

export const PROMPT_FASHION_CHARACTER_SHOWCASE = `${FASHION_REF}Use the reference image ONLY for:
facial features,
hairstyle,
body proportions,
clothing,
accessories,
pose reference.

hyper-realistic person, photorealistic appearance, warm cinematic lighting, high-end fashion editorial photography, luxury lifestyle aesthetic, elegant presentation, realistic skin texture, natural skin imperfections, realistic pores, subsurface scattering, physically accurate shading, ultra detailed eyes, realistic eyelashes, natural makeup, detailed hair strands, sharp focus, professional fashion character showcase sheet, editorial character presentation board, large hero image occupying most of the composition, character turnaround presentation: front view, side view, back view, facial close-up portrait, side profile close-up, hair detail close-up, outfit detail panels, accessory detail panels, footwear detail panels, minimalist elegant layout, clean panel separation, premium magazine design, luxury fashion campaign aesthetic, luxury minimalist editorial studio, warm beige seamless backdrop, soft neutral tones, high-end fashion lookbook style, soft studio lighting, subtle floor shadows, editorial studio environment, clean seamless background, consistent neutral background across all panels, color palette swatches matching clothing and accessories, extremely detailed, sharp focus, professional presentation, clean composition, high-end editorial design.${NEGATIVE_SHOWCASE}`;

export const PROMPT_FASHION_PORTFOLIO_SHEET = `${FASHION_REF}Use the reference image ONLY for:
facial features,
hairstyle,
body proportions,
clothing,
accessories,
general appearance.

Completely replace the original environment with a luxury editorial studio setting.

hyper-realistic person, photorealistic appearance, high-end fashion editorial photography, luxury campaign presentation, premium magazine aesthetic, detailed skin texture, realistic pores, natural skin imperfections, ultra detailed eyes, realistic eyelashes, natural makeup, detailed hair strands, subsurface scattering, physically accurate shading, sharp focus, soft cinematic studio lighting, warm neutral color grading, global illumination, soft shadows, high dynamic range photography, professional fashion portfolio sheet, editorial character presentation board, minimalist elegant layout, clean panel separation, luxury lookbook design, large hero image occupying approximately 45% of the composition, character turnaround presentation: front view, side view, back view, facial close-up portrait, side profile portrait, hair detail portrait, top detail, bottom detail, footwear detail, accessory detail, integrated color palette swatches matching clothing and accessories, small and elegant color palette placement, warm beige seamless studio backdrop, soft neutral studio tones, minimalist editorial studio environment, high-end fashion catalog aesthetic, subtle floor shadows, consistent studio background across all panels, clean composition, balanced spacing, premium fashion magazine layout, extremely detailed, professional presentation, award-winning editorial photography.${NEGATIVE_PORTFOLIO}`;

/** Dois cartões separados na grelha — sem picker de variantes. */
export const FASHION_POSTER_TEMPLATES = [
  {
    id: "fashion_character_showcase",
    source_id: "fashion_character_showcase",
    category: "fashion",
    label: "CHARACTER SHOWCASE",
    subtag: "Prompt 1 · Lookbook editorial",
    placeholders: [],
    optional: [],
    replacements: {},
    prompt: PROMPT_FASHION_CHARACTER_SHOWCASE,
    aspect: "4:5",
  },
  {
    id: "fashion_portfolio_sheet",
    source_id: "fashion_portfolio_sheet",
    category: "fashion",
    label: "PORTFOLIO SHEET",
    subtag: "Prompt 2 · Lookbook editorial",
    placeholders: [],
    optional: [],
    replacements: {},
    prompt: PROMPT_FASHION_PORTFOLIO_SHEET,
    aspect: "4:5",
  },
];

export function buildFashionPosterTemplates() {
  return FASHION_POSTER_TEMPLATES.map((tpl) => ({ ...tpl }));
}
