#!/usr/bin/env node
/** Fantasia & Épico — ref mulher, 4:5. Uso: node scripts/generate-artistic-covers-fantasy.mjs [--force] */
import { generateCovers, identityWithFraming, loadStylesByCat } from "./lib/artisticCoverGen.mjs";

const ID = identityWithFraming();
const NEG =
  "deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, watermark, text, logo";

const STYLE_PROMPT_BY_ID = {
  fan_epic: `${ID} Epic fantasy digital painting portrait: magical atmosphere, heroic LOTR illustration quality.`,
  fan_dark: `${ID} Dark fantasy portrait: gothic atmosphere, moody shadows, sinister magical realism.`,
  fan_steampunk: `${ID} Steampunk portrait: Victorian mechanical aesthetic, brass gears, retro-futuristic inventor.`,
  fan_dnd: `${ID} Dungeons and Dragons character portrait: tabletop RPG fantasy art, detailed hero illustration.`,
  fan_space: `${ID} Space opera sci-fi portrait: cosmic nebula background, epic starships, Star Wars concept energy.`,
  fan_ethereal: `${ID} Ethereal fantasy portrait: soft glowing light, fairy tale magical forest, dreamy beauty.`,
  fan_gothic: `${ID} Gothic dark fantasy portrait: cathedral shadows, moody dark romantic atmosphere.`,
  fan_neon: `${ID} Neon glow fantasy portrait: glowing edges on dark background, vibrant electric outlines.`,
};

generateCovers(loadStylesByCat("fantasy", STYLE_PROMPT_BY_ID), STYLE_PROMPT_BY_ID, {
  force: process.argv.includes("--force"),
  negativePrompt: NEG,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
