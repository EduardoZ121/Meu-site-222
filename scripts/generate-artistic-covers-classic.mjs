#!/usr/bin/env node
/** Pintura Clássica — ref mulher, 4:5. Uso: node scripts/generate-artistic-covers-classic.mjs [--force] */
import { generateCovers, identityWithFraming, loadStylesByCat } from "./lib/artisticCoverGen.mjs";

const ID = identityWithFraming();
const NEG =
  "deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, watermark, text, logo";

const STYLE_PROMPT_BY_ID = {
  cls_oil: `${ID} Classical oil painting portrait: visible brushstrokes, rich impasto, old masters museum canvas.`,
  cls_watercolor: `${ID} Delicate watercolor portrait: fluid transparent washes, soft bleeding edges, paper texture.`,
  cls_charcoal: `${ID} Charcoal sketch portrait: rough textured strokes, dramatic black and white on toned paper.`,
  cls_pastel: `${ID} Soft pastel portrait: powdery delicate colors, dreamy chalk pastel atmosphere.`,
  cls_engraving: `${ID} Fine line engraving portrait: black and white hatching, antique etching print style.`,
  cls_mosaic: `${ID} Byzantine mosaic portrait: small colorful tiles forming her face, ornate decorative pattern.`,
  cls_acrylic: `${ID} Acrylic painting portrait: bold vivid brushstrokes, contemporary fine art canvas texture.`,
  cls_gouache: `${ID} Gouache painting portrait: opaque matte pigments, editorial illustration book aesthetic.`,
  cls_ukiyoe: `${ID} Japanese ukiyo-e woodblock print portrait: flat colors, traditional waves and patterns.`,
  cls_nihonga: `${ID} Traditional Nihonga Japanese painting portrait: mineral pigments, elegant classical art.`,
};

generateCovers(loadStylesByCat("classic", STYLE_PROMPT_BY_ID), STYLE_PROMPT_BY_ID, {
  force: process.argv.includes("--force"),
  negativePrompt: NEG,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
