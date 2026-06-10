#!/usr/bin/env node
/**
 * Capas JPG para os 2 posters Fashion (templates separados).
 * node scripts/generate-fashion-poster-covers.mjs
 * node scripts/generate-fashion-poster-covers.mjs --force
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";
import { REF_WOMAN_GITHUB } from "./lib/artisticCoverGen.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const OUT_DIR = path.join(ROOT, "frontend/public/images/poster-covers");
const ASSETS = path.join(ROOT, "scripts/assets");
const MAP_FILE = path.join(ROOT, "frontend/src/lib/posterTemplateCovers.js");

const force = process.argv.includes("--force");
const REPLICATE_GAP_MS = 11000;

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
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

async function loadFashionTemplates() {
  const modPath = path.join(ROOT, "frontend/src/lib/posterFashionFamilies.js");
  const mod = await import(pathToFileURL(modPath).href);
  return mod.FASHION_POSTER_TEMPLATES || [];
}

async function ensureRefWoman() {
  await fs.mkdir(ASSETS, { recursive: true });
  const dest = path.join(ASSETS, "ref_user_woman.jpg");
  try {
    await fs.access(dest);
    return dest;
  } catch {
    /* download */
  }
  const res = await fetch(REF_WOMAN_GITHUB);
  if (!res.ok) throw new Error(`Ref woman download ${res.status}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

async function fileToDataUri(filePath) {
  const buf = await fs.readFile(filePath);
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
    const p = await replicateFetch(`https://api.replicate.com/v1/predictions/${id}`);
    if (p.status === "succeeded") return p;
    if (p.status === "failed" || p.status === "canceled") throw new Error(p.error || "Geração falhou");
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
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function writeCoverMap(newEntries) {
  let existing = {};
  try {
    const src = require("fs").readFileSync(MAP_FILE, "utf8");
    const m = src.match(/export const POSTER_TEMPLATE_COVER_BY_ID = (\{[\s\S]*?\n\});/);
    if (m) existing = new Function(`return ${m[1]}`)();
  } catch {
    /* fresh */
  }

  const merged = { ...existing, ...newEntries };
  const lines = Object.entries(merged)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, url]) => `  ${id}: "${url}",`)
    .join("\n");

  const out = `/**
 * Capas estáticas para a grelha Posters Pro.
 * Geradas por scripts/generate-poster-covers.mjs, generate-premium-poster-covers.mjs, generate-extended-poster-covers.mjs e generate-fashion-poster-covers.mjs
 */
export const POSTER_TEMPLATE_COVER_BY_ID = {
${lines}
};

export function posterCoverSrc(id) {
  if (!id) return "";
  return POSTER_TEMPLATE_COVER_BY_ID[id] || "";
}
`;
  await fs.writeFile(MAP_FILE, out, "utf8");
}

async function downloadCover(coverId, prompt) {
  const dest = path.join(OUT_DIR, `${coverId}.jpg`);
  if (!force) {
    try {
      await fs.access(dest);
      console.log(`skip ${coverId}`);
      return dest;
    } catch {
      /* generate */
    }
  }

  const refPath = await ensureRefWoman();
  const image = await fileToDataUri(refPath);
  console.log(`→ ${coverId} …`);

  const pred = await createPrediction({
    prompt: `${prompt}\n\nPoster grid preview cover, 4:5 vertical, premium print quality, readable typography layout.`,
    aspect_ratio: "3:4",
    num_outputs: 1,
    image,
  });
  const done = await waitPrediction(pred.id);
  const url = firstUrl(done.output);
  if (!url) throw new Error(`${coverId}: sem URL`);
  await download(url, dest);
  console.log(`  ✓ ${dest}`);
  await new Promise((r) => setTimeout(r, REPLICATE_GAP_MS));
  return dest;
}

async function main() {
  loadEnv();
  await fs.mkdir(OUT_DIR, { recursive: true });
  const templates = await loadFashionTemplates();
  const mapEntries = {};
  const jobs = templates.map((tpl) => {
    mapEntries[tpl.id] = `/images/poster-covers/${tpl.id}.jpg`;
    return { coverId: tpl.id, prompt: tpl.prompt };
  });

  console.log(`A gerar ${jobs.length} capas Fashion (Grok Imagine)…\n`);
  for (const job of jobs) {
    await downloadCover(job.coverId, job.prompt);
  }

  await writeCoverMap(mapEntries);
  console.log("\nConcluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
