#!/usr/bin/env node
/**
 * Capas JPG para Tia Any Fast Food — grelha Posters.
 * Modelo: google/nano-banana com logo + uniforme oficiais como referências.
 *
 * node frontend/scripts/generate-tia-any-poster-covers.mjs --force
 * node frontend/scripts/generate-tia-any-poster-covers.mjs --only=tia_any_fast_food__hero_food_explosion
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, "..");
const ROOT = path.resolve(FRONTEND, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(FRONTEND, "public/images/poster-covers");
const COVERS_MAP = path.join(FRONTEND, "src/lib/posterTemplateCovers.js");
const LOGO_PATH = path.join(FRONTEND, "public/images/brands/tia-any/logo.png");
const UNIFORM_PATH = path.join(FRONTEND, "public/images/brands/tia-any/uniform.png");
const NANO_BANANA = "google/nano-banana";
const GAP_MS = 9000;

const COVER_REALISM = [
  "Professional premium fast-food advertising poster cover for a template gallery.",
  "Use the official Tia Any Fast Food logo reference and official black polo uniform reference accurately.",
  "Orange, black, white and warm golden food photography palette.",
  "Commercial restaurant marketing, ultra-realistic food textures, cinematic warm lighting, sharp details.",
  "Crisp readable typography in clean layout zones, premium agency flyer, 8K print-ready look.",
  "No QR code, no watermark, no AI signature, no random logos, no unrelated branding.",
].join(" ");

function loadEnv() {
  for (const base of [FRONTEND, ROOT]) {
    for (const name of [".env.local", ".env.vercel", ".env"]) {
      try {
        const raw = require("fs").readFileSync(path.join(base, name), "utf8");
        raw.split("\n").forEach((line) => {
          const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
          if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        });
      } catch {
        /* ignore missing env files */
      }
    }
  }
}

function parseArgs() {
  const force = process.argv.includes("--force");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7)
    || (process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null);
  const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim()).filter(Boolean)) : null;
  return { force, only };
}

async function fileToDataUri(filePath, mime = "image/png") {
  const buf = await fs.readFile(filePath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function samplePrompt(raw, replacements = {}) {
  const samples = {
    MAIN_TITLE: "SABOR QUE VICIA!",
    SUBTITLE: "Premium fast food feito na hora.",
    CTA_TEXT: "PEÇA JÁ",
    PHONE: "+244 900 000 000",
    INSTAGRAM: "@tiaanyfastfood",
    PRICE: "2.500 Kz",
    FEATURE_1: "Carne Premium",
    FEATURE_2: "Ingredientes Frescos",
    FEATURE_3: "Preparado na Hora",
    BADGE_TEXT: "100% ARTESANAL",
    BACKGROUND_WORD: "BURGER",
    BRUSH_TITLE: "PERFEITO",
    PROMO_BADGE: "SUPER OFERTA",
    EVENT_TITLE: "KARAOKÊ + JANTAR",
    DISCOUNT: "OFERTA",
    STEP_1: "Escolha o prato",
    STEP_2: "Faça o pedido",
    STEP_3: "Receba e aproveite",
    ...replacements,
  };
  return String(raw).replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => samples[key] || key.replace(/_/g, " "));
}

function coverPrompt(variant, familyId) {
  const prompt = samplePrompt(variant.prompt || "", variant.replacements || {});
  return `${COVER_REALISM}

Create a polished gallery cover image for this Tia Any style. It must look like a finished professional poster preview, not a mockup and not a rough concept.

${prompt}

Vertical Instagram poster 4:5 thumbnail. Template ${familyId}/${variant.key}.`;
}

async function replicateFetch(url, options = {}) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN em falta");
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

async function waitPrediction(id, maxSec = 240) {
  const t0 = Date.now();
  while ((Date.now() - t0) / 1000 < maxSec) {
    const prediction = await replicateFetch(`https://api.replicate.com/v1/predictions/${id}`);
    if (prediction.status === "succeeded") return prediction;
    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(prediction.error || prediction.status);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("Timeout");
}

function outputUrl(output) {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output[0];
  return null;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 12000) throw new Error("file too small");
  await fs.writeFile(dest, buf);
  return buf.length;
}

async function generateOne(entry, refs, { force }) {
  const { id, familyId, variant } = entry;
  const dest = path.join(OUT_DIR, `${id}.jpg`);
  if (!force) {
    try {
      await fs.access(dest);
      console.log(`skip ${id}`);
      return true;
    } catch {
      /* generate */
    }
  }
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error(`  x ${id} — REPLICATE_API_TOKEN em falta`);
    return false;
  }

  console.log(`-> ${id} (${variant.title}) nano-banana`);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const pred = await createPrediction({
        prompt: coverPrompt(variant, familyId),
        aspect_ratio: "4:5",
        output_format: "jpg",
        image_input: refs,
      });
      const done = await waitPrediction(pred.id);
      const url = outputUrl(done.output);
      if (!url) throw new Error("no url");
      const bytes = await download(url, dest);
      console.log(`  ok ${bytes} bytes`);
      await new Promise((r) => setTimeout(r, GAP_MS));
      return true;
    } catch (err) {
      console.warn(`  tentativa ${attempt + 1}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 6000));
    }
  }
  console.error(`  x ${id}`);
  return false;
}

async function syncCoversMap(entries) {
  let txt = await fs.readFile(COVERS_MAP, "utf8");
  const lines = [];
  const hasCoverKey = (key) => {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:["']${escaped}["']|${escaped})\\s*:`).test(txt);
  };
  for (const { id } of entries) {
    const rel = `/images/poster-covers/${id}.jpg`;
    if (hasCoverKey(id)) continue;
    lines.push(`  ${id}: "${rel}",`);
  }
  for (const familyId of [...new Set(entries.map((e) => e.familyId))]) {
    const first = entries.find((e) => e.familyId === familyId);
    if (!first || hasCoverKey(familyId)) continue;
    lines.push(`  ${familyId}: "/images/poster-covers/${first.id}.jpg",`);
  }
  if (!lines.length) {
    console.log("\nposterTemplateCovers.js já tem todas as entradas Tia Any");
    return;
  }
  txt = txt.replace(
    "export const POSTER_TEMPLATE_COVER_BY_ID = {",
    `export const POSTER_TEMPLATE_COVER_BY_ID = {\n${lines.join("\n")}`,
  );
  await fs.writeFile(COVERS_MAP, txt);
  console.log(`\nAtualizado posterTemplateCovers.js (+${lines.length} entradas)`);
}

async function main() {
  loadEnv();
  const { force, only } = parseArgs();
  const { TIA_ANY_POSTER_FAMILIES } = await import(
    pathToFileURL(path.join(FRONTEND, "src/lib/posterTiaAnyFamilies.js")).href
  );

  const refs = [
    await fileToDataUri(LOGO_PATH, "image/png"),
    await fileToDataUri(UNIFORM_PATH, "image/png"),
  ];

  const entries = [];
  for (const family of TIA_ANY_POSTER_FAMILIES) {
    for (const variant of family.variants || []) {
      const id = `${family.id}__${variant.key}`;
      if (only?.size && !only.has(id) && !only.has(family.id)) continue;
      entries.push({ id, familyId: family.id, variant, family });
    }
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Tia Any poster covers (nano-banana) — ${entries.length} variantes (force=${force})\n`);

  let ok = 0;
  let fail = 0;
  for (const entry of entries) {
    const success = await generateOne(entry, refs, { force });
    if (success) ok += 1;
    else fail += 1;
  }

  await syncCoversMap(entries);
  console.log(`\nConcluído: ${ok} ok, ${fail} falhas -> ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
