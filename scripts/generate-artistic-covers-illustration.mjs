#!/usr/bin/env node
/** Capas Ilustração & Comic — ref mulher, 4:5. Uso: node scripts/generate-artistic-covers-illustration.mjs [--force] */
import { generateCovers, identityWithFraming, loadStylesByCat } from "./lib/artisticCoverGen.mjs";

const ID = identityWithFraming();
const NEG =
  "photorealistic raw photo, deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, watermark, text, logo";

const STYLE_PROMPT_BY_ID = {
  ill_comic: `${ID} American comic book: bold ink outlines, vibrant superhero colors, dynamic composition.`,
  ill_graphic_novel: `${ID} Graphic novel: painterly comic art, mature narrative visual style.`,
  ill_tintin: `${ID} Ligne claire Tintin style: clean uniform outlines, flat Franco-Belgian colors.`,
  ill_vector: `${ID} Flat vector illustration: clean geometric shapes, modern editorial vector art.`,
  ill_ink: `${ID} Pen and ink: detailed cross-hatching, editorial ink drawing on cream paper.`,
  ill_concept: `${ID} Concept art sketch: loose confident lines, greyscale entertainment previs.`,
  ill_tattoo: `${ID} Tattoo flash design: bold black outlines, traditional tattoo art aesthetic.`,
  ill_sticker: `${ID} Cute sticker: white die-cut border, emoji pack kawaii style.`,
  ill_pop: `${ID} Pop art comic: Ben-Day halftone dots, Warhol screen print, bold primary colors.`,
};

generateCovers(loadStylesByCat("illustration", STYLE_PROMPT_BY_ID), STYLE_PROMPT_BY_ID, {
  force: process.argv.includes("--force"),
  negativePrompt: NEG,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
