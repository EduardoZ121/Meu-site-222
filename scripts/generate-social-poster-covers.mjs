#!/usr/bin/env node
/**
 * Gera capas JPG para famílias Marketing Social (Posters).
 * node scripts/generate-social-poster-covers.mjs
 * node scripts/generate-social-poster-covers.mjs --only=social_typo_hero__neon_box_hero
 * node scripts/generate-social-poster-covers.mjs --force
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/poster-covers");
const COVERS_MAP = path.join(ROOT, "frontend/src/lib/posterTemplateCovers.js");
const ASSETS = path.join(ROOT, "scripts/assets");
const REF_WOMAN = path.join(ASSETS, "ref_woman.jpg");
const REF_MAN = path.join(ASSETS, "ref_man.jpg");
const REF_PRODUCT = path.join(ASSETS, "ref_product_bottle.jpg");
const REPLICATE_GAP_MS = 11000;

function loadEnv() {
  for (const name of [".env.vercel", ".env.local", ".env"]) {
    try {
      const raw = require("fs").readFileSync(path.join(ROOT, name), "utf8");
      raw.split("\n").forEach((line) => {
        const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      });
    } catch { /* ignore */ }
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
    META_LABEL: "JUNE 2026",
    BRAND_NAME: "LOREM BRAND",
    CATEGORY_TAG: "Marketing",
    MAIN_TITLE: "LOREM IPSUM",
    HEADLINE: "LOREM HEADLINE",
    SUBTITLE: "Dolor sit amet",
    DESCRIPTION: "Lorem ipsum dolor sit amet.",
    CTA: "SHOP NOW",
    PRICE: "€49.99",
    PRODUCT_NAME: "LOREM PRODUCT",
    PROMO_TEXT: "-30% OFF",
    MODEL_NAME: "LOREM MODEL X",
    GAME_TITLE: "LOREM QUEST",
    CHANNEL_NAME: "LOREM CHANNEL",
    STREAM_TIME: "LIVE · 8PM",
    EPISODE_TITLE: "Episode 01",
  };
  return String(raw).replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => samples[key] || key.replace(/_/g, " "));
}

function coverThumbPrompt(variant, familyId) {
  const base = sampleCoverPrompt(variant.prompt || "");
  return `${base.slice(0, 900)}. Vertical Instagram poster 4:5 thumbnail preview, professional marketing design, crisp typography zones, high quality, no watermark. Style reference for template ${familyId}/${variant.key}.`;
}

function inputKind(variant) {
  if (variant.productTemplate) return "product";
  const p = String(variant.prompt || "").toLowerCase();
  if (/uploaded photo as the exact same product|product hero|packaging/.test(p)) return "product";
  if (/the man|his face|men's/.test(p)) return "man";
  return "woman";
}

async function fileToDataUri(filePath) {
  const buf = await require("fs").readFileSync(filePath);
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
}

async function generatePollinations(id, prompt, refUrl) {
  const q = encodeURIComponent(prompt.slice(0, 700));
  const params = new URLSearchParams({
    width: "512",
    height: "640",
    model: "flux",
    nologo: "true",
    seed: String(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 99999),
    negative_prompt: "watermark, blurry, deformed",
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

async function resolveRef(kind) {
  if (kind === "man") return fileToDataUri(REF_MAN);
  if (kind === "product") {
    try {
      await fs.access(REF_PRODUCT);
      return fileToDataUri(REF_PRODUCT);
    } catch {
      return null;
    }
  }
  return fileToDataUri(REF_WOMAN);
}

const REPO_RAW = "https://raw.githubusercontent.com/EduardoZ121/Meu-site-222/main/scripts/assets";
const REF_WOMAN_URL = `${REPO_RAW}/ref_user_woman.jpg`;
const REF_MAN_URL = `${REPO_RAW}/ref_user_man.jpg`;

function refUrl(kind) {
  if (kind === "man") return REF_MAN_URL;
  if (kind === "product") return null;
  return REF_WOMAN_URL;
}

async function generateOne(entry, { force }) {
  const { id, familyId, variant } = entry;
  const dest = path.join(OUT_DIR, `${id}.jpg`);
  if (!force) {
    try {
      await fs.access(dest);
      console.log(`skip ${id}`);
      return true;
    } catch { /* generate */ }
  }

  const kind = inputKind(variant);
  const prompt = coverThumbPrompt(variant, familyId);
  console.log(`→ ${id} [${kind}]`);

  if (process.env.REPLICATE_API_TOKEN) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const input = { prompt, aspect_ratio: "3:4", num_outputs: 1 };
        const uri = await resolveRef(kind);
        if (uri && kind !== "product") input.image = uri;
        const pred = await createPrediction(input);
        const done = await waitPrediction(pred.id);
        const url = firstUrl(done.output);
        if (!url) throw new Error("no url");
        await download(url, dest);
        console.log(`  ✓ replicate`);
        await new Promise((r) => setTimeout(r, REPLICATE_GAP_MS));
        return true;
      } catch (e) {
        console.warn(`  replicate ${attempt + 1}: ${e.message}`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  const buf = await generatePollinations(id, prompt, refUrl(kind));
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
    const first = entries.find((e) => e.familyId === familyId);
    if (!first || txt.includes(`"${familyId}"`)) continue;
    lines.push(`  ${familyId}: "/images/poster-covers/${first.id}.jpg",`);
  }
  if (!lines.length) return;
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
  const { SOCIAL_MARKETING_FAMILIES } = await import(
    pathToFileURL(path.join(ROOT, "frontend/src/lib/posterSocialMarketingFamilies.js")).href
  );

  const entries = [];
  for (const family of SOCIAL_MARKETING_FAMILIES) {
    for (const variant of family.variants || []) {
      const id = `${family.id}__${variant.key}`;
      if (only?.size && !only.has(id) && !only.has(family.id)) continue;
      entries.push({ id, familyId: family.id, variant });
    }
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Social poster covers — ${entries.length} variantes\n`);

  let ok = 0;
  let fail = 0;
  for (const entry of entries) {
    const success = await generateOne(entry, { force });
    if (success) ok += 1;
    else fail += 1;
  }

  await syncCoversMap(entries);
  console.log(`\nConcluído: ${ok} ok, ${fail} falhas`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
