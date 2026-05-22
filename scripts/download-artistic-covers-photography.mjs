#!/usr/bin/env node
/**
 * Capas Fotografia — fotos profissionais (Unsplash), alinhadas ao estilo.
 * Evita IA distorcida do Pollinations para previews de card.
 *
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
const FORCE = process.argv.includes("--force");

/** Fotos reais Unsplash — composição profissional por estilo. */
const UNSPLASH_BY_ID = {
  photo_street: "photo-1449824913935-59a10b8d2000",
  photo_fashion: "photo-1515886657613-9f3515b0c78f",
  photo_cinematic: "photo-1506905925346-21bda4d32df4",
  photo_noir: "photo-1519682337058-a94d519337bc",
  photo_hdr: "photo-1464822759023-fed622ff2c3b",
  photo_casual: "photo-1529156069898-49953e39b3ac",
};

function unsplashUrl(photoId) {
  return `https://images.unsplash.com/${photoId}?w=640&h=800&fit=crop&q=92&auto=format`;
}

function loadPhotoStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const slice = src.slice(src.indexOf("export const ARTISTIC_STUDIO_STYLES = "));
  const arrEnd = slice.indexOf("];\n\nexport const ARTISTIC_EFFECT_SECTIONS");
  return new Function(`return ${slice.slice(slice.indexOf("["), arrEnd + 1)}`)().filter(
    (s) => s.cat === "photography" && UNSPLASH_BY_ID[s.id],
  );
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const styles = loadPhotoStyles();

  for (const style of styles) {
    const dest = path.join(OUT_DIR, `${style.id}.jpg`);
    if (!FORCE) {
      try {
        await fs.access(dest);
        const stat = await fs.stat(dest);
        if (stat.size > 50000) {
          console.log(`skip ${style.id} (já existe)`);
          continue;
        }
      } catch {
        /* */
      }
    }
    const url = unsplashUrl(UNSPLASH_BY_ID[style.id]);
    console.log(`→ ${style.id} (${style.label})`);
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`${style.id}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 15000) throw new Error(`${style.id}: ficheiro inválido`);
    await fs.writeFile(dest, buf);
    console.log(`  ✓ ${buf.length} bytes`);
  }
  console.log("\nCapas fotografia atualizadas (Unsplash).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
