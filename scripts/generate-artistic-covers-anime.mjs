#!/usr/bin/env node
/** Capas Anime & Manga — ref mulher, 4:5. Uso: node scripts/generate-artistic-covers-anime.mjs [--force] */
import { generateCovers, identityWithFraming, loadStylesByCat } from "./lib/artisticCoverGen.mjs";

const ID = identityWithFraming();
const NEG =
  "photorealistic raw photo, deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, watermark, text, logo";

const STYLE_PROMPT_BY_ID = {
  dig_anime: `${ID} Anime illustration: large expressive eyes, clean line art, vibrant cel shading.`,
  anime_ghibli: `${ID} Studio Ghibli style: soft watercolor backgrounds, warm gentle Miyazaki colors.`,
  anime_manga_bw: `${ID} Black and white manga: detailed ink lines, screentone shading.`,
  anime_manhwa: `${ID} Korean manhwa webtoon: clean digital coloring, soft gradients.`,
  anime_chibi: `${ID} Chibi anime: super-deformed cute proportions, kawaii expression.`,
  anime_shonen: `${ID} Shonen anime: dynamic heroic pose, speed lines, battle manga energy.`,
  anime_soft: `${ID} Soft anime: pastel palette, gentle shading, slice-of-life mood.`,
  anime_vintage: `${ID} 1980s vintage anime: retro cel, muted VHS colors, classic OVA.`,
  anime_webtoon: `${ID} Full color webtoon: vivid digital painting, modern online comic.`,
  anime_mecha: `${ID} Mecha anime portrait with giant robot in background, Gundam-inspired.`,
  anime_vtuber: `${ID} VTuber illustration: Live2D style, glossy anime eyes, streaming avatar.`,
};

generateCovers(loadStylesByCat("anime_manga", STYLE_PROMPT_BY_ID), STYLE_PROMPT_BY_ID, {
  force: process.argv.includes("--force"),
  negativePrompt: NEG,
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
