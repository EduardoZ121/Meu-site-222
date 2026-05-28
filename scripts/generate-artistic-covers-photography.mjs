#!/usr/bin/env node
/**
 * Capas Fotografia — ref mulher + ref homem, 4:5 profissional.
 * Uso: node scripts/generate-artistic-covers-photography.mjs [--force]
 */
import {
  generateCovers,
  identityWithFraming,
  loadStylesByCat,
  REF_MAN_GITHUB,
  REF_WOMAN_GITHUB,
} from "./lib/artisticCoverGen.mjs";

const W = identityWithFraming("woman");
const M = identityWithFraming("man");

const NEG =
  "deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, cartoon, illustration, "
  + "anime, painting, watermark, text, logo, duplicate face, cropped head, cut off chin";

const STYLE_PROMPT_BY_ID = {
  photo_classic_portrait: `${W} Classic portrait photography, soft natural lighting, natural skin texture, shallow depth of field, creamy bokeh background, timeless editorial portrait, professional DSLR quality.`,
  photo_editorial: `${W} High-fashion editorial portrait, dramatic contrast, bold posing, magazine cover quality, sharp styling, professional studio fashion photography.`,
  photo_lifestyle: `${W} Authentic lifestyle photography, candid natural moment, soft daylight, relaxed atmosphere, documentary feel, real-world environment.`,
  photo_documentary: `${W} Documentary black and white photography, visible film grain, raw honest moment, photojournalistic composition, high contrast monochrome.`,
  photo_fine_art: `${W} Fine art photographic print, painterly composition, subtle canvas texture, gallery-worthy framing, artistic stillness, museum quality.`,
  photo_glamour: `${W} Glamour studio portrait, flawless natural skin, beauty dish lighting, luminous highlights, elegant shine, luxury beauty campaign.`,
  photo_street: `${M} Street photography, candid urban moment, gritty city atmosphere, natural available light, Henri Cartier-Bresson inspired framing.`,
  photo_fashion: `${M} High fashion runway photography, dynamic motion, designer clothing, sharp flash, Vogue editorial energy.`,
  photo_cinematic: `${M} Cinematic still frame, anamorphic widescreen composition, movie color grading, dramatic storytelling lighting, blockbuster film still.`,
  photo_noir: `${M} Film noir photography, hard shadows, venetian blind light patterns, mysterious mood, high contrast black and white.`,
  photo_hdr: `${M} HDR photography, rich tonal range, hyper-detailed textures, vibrant but natural colors, premium commercial portrait look.`,
  photo_casual: `${M} Casual smartphone-quality photo aesthetic, natural relaxed pose, everyday authentic vibe, soft indoor light, approachable social media style.`,
};

/** Mulher nos primeiros 6 cards; homem nos restantes. */
const REF_BY_ID = Object.fromEntries(
  Object.keys(STYLE_PROMPT_BY_ID).map((id, i) => [
    id,
    i < 6 ? REF_WOMAN_GITHUB : REF_MAN_GITHUB,
  ]),
);

generateCovers(loadStylesByCat("photography", STYLE_PROMPT_BY_ID), STYLE_PROMPT_BY_ID, {
  force: process.argv.includes("--force"),
  negativePrompt: NEG,
  refById: REF_BY_ID,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
