#!/usr/bin/env node
/**
 * Capas JPG para a grelha do Estúdio Artístico (24 estilos).
 *
 * Uso: node scripts/generate-artistic-covers.mjs
 * Requer REPLICATE_API_TOKEN em .env.local
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/artistic-covers");
const REF_WOMAN = path.join(ROOT, "scripts/assets/ref_woman.jpg");
const REPLICATE_GAP_MS = 11000;

/** Estilos sem foto de referência (só texto). */
const TEXT_ONLY = new Set([
  "dig_pixel_art",
  "dig_low_poly",
  "cls_mosaic",
  "mod_minimal",
  "mod_flat",
  "mod_brutalist",
]);

function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
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

function loadArtisticStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const start = src.indexOf("export const ARTISTIC_STUDIO_STYLES = ");
  if (start < 0) throw new Error("ARTISTIC_STUDIO_STYLES não encontrado");
  const slice = src.slice(start);
  const arrStart = slice.indexOf("[");
  const arrEnd = slice.indexOf("];\n\nexport const ARTISTIC_EFFECT_SECTIONS");
  const jsonish = slice.slice(arrStart, arrEnd + 1);
  return new Function(`return ${jsonish}`)();
}

async function fileToDataUri(filePath) {
  const buf = await fs.readFile(filePath);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function replicateFetch(url, options = {}) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN em falta (.env.local)");
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.error || `Replicate ${res.status}`);
  }
  return data;
}

async function createPrediction(input) {
  const body = { input };
  try {
    return await replicateFetch("https://api.replicate.com/v1/models/xai/grok-imagine-image/predictions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (e) {
    const model = await replicateFetch("https://api.replicate.com/v1/models/xai/grok-imagine-image");
    const version = model?.latest_version?.id;
    if (!version) throw e;
    return await replicateFetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      body: JSON.stringify({ version, input }),
    });
  }
}

async function waitPrediction(id, maxSec = 240) {
  const t0 = Date.now();
  while ((Date.now() - t0) / 1000 < maxSec) {
    // eslint-disable-next-line no-await-in-loop
    const p = await replicateFetch(`https://api.replicate.com/v1/predictions/${id}`);
    if (p.status === "succeeded") return p;
    if (p.status === "failed" || p.status === "canceled") {
      throw new Error(p.error || "Geração falhou");
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("Timeout");
}

function firstUrl(output) {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output[0];
  return null;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
}

function buildPrompt(style) {
  const base = `Premium style preview card, single striking composition demonstrating "${style.label}". ${style.suffix}. No text, no watermark, no logo, high quality.`;
  if (TEXT_ONLY.has(style.id)) return base;
  return `The woman as subject. ${base}`;
}

async function main() {
  loadEnv();
  const styles = loadArtisticStyles();
  await fs.mkdir(OUT_DIR, { recursive: true });

  let imageUri = null;
  try {
    imageUri = await fileToDataUri(REF_WOMAN);
    console.log("Referência: ref_woman.jpg (estilos com foto)\n");
  } catch {
    console.warn("ref_woman.jpg em falta — só modos texto");
  }

  for (const style of styles) {
    const outFile = path.join(OUT_DIR, `${style.id}.jpg`);
    try {
      await fs.access(outFile);
      console.log(`→ ${style.id} (já existe, skip)`);
      continue;
    } catch {
      /* generate */
    }

    const prompt = buildPrompt(style);
    const input = {
      prompt,
      aspect_ratio: "3:4",
      num_outputs: 1,
    };
    if (!TEXT_ONLY.has(style.id) && imageUri) {
      input.image = imageUri;
    }

    console.log(`→ ${style.id} (${style.label}) …`);
    const pred = await createPrediction(input);
    const done = await waitPrediction(pred.id);
    const url = firstUrl(done.output);
    if (!url) throw new Error(`${style.id}: sem URL`);
    await download(url, outFile);
    console.log(`  ✓ ${outFile}`);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, REPLICATE_GAP_MS));
  }

  console.log("\nConcluído. Mapa em frontend/src/lib/artisticStyleCovers.js");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
