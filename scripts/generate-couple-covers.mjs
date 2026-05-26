#!/usr/bin/env node
/**
 * Gera capas JPG para a grelha Casais (Personalizar / Estúdio).
 * Compõe ref mulher (esq.) + ref homem (dir.) e envia ao Grok com prompt de casal.
 *
 * Uso: node scripts/generate-couple-covers.mjs
 * Requer: REPLICATE_API_TOKEN em .env.local, sharp (npm i -D sharp)
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/padrao-covers");
const REF_WOMAN = path.join(ROOT, "scripts/assets/ref_woman.jpg");
const REF_MAN = path.join(ROOT, "scripts/assets/ref_man.jpg");

const COUPLE_IDS = ["co_polaroid_classic", "co_polaroid_romantic", "co_polaroid_playful"];

const COUPLE_PREFIX = [
  "The provided image is ONE photo with TWO people side-by-side:",
  "LEFT panel = the woman.",
  "RIGHT panel = the man.",
  "Create a single Polaroid-style photo of BOTH people together (not two separate panels).",
  "Preserve both faces, identities, skin tones, and natural proportions exactly.",
].join(" ");

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

function loadCoupleStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/publicFallbacks.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const start = src.indexOf("export const FALLBACK_PADRAO_STYLES = ");
  if (start < 0) throw new Error("FALLBACK_PADRAO_STYLES não encontrado");
  const slice = src.slice(start);
  const arrStart = slice.indexOf("[");
  const arrEnd = slice.indexOf("];\n\nexport const FALLBACK_PADRAO_GROUPS");
  const jsonish = slice.slice(arrStart, arrEnd + 1);
  const styles = new Function(`return ${jsonish}`)();
  return Object.fromEntries(styles.filter((s) => s.cat === "couple").map((s) => [s.id, s]));
}

function buildCouplePrompt(stylePrompt) {
  const subject = "the woman on the LEFT";
  const other = "the man on the RIGHT";
  let p = stylePrompt.replace(/\[subject\]/gi, subject);
  p = p.replace(/\bthe other person\b/gi, other);
  return `${COUPLE_PREFIX} ${p}`;
}

/** Mulher à esquerda, homem à direita — alinhado com ClothesChanger / prompts couple. */
async function composeCoupleRef(leftPath, rightPath, opts = {}) {
  const targetH = opts.targetHeight || 1024;
  const gap = opts.gap ?? 24;

  const leftMeta = await sharp(leftPath).metadata();
  const rightMeta = await sharp(rightPath).metadata();

  const lw = Math.max(1, Math.round(leftMeta.width * (targetH / Math.max(1, leftMeta.height))));
  const rw = Math.max(1, Math.round(rightMeta.width * (targetH / Math.max(1, rightMeta.height))));
  const width = lw + gap + rw;

  const leftBuf = await sharp(leftPath).resize(lw, targetH, { fit: "cover" }).jpeg({ quality: 92 }).toBuffer();
  const rightBuf = await sharp(rightPath).resize(rw, targetH, { fit: "cover" }).jpeg({ quality: 92 }).toBuffer();

  const canvas = sharp({
    create: {
      width,
      height: targetH,
      channels: 3,
      background: { r: 15, g: 15, b: 15 },
    },
  });

  const composed = await canvas
    .composite([
      { input: leftBuf, left: 0, top: 0 },
      { input: rightBuf, left: lw + gap, top: 0 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  return `data:image/jpeg;base64,${composed.toString("base64")}`;
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

async function waitPrediction(id, maxSec = 180) {
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

async function main() {
  loadEnv();
  const styles = loadCoupleStyles();
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("A compor referência casal (mulher | homem)…");
  const imageUri = await composeCoupleRef(REF_WOMAN, REF_MAN);

  for (const id of COUPLE_IDS) {
    const style = styles[id];
    if (!style) {
      console.warn(`Skip ${id}: estilo não encontrado`);
      continue;
    }
    const prompt = buildCouplePrompt(style.prompt);
    const outFile = path.join(OUT_DIR, `${id}.jpg`);

    console.log(`\n→ ${id} …`);
    const pred = await createPrediction({
      prompt,
      image: imageUri,
      aspect_ratio: "3:4",
      num_outputs: 1,
    });
    const done = await waitPrediction(pred.id);
    const url = firstUrl(done.output);
    if (!url) throw new Error(`${id}: sem URL`);
    await download(url, outFile);
    console.log(`  ✓ ${outFile}`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\nConcluído. Entradas co_* em padraoStyleCovers.js.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
