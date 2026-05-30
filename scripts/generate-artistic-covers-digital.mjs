#!/usr/bin/env node
/**
 * Capas Digital & Sci-Fi — ref mulher + prompt por estilo (4:5 para cards).
 * Uso: node scripts/generate-artistic-covers-digital.mjs [--force]
 */
import {
  generateCovers,
  identityWithFraming,
  loadStylesByCat,
} from "./lib/artisticCoverGen.mjs";

const ID = identityWithFraming();
const NEG =
  "deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, watermark, text, logo";

const STYLE_PROMPT_BY_ID = {
  dig_concept_art:
    `${ID} Epic concept art portrait: cinematic sci-fi environment behind her, matte painting quality, blockbuster film previs lighting.`,
  dig_pixel_art:
    `${ID} Retro pixel art portrait: 16-bit game aesthetic, limited color palette, crisp pixel grid, nostalgic arcade character sprite style.`,
  dig_low_poly:
    `${ID} Low poly 3D portrait render: geometric faceted surfaces, minimalist stylized forms, soft gradient lighting.`,
  dig_vaporwave:
    `${ID} Vaporwave aesthetic portrait: pink and cyan neon, 80s retro grid, glitch artifacts, nostalgic synthwave mood.`,
  dig_cyberpunk:
    `${ID} Cyberpunk portrait: dystopian neon rain, blade runner atmosphere, futuristic noir lighting, high-tech city bokeh.`,
  dig_synthwave:
    `${ID} Synthwave retrowave portrait: neon pink purple sunset, 80s outrun grid, chrome reflections, retro futurism.`,
  dig_glitch:
    `${ID} Glitch art portrait: RGB channel split, digital corruption, cyber error visual, fragmented holographic face.`,
  dig_holographic:
    `${ID} Holographic iridescent portrait: futuristic hologram projection, prismatic rainbow shimmer, sci-fi light rays.`,
  dig_isometric:
    `${ID} 3D isometric icon style portrait: clean game art, soft shadows, mobile game asset, cute isometric character bust.`,
  dig_photoreal:
    `${ID} Photorealistic digital painting portrait: ArtStation quality, hyperrealistic skin detail, professional digital art lighting.`,
};

const force = process.argv.includes("--force");

generateCovers(loadStylesByCat("digital", STYLE_PROMPT_BY_ID), STYLE_PROMPT_BY_ID, {
  force,
  negativePrompt: NEG,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
