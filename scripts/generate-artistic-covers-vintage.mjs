#!/usr/bin/env node
/** Vintage & Retro — ref mulher, 4:5. Uso: node scripts/generate-artistic-covers-vintage.mjs [--force] */
import { generateCovers, identityWithFraming, loadStylesByCat } from "./lib/artisticCoverGen.mjs";

const ID = identityWithFraming();
const NEG =
  "deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, watermark, text, logo";

const STYLE_PROMPT_BY_ID = {
  vin_pulp: `${ID} Vintage pulp magazine cover portrait: saturated retro illustration, 1950s adventure poster style.`,
  vin_pinup_art: `${ID} Vintage pin-up illustration portrait: 1940s retro glamour poster, tasteful classic Americana art, SFW.`,
  vin_1920s: `${ID} 1920s vintage photograph portrait: sepia tones, art deco era fashion, flapper era atmosphere.`,
  vin_1990s: `${ID} 1990s photograph portrait: direct flash, slightly faded colors, nostalgic 90s snapshot aesthetic.`,
  vin_vhs: `${ID} VHS camcorder footage portrait: scanlines, analog video noise, retro home video aesthetic, date stamp feel.`,
  vin_polaroid: `${ID} Polaroid instant film portrait: white frame border feel, faded warm analog colors, nostalgic snapshot.`,
  vin_film_grain: `${ID} Analog film photography portrait: heavy authentic film grain, Kodak Portra colors, nostalgic celluloid.`,
  vin_retro_comic: `${ID} Vintage comic book print portrait: aged yellowed newsprint, retro halftone printing, golden age comic.`,
};

generateCovers(loadStylesByCat("vintage", STYLE_PROMPT_BY_ID), STYLE_PROMPT_BY_ID, {
  force: process.argv.includes("--force"),
  negativePrompt: NEG,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
