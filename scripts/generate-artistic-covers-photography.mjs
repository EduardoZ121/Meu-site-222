#!/usr/bin/env node
/** Capas Fotografia — ref mulher, 4:5. Uso: node scripts/generate-artistic-covers-photography.mjs [--force] */
import { generateCovers, identityWithFraming, loadStylesByCat } from "./lib/artisticCoverGen.mjs";

const ID = identityWithFraming();
const NEG =
  "deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, cartoon, illustration, watermark, text";

const STYLE_PROMPT_BY_ID = {
  photo_street: `${ID} Street photography: candid urban crosswalk, natural daylight, documentary feel.`,
  photo_fashion: `${ID} High fashion editorial: designer outfit, Vogue quality, sharp beauty lighting.`,
  photo_cinematic: `${ID} Cinematic film still: teal and orange grading, soft backlight rim light, blockbuster portrait.`,
  photo_noir: `${ID} Film noir black and white: hard shadows, venetian blind light, high contrast monochrome.`,
  photo_hdr: `${ID} HDR premium portrait: rich tonal range, luminous skin, vibrant natural colors.`,
  photo_casual: `${ID} Casual lifestyle: relaxed smile, soft cafe light, approachable social media aesthetic.`,
};

generateCovers(loadStylesByCat("photography", STYLE_PROMPT_BY_ID), STYLE_PROMPT_BY_ID, {
  force: process.argv.includes("--force"),
  negativePrompt: NEG,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
