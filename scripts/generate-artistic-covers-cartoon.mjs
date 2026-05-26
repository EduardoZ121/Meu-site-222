#!/usr/bin/env node
/** Capas Cartoon & 3D — ref mulher, 4:5. Uso: node scripts/generate-artistic-covers-cartoon.mjs [--force] */
import { generateCovers, identityWithFraming, loadStylesByCat } from "./lib/artisticCoverGen.mjs";

const ID = identityWithFraming();
const NEG =
  "photorealistic raw photo, deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, watermark, text, logo";

const STYLE_PROMPT_BY_ID = {
  toon_disney_2d: `${ID} Disney 2D animation: classic hand-drawn aesthetic, expressive features, cel animation.`,
  toon_disney_3d: `${ID} Disney Pixar 3D: cute stylized render, subsurface scattering, family film lighting.`,
  toon_cartoon: `${ID} Modern TV cartoon: bold outlines, flat vibrant colors, fun proportions.`,
  toon_pokemon_2d: `${ID} Pokemon 2D official art: Nintendo style, clean cel shading.`,
  toon_pokemon_3d: `${ID} Pokemon 3D render: glossy cute Nintendo 3D model.`,
  toon_claymation: `${ID} Claymation stop motion: handmade clay texture, Wallace and Gromit aesthetic.`,
  toon_cute_3d: `${ID} Cute 3D chibi render: kawaii collectible figurine, soft plastic toy look.`,
  toon_figurine: `${ID} Cute vinyl figurine product shot: collectible toy on studio shelf.`,
};

generateCovers(loadStylesByCat("cartoon", STYLE_PROMPT_BY_ID), STYLE_PROMPT_BY_ID, {
  force: process.argv.includes("--force"),
  negativePrompt: NEG,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
