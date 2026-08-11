#!/usr/bin/env node
/**
 * Capas JPG para famílias IG (PDF Novos prompts) — grelha Posters.
 * Modelo: google/nano-banana + refs realistas (como Personalizar / restaurante).
 *
 * node frontend/scripts/generate-pdf-poster-covers.mjs --force
 * node frontend/scripts/generate-pdf-poster-covers.mjs --force --only=ig_ref_cosmic_wave
 * node frontend/scripts/generate-pdf-poster-covers.mjs --force --offset=20 --limit=10
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
const NANO_BANANA = "google/nano-banana";
const GAP_MS = 9000;
const REPO_RAW = "https://raw.githubusercontent.com/EduardoZ121/Meu-site-222/main/scripts/assets";
const REF_WOMAN_URL = `${REPO_RAW}/ref_user_woman.jpg`;
const REF_MAN_URL = `${REPO_RAW}/ref_user_man.jpg`;

const REALISM_BLOCK =
  "Ultra-realistic photorealistic commercial poster, cinematic lighting, natural human skin texture, realistic AI person (not cartoon, not 3D render). Edit reference identity in-place like professional retouching: preserve exact face, bone structure, skin tone and ethnicity. Crisp legible typography on layout layers — headlines in negative space, never covering the face. Premium quality like high-end restaurant marketing flyers: 8K, sharp focus, professional print design.";

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
        /* ignore */
      }
    }
  }
}

function parseArgs() {
  const force = process.argv.includes("--force");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7)
    || (process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null);
  const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim()).filter(Boolean)) : null;
  const limitArg = process.argv.find((a) => a.startsWith("--limit="))?.slice(8);
  const offsetArg = process.argv.find((a) => a.startsWith("--offset="))?.slice(9);
  const limit = limitArg ? Math.max(1, Number(limitArg) || 0) : null;
  const offset = offsetArg ? Math.max(0, Number(offsetArg) || 0) : 0;
  return { force, only, limit, offset };
}

function sampleCoverPrompt(raw, replacements = {}) {
  const samples = {
    MAIN_TITLE: "TITLE",
    ARTIST_NAME: "ARTIST NAME",
    SUBTITLE: "NEW SINGLE",
    EVENT_INFO: "LIVE · 9PM",
    QUOTE: "Keep pushing forward.",
    BRAND_NAME: "PUTRA STORE",
    DISCOUNT: "50% OFF",
    CTA: "SHOP NOW",
    EVENT_DATE: "JUNE 2026",
    CHALLENGE_INFO: "30 DAY PROGRAM",
    SALE_INFO: "LIMITED TIME",
    EXHIBITION_INFO: "OPENING NIGHT",
    ...replacements,
  };
  return String(raw).replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => samples[key] || key.replace(/_/g, " "));
}

function coverThumbPrompt(variant, familyId) {
  const base = sampleCoverPrompt(variant.prompt || "", variant.replacements || {});
  const dual = variant.requiresDualPhoto
    ? " Two distinct real people in the composition (woman and man), natural poses, not clones."
    : "";
  return `${REALISM_BLOCK}${dual}\n\n${base}\n\nVertical Instagram poster 4:5 grid thumbnail. Template ${familyId}/${variant.key}. No watermark.`;
}

function inputKind(variant, family) {
  if (variant.requiresDualPhoto || family?.requiresDualPhoto) return "dual";
  const cat = String(family?.category || "").toLowerCase();
  if (cat === "fitness" || cat === "motivational") return "man";
  return "woman";
}

function imageInputForKind(kind) {
  if (kind === "dual") return [REF_WOMAN_URL, REF_MAN_URL];
  if (kind === "man") return [REF_MAN_URL];
  return [REF_WOMAN_URL];
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
    const p = await replicateFetch(`https://api.replicate.com/v1/predictions/${id}`);
    if (p.status === "succeeded") return p;
    if (p.status === "failed" || p.status === "canceled") throw new Error(p.error || "failed");
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

async function generateOne(entry, { force }) {
  const { id, familyId, variant, family } = entry;
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
    console.error(`  ✗ ${id} — REPLICATE_API_TOKEN em falta`);
    return false;
  }

  const kind = inputKind(variant, family);
  const prompt = coverThumbPrompt(variant, familyId);
  console.log(`→ ${id} (${variant.title}) [${kind}] nano-banana`);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const pred = await createPrediction({
        prompt,
        aspect_ratio: "4:5",
        output_format: "jpg",
        image_input: imageInputForKind(kind),
      });
      const done = await waitPrediction(pred.id);
      const url = outputUrl(done.output);
      if (!url) throw new Error("no url");
      const bytes = await download(url, dest);
      console.log(`  ✓ ${bytes} bytes`);
      await new Promise((r) => setTimeout(r, GAP_MS));
      return true;
    } catch (e) {
      console.warn(`  tentativa ${attempt + 1}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 6000));
    }
  }

  console.error(`  ✗ ${id}`);
  return false;
}

async function syncCoversMap(entries) {
  let txt = await fs.readFile(COVERS_MAP, "utf8");
  const lines = [];
  for (const { id } of entries) {
    const rel = `/images/poster-covers/${id}.jpg`;
    if (new RegExp(`"${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*:`).test(txt)) continue;
    lines.push(`  ${id}: "${rel}",`);
  }
  for (const familyId of [...new Set(entries.map((e) => e.familyId))]) {
    const first = entries.find((e) => e.familyId === familyId && e.variant.key === "classic")
      || entries.find((e) => e.familyId === familyId);
    if (!first || new RegExp(`"${familyId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*:`).test(txt)) continue;
    lines.push(`  ${familyId}: "/images/poster-covers/${first.id}.jpg",`);
  }
  if (!lines.length) {
    console.log("\nposterTemplateCovers.js já tem todas as entradas ig_ref");
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
  const { force, only, limit, offset } = parseArgs();
  const { PDF_RELEASE_FAMILIES } = await import(
    pathToFileURL(path.join(FRONTEND, "src/lib/posterPdfReleaseFamilies.js")).href
  );

  let entries = [];
  for (const family of PDF_RELEASE_FAMILIES) {
    for (const variant of family.variants || []) {
      const id = `${family.id}__${variant.key}`;
      if (only?.size && !only.has(id) && !only.has(family.id)) continue;
      entries.push({ id, familyId: family.id, variant, family });
    }
  }

  if (offset) entries = entries.slice(offset);
  if (limit) entries = entries.slice(0, limit);

  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`PDF IG poster covers (nano-banana) — ${entries.length} variantes (force=${force})\n`);

  let ok = 0;
  let fail = 0;
  for (const entry of entries) {
    const success = await generateOne(entry, { force });
    if (success) ok += 1;
    else fail += 1;
  }

  await syncCoversMap(entries);
  console.log(`\nConcluído: ${ok} ok, ${fail} falhas → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
