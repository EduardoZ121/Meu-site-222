#!/usr/bin/env node
/**
 * Regenera TODAS as capas da grelha Estúdio Artístico (exceto AI Lab / nsfw)
 * com google/nano-banana (Gemini) + foto ref mulher ou homem.
 *
 * Uso:
 *   node scripts/generate-artistic-covers-nano-banana.mjs --force
 *   node scripts/generate-artistic-covers-nano-banana.mjs --force --cat photography
 *   node scripts/generate-artistic-covers-nano-banana.mjs --force --only photo_classic_portrait,dig_anime
 *
 * Requer REPLICATE_API_TOKEN (.env.vercel ou .env.local)
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import {
  OUT_DIR,
  REF_WOMAN_GITHUB,
  REF_MAN_GITHUB,
} from "./lib/artisticCoverGen.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const NANO_BANANA = "google/nano-banana";
const GAP_MS = 9000;
const TEXT_ONLY = new Set([
  "dig_pixel_art",
  "dig_low_poly",
  "cls_mosaic",
  "mod_minimal",
  "mod_flat",
  "mod_brutalist",
]);

/** Estilos que ficam melhor com modelo masculino na capa. */
const MAN_STYLE_IDS = new Set([
  "photo_street",
  "photo_noir",
  "photo_cinematic",
  "photo_documentary",
  "photo_casual",
  "anime_shonen",
  "anime_mecha",
  "toon_pokemon_2d",
  "toon_pokemon_3d",
  "ill_comic",
  "ill_graphic_novel",
  "dig_cyberpunk",
  "dig_synthwave",
  "fan_dnd",
  "fan_steampunk",
  "fan_dark",
  "fan_gothic",
  "vin_pulp",
  "vin_1920s",
  "vin_vhs",
  "vin_retro_comic",
]);

function loadEnv() {
  for (const name of [".env.vercel", ".env.local", ".env"]) {
    const envPath = path.join(ROOT, name);
    try {
      const raw = require("fs").readFileSync(envPath, "utf8");
      raw.split("\n").forEach((line) => {
        const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
      });
    } catch {
      /* ignore */
    }
  }
}

function loadArtisticStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const marker = "export const ARTISTIC_STUDIO_STYLES = ";
  const slice = src.slice(src.indexOf(marker));
  const arrStart = slice.indexOf("[");
  const arrEndMatch = slice.match(/\];\r?\n\r?\nexport const ARTISTIC_EFFECT_SECTIONS/);
  if (arrStart < 0 || !arrEndMatch) throw new Error("ARTISTIC_STUDIO_STYLES não encontrado");
  const arrEnd = slice.indexOf(arrEndMatch[0]) + 1;
  return new Function(`return ${slice.slice(arrStart, arrEnd)}`)();
}

function parseArgs() {
  const force = process.argv.includes("--force");
  const catArg = process.argv.find((a) => a.startsWith("--cat="))?.slice(6)
    || (process.argv.includes("--cat") ? process.argv[process.argv.indexOf("--cat") + 1] : null);
  const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7)
    || (process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null);
  const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim()).filter(Boolean)) : null;
  return { force, cat: catArg || null, only };
}

function subjectForStyle(style, indexInCat) {
  if (TEXT_ONLY.has(style.id)) return null;
  if (MAN_STYLE_IDS.has(style.id)) return "man";
  if (indexInCat % 2 === 1) return "man";
  return "woman";
}

function refUrl(subject) {
  return subject === "man" ? REF_MAN_GITHUB : REF_WOMAN_GITHUB;
}

function buildPrompt(style, subject) {
  const label = style.labelEn || style.label || style.id;
  const direction = style.suffix || label;

  if (!subject) {
    return (
      `Create a premium vertical style preview thumbnail for an art filter named "${label}". `
      + `Visual direction: ${direction}. `
      + `Polished gallery card, 3:4 vertical composition, no text, no watermark, no logo, no borders.`
    );
  }

  const who = subject === "man" ? "man" : "woman";
  return (
    `Transform the ${who} in the reference photo into a premium style preview for the art filter "${label}". `
    + `Apply this visual direction: ${direction}. `
    + `Preserve exact face identity and likeness from the reference. `
    + `Centered head-and-shoulders portrait, professional gallery thumbnail, soft clean background. `
    + `No text, no watermark, no logo, no borders, no collage.`
  );
}

async function replicateFetch(url, options = {}) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN em falta (.env.vercel ou .env.local)");
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.error || `Replicate ${res.status}`);
  return data;
}

async function createPrediction(input) {
  return replicateFetch(`https://api.replicate.com/v1/models/${NANO_BANANA}/predictions`, {
    method: "POST",
    body: JSON.stringify({ input }),
  });
}

async function waitPrediction(id, maxSec = 180) {
  const t0 = Date.now();
  while ((Date.now() - t0) / 1000 < maxSec) {
    const p = await replicateFetch(`https://api.replicate.com/v1/predictions/${id}`);
    if (p.status === "succeeded") return p;
    if (p.status === "failed" || p.status === "canceled") {
      throw new Error(p.error || "Geração falhou");
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("Timeout");
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) throw new Error("ficheiro demasiado pequeno");
  await fs.writeFile(dest, buf);
  return buf.length;
}

async function generateOne(style, subject, { force }) {
  const dest = path.join(OUT_DIR, `${style.id}.jpg`);
  if (!force) {
    try {
      await fs.access(dest);
      console.log(`skip ${style.id}`);
      return true;
    } catch {
      /* generate */
    }
  }

  const prompt = buildPrompt(style, subject);
  const input = {
    prompt,
    aspect_ratio: "3:4",
    output_format: "jpg",
  };
  if (subject) {
    input.image_input = [refUrl(subject)];
  }

  console.log(`→ ${style.id} (${style.label}) ref=${subject || "text-only"}`);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const pred = await createPrediction(input);
      const done = await waitPrediction(pred.id);
      const bytes = await download(done.output, dest);
      console.log(`  ✓ ${bytes} bytes`);
      return true;
    } catch (e) {
      console.warn(`  tentativa ${attempt + 1} falhou: ${e.message}`);
      await new Promise((r) => setTimeout(r, 6000));
    }
  }
  console.error(`  ✗ ${style.id} falhou`);
  return false;
}

async function main() {
  loadEnv();
  const { force, cat, only } = parseArgs();
  await fs.mkdir(OUT_DIR, { recursive: true });

  let styles = loadArtisticStyles().filter((s) => s.cat !== "nsfw");
  if (cat) styles = styles.filter((s) => s.cat === cat);
  if (only?.size) styles = styles.filter((s) => only.has(s.id));

  const byCat = {};
  for (const s of styles) {
    byCat[s.cat] = byCat[s.cat] || [];
    byCat[s.cat].push(s);
  }

  console.log(`Nano Banana — ${styles.length} capas (force=${force})\n`);

  let ok = 0;
  let fail = 0;
  for (const [category, list] of Object.entries(byCat)) {
    console.log(`\n── ${category} (${list.length}) ──`);
    for (let i = 0; i < list.length; i++) {
      const style = list[i];
      const subject = subjectForStyle(style, i);
      const success = await generateOne(style, subject, { force });
      if (success) ok += 1;
      else fail += 1;
      await new Promise((r) => setTimeout(r, GAP_MS));
    }
  }

  console.log(`\nConcluído: ${ok} ok, ${fail} falhas → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
