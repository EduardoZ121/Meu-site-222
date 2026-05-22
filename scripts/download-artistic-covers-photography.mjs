#!/usr/bin/env node
/**
 * Capas JPG — categoria Fotografia (estilos em falta).
 * Uso: node scripts/download-artistic-covers-photography.mjs [--force]
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/artistic-covers");
const COVERS_JS = path.join(ROOT, "frontend/src/lib/artisticStyleCovers.js");
const FORCE = process.argv.includes("--force");
const DELAY_MS = 2500;

/** Prompt único por card — cenas e composições diferentes. */
const PREVIEW_PROMPT_BY_ID = {
  photo_street:
    "Street photography candid moment, man crossing rainy crosswalk with umbrella, neon reflections, urban grit, Henri Cartier-Bresson energy, no text",
  photo_fashion:
    "High fashion runway photograph, model in avant-garde white sculptural dress mid-stride, flash bulbs, black runway, Vogue energy, no text",
  photo_cinematic:
    "Cinematic widescreen film still, lone figure on cliff at golden hour, anamorphic letterbox mood, teal orange movie grade, epic drama, no text",
  photo_noir:
    "Film noir black and white, detective silhouette in fedora, venetian blind shadow stripes, cigarette smoke, 1940s mystery, no text",
  photo_hdr:
    "HDR landscape photography, dramatic mountain valley sunrise, extreme tonal range, vibrant clouds, hyper-detailed rocks and trees, no text",
  photo_casual:
    "Casual smartphone selfie aesthetic, young friends laughing at cafe table, warm indoor light, authentic social media vibe, no text",
};

function loadPhotoStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const slice = src.slice(src.indexOf("export const ARTISTIC_STUDIO_STYLES = "));
  const arrEnd = slice.indexOf("];\n\nexport const ARTISTIC_EFFECT_SECTIONS");
  return new Function(`return ${slice.slice(slice.indexOf("["), arrEnd + 1)}`)().filter(
    (s) => s.cat === "photography",
  );
}

function pollinationsUrl(prompt, seed) {
  const q = encodeURIComponent(`${prompt}. No text, no watermark, no logo.`);
  return `https://image.pollinations.ai/prompt/${q}?width=512&height=640&nologo=true&seed=${seed}`;
}

async function patchCoversJs(ids) {
  let src = await fs.readFile(COVERS_JS, "utf8");
  const marker = "  // —— Fotografia ——\n";
  const lines = ids.map((id) => `  ${id}: "/images/artistic-covers/${id}.jpg",`);
  if (!src.includes(marker)) {
    const block = `${marker}${lines.join("\n")}\n`;
    src = src.replace(
      /(photo_glamour: "\/images\/artistic-covers\/photo_glamour\.jpg",\n)/,
      `$1${block}`,
    );
  } else {
    for (const line of lines) {
      if (!src.includes(line.trim())) {
        src = src.replace(marker, `${marker}${line}\n`);
      }
    }
  }
  await fs.writeFile(COVERS_JS, src);
}

async function main() {
  const all = loadPhotoStyles();
  const styles = all.filter((s) => PREVIEW_PROMPT_BY_ID[s.id] || FORCE);
  const missing = all.filter((s) => !PREVIEW_PROMPT_BY_ID[s.id]);
  if (missing.length) {
    console.log("Já com capa (skip):", missing.map((s) => s.id).join(", "));
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const ok = [];

  for (const style of all) {
    const prompt = PREVIEW_PROMPT_BY_ID[style.id];
    if (!prompt) continue;

    const dest = path.join(OUT_DIR, `${style.id}.jpg`);
    if (!FORCE) {
      try {
        await fs.access(dest);
        console.log(`skip ${style.id}`);
        ok.push(style.id);
        continue;
      } catch {
        /* */
      }
    }

    const url = pollinationsUrl(prompt, style.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
    console.log(`→ ${style.id}`);
    let err;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 8000) throw new Error("too small");
        await fs.writeFile(dest, buf);
        ok.push(style.id);
        console.log(`  ✓ ${style.id}`);
        err = null;
        break;
      } catch (e) {
        err = e;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    if (err) console.error(`  ✗ ${style.id}:`, err.message);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  await patchCoversJs(ok.filter((id) => PREVIEW_PROMPT_BY_ID[id]));
  console.log(`\n${ok.length} capas fotografia`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
