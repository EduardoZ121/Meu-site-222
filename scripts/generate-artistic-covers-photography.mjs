#!/usr/bin/env node
/**
 * Capas Fotografia — mesma mulher (ref_woman sentada) + prompt do estilo.
 * Usa Pollinations Flux com imagem de referência (sem Replicate).
 *
 * Uso: node scripts/generate-artistic-covers-photography.mjs [--force]
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/artistic-covers");
const REF_LOCAL = path.join(ROOT, "scripts/assets/ref_woman.jpg");
const REF_GITHUB =
  "https://raw.githubusercontent.com/EduardoZ121/Meu-site-222/main/scripts/assets/ref_woman.jpg";
const FORCE = process.argv.includes("--force");
const DELAY_MS = 4000;

const IDENTITY =
  "Same woman from the reference photo, preserve her face identity, skin tone and natural proportions. "
  + "She may be seated as in the reference. Photorealistic, professional photography, sharp focus, "
  + "correct anatomy, no distortion, no deformed hands.";

/** Prompt por estilo — cena e luz diferentes, sempre a mesma pessoa. */
const STYLE_PROMPT_BY_ID = {
  photo_street:
    `${IDENTITY} Street photography: candid moment in a busy city crosswalk, urban grit, natural daylight, Henri Cartier-Bresson documentary feel.`,
  photo_fashion:
    `${IDENTITY} High fashion editorial: designer outfit, studio or runway lighting, Vogue magazine quality, bold confident pose, sharp beauty lighting.`,
  photo_cinematic:
    `${IDENTITY} Cinematic film still: dramatic movie color grading, teal and orange, soft backlight rim light, widescreen blockbuster portrait mood.`,
  photo_noir:
    `${IDENTITY} Film noir black and white portrait: hard shadows, venetian blind light patterns, mysterious 1940s detective mood, high contrast monochrome.`,
  photo_hdr:
    `${IDENTITY} HDR premium portrait: rich tonal range, luminous skin detail, vibrant but natural colors, commercial beauty campaign lighting.`,
  photo_casual:
    `${IDENTITY} Casual lifestyle photo: relaxed authentic smile, soft indoor cafe or home light, natural social media aesthetic, approachable vibe.`,
};

function loadPhotoStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const slice = src.slice(src.indexOf("export const ARTISTIC_STUDIO_STYLES = "));
  const arrEnd = slice.indexOf("];\n\nexport const ARTISTIC_EFFECT_SECTIONS");
  return new Function(`return ${slice.slice(slice.indexOf("["), arrEnd + 1)}`)().filter(
    (s) => s.cat === "photography" && STYLE_PROMPT_BY_ID[s.id],
  );
}

/** Sempre URL pública — data URI no GET do Pollinations causa HTTP 414. */
async function resolveRefImageUrl() {
  try {
    await fs.access(REF_LOCAL);
    return REF_GITHUB;
  } catch {
    return REF_GITHUB;
  }
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
    negative_prompt: "deformed, distorted, ugly, bad anatomy, extra fingers, extra limbs, blurry, cartoon, illustration, watermark, text",
  });
  if (refImage.startsWith("data:")) {
    params.set("image", refImage);
  } else {
    params.set("image", refImage);
  }
  return `https://image.pollinations.ai/prompt/${q}?${params.toString()}`;
}

function seedFromId(id) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 999999;
}

async function main() {
  const refImage = await resolveRefImageUrl();
  const refLabel = REF_GITHUB;
  console.log(`Referência: ${refLabel}\n`);

  await fs.mkdir(OUT_DIR, { recursive: true });
  const styles = loadPhotoStyles();

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
    const url = pollinationsUrl(prompt, refImage, seedFromId(style.id));
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
