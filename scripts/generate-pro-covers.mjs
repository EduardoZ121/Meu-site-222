#!/usr/bin/env node
/**
 * Capas da grelha Pro (Refinamento fotorrealista) — ref mulher + homem, 4:5.
 * Uso: node scripts/generate-pro-covers.mjs [--force]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  generateCovers,
  identityWithFraming,
  PRO_OUT_DIR,
  REF_MAN_GITHUB,
  REF_WOMAN_GITHUB,
  ROOT,
} from "./lib/artisticCoverGen.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const presetsPath = path.join(ROOT, "frontend/api/lib/proPresetsData.json");
const presets = JSON.parse(fs.readFileSync(presetsPath, "utf8"));

const W = identityWithFraming("woman");
const M = identityWithFraming("man");

const NEG =
  "deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, cartoon, illustration, "
  + "anime, painting, watermark, text, logo, duplicate face, cropped head";

/** Mulher: realismo + metade mood/enhance; homem: resto. */
const WOMAN_IDS = new Set([
  "original",
  "expression",
  "softer",
  "cinematic",
  "ultra_real",
  "iphone",
  "studio",
  "smile",
  "romantic",
  "skin_hair",
]);

const STYLE_PROMPT_BY_ID = {
  original: `${W} Natural professional portrait edit, neutral calm expression, true-to-life colors, clean DSLR look.`,
  expression: `${W} Photoreal portrait preserving exact natural expression and mood, faithful likeness, soft studio light.`,
  softer: `${W} Gentle soft realism portrait, diffused flattering light, natural skin, subtle professional retouch.`,
  cinematic: `${W} Cinematic photoreal portrait, teal and orange film grading, dramatic key light, shallow depth of field, movie still.`,
  ultra_real: `${W} Ultra photoreal professional headshot, 85mm lens look, razor sharp eyes, natural pores, 8K DSLR quality.`,
  iphone: `${W} Natural iPhone selfie aesthetic, soft daylight, candid authentic phone photo, realistic skin.`,
  studio: `${W} High-end studio portrait, three-point softbox lighting, seamless backdrop, magazine editorial quality.`,
  smile: `${W} Warm genuine natural smile, Duchenne smile, friendly eyes, photoreal portrait, professional photography.`,
  romantic: `${W} Soft romantic portrait, golden hour glow, gentle bokeh, dreamy warm color grade, tender calm expression.`,
  skin_hair: `${W} Enhanced skin and hair detail, realistic pores and hair strands, premium retouch, photoreal portrait.`,
  seductive: `${M} Confident subtle seductive gaze, elegant editorial portrait, soft smolder, sharp catchlights.`,
  model: `${M} High fashion model portrait, Vogue editorial lighting, strong cheekbones, aloof powerful attitude.`,
  intense: `${M} Intense dramatic portrait, chiaroscuro lighting, brooding cinematic mood, piercing focused gaze.`,
  fun: `${M} Playful laughing candid portrait, big genuine smile, energetic happy vibe, sharp natural colors.`,
  fullbody: `${M} Professional full-body fashion editorial, confident standing pose, studio lighting, sharp outfit detail.`,
  lighting: `${M} Dramatically improved professional lighting and shadows, three-dimensional portrait, cinematic depth.`,
  outfit: `${M} Enhanced clothing fabric texture and folds, fashion editorial, sharp detail, same outfit style.`,
  color: `${M} Vibrant professional color grading, balanced skin tones, rich contrast, Lightroom-style finish.`,
  eyes: `${M} Ultra vivid expressive eyes, natural catchlights, sharp iris detail, engaging photoreal portrait.`,
  max: `${M} Maximum detail professional portrait, magazine cover finish, ultra sharp, cohesive premium retouch.`,
};

const styles = Object.keys(presets)
  .filter((id) => STYLE_PROMPT_BY_ID[id])
  .map((id) => ({ id, label: presets[id].nome }));

const refById = Object.fromEntries(
  styles.map((s) => [s.id, WOMAN_IDS.has(s.id) ? REF_WOMAN_GITHUB : REF_MAN_GITHUB]),
);

generateCovers(styles, STYLE_PROMPT_BY_ID, {
  force: process.argv.includes("--force"),
  negativePrompt: NEG,
  refById,
  outDir: PRO_OUT_DIR,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
