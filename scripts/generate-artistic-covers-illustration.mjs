#!/usr/bin/env node
/**
 * Capas Ilustração & Comic — mesma mulher (ref_woman) estilizada por prompt.
 * Pollinations Flux + imagem de referência (URL GitHub).
 *
 * Uso: node scripts/generate-artistic-covers-illustration.mjs [--force]
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

const STYLE_PROMPT_BY_ID = {
  ill_comic:
    `${IDENTITY} American comic book style: bold ink outlines, vibrant superhero comic colors, dynamic heroic composition, Marvel DC cover energy.`,
  ill_graphic_novel:
    `${IDENTITY} Graphic novel illustration: painterly comic art, mature narrative visual style, detailed sequential art mood, cinematic drama.`,
  ill_tintin:
    `${IDENTITY} Ligne claire comic style: Tintin Franco-Belgian comic, clean uniform outlines, flat colors, European adventure comic aesthetic.`,
  ill_vector:
    `${IDENTITY} Flat vector illustration: clean geometric shapes, modern editorial vector art, crisp digital poster style.`,
  ill_ink:
    `${IDENTITY} Pen and ink illustration: detailed cross-hatching, editorial ink drawing style, black ink on cream paper.`,
  ill_concept:
    `${IDENTITY} Professional concept art sketch: loose confident lines, entertainment industry previs, greyscale rapid sketch portrait.`,
  ill_tattoo:
    `${IDENTITY} Tattoo flash design style: bold black outlines, traditional tattoo art, ink on skin aesthetic, ornamental flash sheet.`,
  ill_sticker:
    `${IDENTITY} Cute sticker illustration: white die-cut border, emoji pack style, kawaii sticker art, glossy sticker sheet look.`,
  ill_pop:
    `${IDENTITY} Pop art comic style: Ben-Day halftone dots, Andy Warhol screen print, bold primary colors, retro pop culture portrait.`,
};

function loadIllustrationStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const slice = src.slice(src.indexOf("export const ARTISTIC_STUDIO_STYLES = "));
  const arrEnd = slice.indexOf("];\n\nexport const ARTISTIC_EFFECT_SECTIONS");
  return new Function(`return ${slice.slice(slice.indexOf("["), arrEnd + 1)}`)().filter(
    (s) => s.cat === "illustration" && STYLE_PROMPT_BY_ID[s.id],
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
  const styles = loadIllustrationStyles();

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
