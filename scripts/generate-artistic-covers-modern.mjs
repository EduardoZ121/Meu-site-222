#!/usr/bin/env node
/** Design Moderno — ref mulher, 4:5. Uso: node scripts/generate-artistic-covers-modern.mjs [--force] */
import { generateCovers, identityWithFraming, loadStylesByCat } from "./lib/artisticCoverGen.mjs";

const ID = identityWithFraming();
const NEG =
  "deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, watermark, text, logo";

const STYLE_PROMPT_BY_ID = {
  mod_minimal: `${ID} Minimalist design portrait: clean lines, generous negative space, modern simplicity.`,
  mod_flat: `${ID} Flat design portrait: solid colors, no shadows, clean 2D vector shapes, modern UI illustration.`,
  mod_brutalist: `${ID} Brutalist graphic design portrait: harsh raw colors, anti-design poster aesthetic.`,
  mod_art_deco: `${ID} Art Deco portrait: geometric symmetry, gold accents, elegant 1920s luxury patterns.`,
  mod_pop_art: `${ID} Pop art portrait: saturated primary colors, Ben-Day dots, Warhol screen print style.`,
  mod_surreal: `${ID} Surrealist portrait: dreamscape, floating impossible objects, Dalí inspired atmosphere.`,
  mod_art_nouveau: `${ID} Art Nouveau portrait: ornate flowing organic lines, floral patterns, Mucha inspired.`,
  mod_y2k: `${ID} Y2K aesthetic portrait: chrome textures, iridescent bubbles, early 2000s digital nostalgia.`,
};

generateCovers(loadStylesByCat("modern", STYLE_PROMPT_BY_ID), STYLE_PROMPT_BY_ID, {
  force: process.argv.includes("--force"),
  negativePrompt: NEG,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
