#!/usr/bin/env node
/**
 * Capas JPG para famílias IG (PDF Novos prompts) — grelha Posters.
 * node frontend/scripts/generate-pdf-poster-covers.mjs
 * node frontend/scripts/generate-pdf-poster-covers.mjs --force
 * node frontend/scripts/generate-pdf-poster-covers.mjs --only=ig_ref_cosmic_wave__classic
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
const ASSETS = path.join(ROOT, "scripts/assets");
const REF_WOMAN = path.join(ASSETS, "ref_woman.jpg");
const REF_MAN = path.join(ASSETS, "ref_man.jpg");
const REPLICATE_GAP_MS = 11000;

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
  return { force, only };
}

function sampleCoverPrompt(raw) {
  const samples = {
    MAIN_TITLE: "COSMIC WAVE",
    ARTIST_NAME: "ARTIST NAME",
    SUBTITLE: "NEW SINGLE",
    EVENT_INFO: "LIVE · 9PM",
    QUOTE: "Keep pushing forward.",
    BRAND_NAME: "PUTRA STORE",
    DISCOUNT: "50% OFF",
    CTA: "SHOP NOW",
    EVENT_DATE: "JUNE 2026",
    EVENT_INFO: "OPENING NIGHT",
    CHALLENGE_INFO: "30 DAY PROGRAM",
  };
  return String(raw).replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => samples[key] || key.replace(/_/g, " "));
}

function coverThumbPrompt(variant, familyId) {
  const base = sampleCoverPrompt(variant.prompt || "");
  const dual = variant.requiresDualPhoto
    ? " Show two distinct real people together in the composition (not clones)."
    : "";
  return `${base.slice(0, 850)}${dual} Vertical Instagram poster 4:5 grid thumbnail, professional marketing design, crisp legible typography, high quality, no watermark. Template ${familyId}/${variant.key}.`;
}

function inputKind(variant, family) {
  if (variant.requiresDualPhoto || family?.requiresDualPhoto) return "dual";
  const cat = String(family?.category || "").toLowerCase();
  if (cat === "fitness" || cat === "motivational") return "man";
  return "woman";
}

async function fileToDataUri(filePath) {
  const buf = require("fs").readFileSync(filePath);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
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
  try {
    return await replicateFetch("https://api.replicate.com/v1/models/xai/grok-imagine-image/predictions", {
      method: "POST",
      body: JSON.stringify({ input }),
    });
  } catch {
    const model = await replicateFetch("https://api.replicate.com/v1/models/xai/grok-imagine-image");
    const version = model?.latest_version?.id;
    if (!version) throw new Error("Grok model unavailable");
    return replicateFetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      body: JSON.stringify({ version, input }),
    });
  }
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
  if (buf.length < 8000) throw new Error("file too small");
  await fs.writeFile(dest, buf);
  return buf.length;
}

const REPO_RAW = "https://raw.githubusercontent.com/EduardoZ121/Meu-site-222/main/scripts/assets";

async function generatePollinations(id, prompt, refUrl) {
  const q = encodeURIComponent(prompt.slice(0, 700));
  const params = new URLSearchParams({
    width: "512",
    height: "640",
    model: "flux",
    nologo: "true",
    seed: String(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 99999),
    negative_prompt: "watermark, blurry, deformed, unreadable text",
  });
  if (refUrl) params.set("image", refUrl);
  const url = `https://image.pollinations.ai/prompt/${q}?${params.toString()}`;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 8000) throw new Error("invalid");
      return buf;
    } catch (e) {
      console.warn(`  pollinations ${i + 1}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
  return null;
}

function refUrl(kind) {
  if (kind === "man") return `${REPO_RAW}/ref_user_man.jpg`;
  return `${REPO_RAW}/ref_user_woman.jpg`;
}

async function resolveRef(kind) {
  if (kind === "man") return fileToDataUri(REF_MAN);
  return fileToDataUri(REF_WOMAN);
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

  const kind = inputKind(variant, family);
  const prompt = coverThumbPrompt(variant, familyId);
  console.log(`→ ${id} (${variant.title}) [${kind}]`);

  if (process.env.REPLICATE_API_TOKEN) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const input = { prompt, aspect_ratio: "3:4", num_outputs: 1 };
        const uri = await resolveRef(kind === "man" ? "man" : "woman");
        if (uri) input.image = uri;
        const pred = await createPrediction(input);
        const done = await waitPrediction(pred.id);
        const url = firstUrl(done.output);
        if (!url) throw new Error("no url");
        const bytes = await download(url, dest);
        console.log(`  ✓ ${bytes} bytes`);
        await new Promise((r) => setTimeout(r, REPLICATE_GAP_MS));
        return true;
      } catch (e) {
        console.warn(`  replicate ${attempt + 1}: ${e.message}`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  const buf = await generatePollinations(id, prompt, refUrl(kind === "man" ? "man" : "woman"));
  if (!buf) {
    console.error(`  ✗ ${id}`);
    return false;
  }
  await fs.writeFile(dest, buf);
  console.log(`  ✓ pollinations ${buf.length}b`);
  await new Promise((r) => setTimeout(r, 4500));
  return true;
}

async function syncCoversMap(entries) {
  let txt = await fs.readFile(COVERS_MAP, "utf8");
  const lines = [];
  for (const { id } of entries) {
    const rel = `/images/poster-covers/${id}.jpg`;
    if (txt.includes(`"${id}"`)) continue;
    lines.push(`  ${id}: "${rel}",`);
  }
  for (const familyId of [...new Set(entries.map((e) => e.familyId))]) {
    const first = entries.find((e) => e.familyId === familyId && e.variant.key === "classic")
      || entries.find((e) => e.familyId === familyId);
    if (!first || txt.includes(`"${familyId}"`)) continue;
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
  const { force, only } = parseArgs();
  const { PDF_RELEASE_FAMILIES } = await import(
    pathToFileURL(path.join(FRONTEND, "src/lib/posterPdfReleaseFamilies.js")).href
  );

  const entries = [];
  for (const family of PDF_RELEASE_FAMILIES) {
    for (const variant of family.variants || []) {
      const id = `${family.id}__${variant.key}`;
      if (only?.size && !only.has(id) && !only.has(family.id)) continue;
      entries.push({ id, familyId: family.id, variant, family });
    }
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`PDF IG poster covers — ${entries.length} variantes\n`);

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
