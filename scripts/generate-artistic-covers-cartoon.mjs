#!/usr/bin/env node
/**
 * Capas Cartoon & 3D — mesma mulher (ref_woman) estilizada por prompt.
 * Pollinations Flux + imagem de referência (URL GitHub).
 *
 * Uso: node scripts/generate-artistic-covers-cartoon.mjs [--force]
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
  + "She may be seated as in the reference. Single character, clean composition, "
  + "correct anatomy, no extra limbs, no deformed hands.";

const STYLE_PROMPT_BY_ID = {
  toon_disney_2d:
    `${IDENTITY} Disney 2D animation style: classic hand-drawn princess or hero aesthetic, expressive features, cel animation, warm storybook colors.`,
  toon_disney_3d:
    `${IDENTITY} Disney Pixar 3D character style: cute stylized 3D render, subsurface scattering skin, cinematic family film quality lighting.`,
  toon_cartoon:
    `${IDENTITY} Modern TV cartoon style: bold outlines, flat vibrant colors, exaggerated fun proportions, Saturday morning cartoon energy.`,
  toon_pokemon_2d:
    `${IDENTITY} Pokemon 2D official art style: Nintendo creature trainer portrait, clean cel shading, bright game illustration aesthetic.`,
  toon_pokemon_3d:
    `${IDENTITY} Pokemon 3D render style: Nintendo 3D character, glossy cute 3D model, game cinematic lighting, collectible creature world.`,
  toon_claymation:
    `${IDENTITY} Claymation stop motion style: handmade clay texture, Wallace and Gromit aesthetic, tactile sculpted character portrait.`,
  toon_cute_3d:
    `${IDENTITY} Cute 3D chibi character render: kawaii collectible figurine, soft plastic toy aesthetic, pastel studio lighting.`,
  toon_figurine:
    `${IDENTITY} Cute figurine product photography: collectible vinyl toy render of her, studio product lighting, photoreal toy on shelf aesthetic.`,
};

function loadCartoonStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const slice = src.slice(src.indexOf("export const ARTISTIC_STUDIO_STYLES = "));
  const arrEnd = slice.indexOf("];\n\nexport const ARTISTIC_EFFECT_SECTIONS");
  return new Function(`return ${slice.slice(slice.indexOf("["), arrEnd + 1)}`)().filter(
    (s) => s.cat === "cartoon" && STYLE_PROMPT_BY_ID[s.id],
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
      "photorealistic raw photo, deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, watermark, text, logo",
  });
  return `https://image.pollinations.ai/prompt/${q}?${params.toString()}`;
}

function seedFromId(id) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 999999;
}

async function main() {
  console.log(`Referência: ${REF_GITHUB}\n`);
  await fs.mkdir(OUT_DIR, { recursive: true });
  const styles = loadCartoonStyles();

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
