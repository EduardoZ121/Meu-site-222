#!/usr/bin/env node
/**
 * Capas Anime & Manga — mesma mulher (ref_woman) estilizada por prompt.
 * Pollinations Flux + imagem de referência (URL GitHub, sem base64).
 *
 * Uso: node scripts/generate-artistic-covers-anime.mjs [--force]
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/artistic-covers");
const REF_GITHUB =
  "https://raw.githubusercontent.com/EduardoZ121/Meu-site-222/main/scripts/assets/ref_woman.jpg";
const FORCE = process.argv.includes("--force");
const DELAY_MS = 4500;

const IDENTITY =
  "Same woman from the reference photo as the subject, keep her recognizable face, hair color and likeness. "
  + "She may be seated as in the reference. Single character portrait, clean composition, "
  + "correct anatomy, no extra limbs, no deformed hands.";

/** Prompt por estilo — ilustração distinta, mesma pessoa. */
const STYLE_PROMPT_BY_ID = {
  dig_anime:
    `${IDENTITY} Anime illustration: large expressive eyes, clean line art, vibrant cel shading, Japanese animation aesthetic, studio quality key visual.`,
  anime_ghibli:
    `${IDENTITY} Studio Ghibli anime style: soft watercolor backgrounds, warm gentle colors, Miyazaki hand-painted animation feel, pastoral dreamy mood.`,
  anime_manga_bw:
    `${IDENTITY} Black and white manga illustration: detailed ink lines, screentone shading, Japanese manga panel aesthetic, dramatic monochrome.`,
  anime_manhwa:
    `${IDENTITY} Korean manhwa webtoon style: clean digital coloring, soft gradients, romantic character art, vertical webtoon polish.`,
  anime_chibi:
    `${IDENTITY} Chibi anime style: super-deformed cute proportions, kawaii expression, simple bold outlines, adorable mini character version of her.`,
  anime_shonen:
    `${IDENTITY} Shonen anime style: dynamic heroic pose, speed lines, intense expression, battle manga energy, action key visual.`,
  anime_soft:
    `${IDENTITY} Soft anime illustration: pastel palette, gentle shading, romantic slice-of-life aesthetic, dreamy tender mood.`,
  anime_vintage:
    `${IDENTITY} 1980s vintage anime style: retro cel animation, muted VHS colors, classic OVA aesthetic, nostalgic grain.`,
  anime_webtoon:
    `${IDENTITY} Full color webtoon illustration: vivid digital painting, modern online comic style, glossy highlights, scroll comic quality.`,
  anime_mecha:
    `${IDENTITY} Mecha anime illustration: sci-fi pilot portrait with detailed giant robot in background, Gundam-inspired mechanical design.`,
  anime_vtuber:
    `${IDENTITY} VTuber character illustration: Live2D style, glossy anime eyes, streaming avatar aesthetic, neon rim light.`,
};

function loadAnimeStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const slice = src.slice(src.indexOf("export const ARTISTIC_STUDIO_STYLES = "));
  const arrEnd = slice.indexOf("];\n\nexport const ARTISTIC_EFFECT_SECTIONS");
  return new Function(`return ${slice.slice(slice.indexOf("["), arrEnd + 1)}`)().filter(
    (s) => s.cat === "anime_manga" && STYLE_PROMPT_BY_ID[s.id],
  );
}

function pollinationsUrl(prompt, refImage, seed) {
  const q = encodeURIComponent(`${prompt} No text, no watermark, no logo.`);
  const params = new URLSearchParams({
    width: "512",
    height: "640",
    model: "flux",
    nologo: "true",
    enhance: "false",
    seed: String(seed),
    image: refImage,
    negative_prompt:
      "photorealistic photo, deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, watermark, text, logo",
  });
  return `https://image.pollinations.ai/prompt/${q}?${params.toString()}`;
}

function seedFromId(id) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 999999;
}

async function main() {
  console.log(`Referência: ${REF_GITHUB}\n`);
  await fs.mkdir(OUT_DIR, { recursive: true });
  const styles = loadAnimeStyles();

  for (const style of styles) {
    const dest = path.join(OUT_DIR, `${style.id}.jpg`);
    if (!FORCE) {
      try {
        await fs.access(dest);
        console.log(`skip ${style.id}`);
        continue;
      } catch {
        /* */
      }
    }

    const prompt = STYLE_PROMPT_BY_ID[style.id];
    const url = pollinationsUrl(prompt, REF_GITHUB, seedFromId(style.id));
    console.log(`→ ${style.id} (${style.label})`);

    let ok = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 12000) throw new Error("resposta inválida");
        await fs.writeFile(dest, buf);
        console.log(`  ✓ ${buf.length} bytes`);
        ok = true;
        break;
      } catch (e) {
        console.warn(`  tentativa ${attempt + 1} falhou:`, e.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    if (!ok) console.error(`  ✗ ${style.id} falhou`);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log("\nConcluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
