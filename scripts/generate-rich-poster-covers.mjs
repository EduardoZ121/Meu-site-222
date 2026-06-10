#!/usr/bin/env node
/**
 * Capas JPG para famílias rich (music, motivational, food, fashion, fitness).
 * node scripts/generate-rich-poster-covers.mjs
 * node scripts/generate-rich-poster-covers.mjs --force
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { REF_MAN_GITHUB, REF_WOMAN_GITHUB } from "./lib/artisticCoverGen.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const OUT_DIR = path.join(ROOT, "frontend/public/images/poster-covers");
const ASSETS = path.join(ROOT, "scripts/assets");
const MAP_FILE = path.join(ROOT, "frontend/src/lib/posterTemplateCovers.js");

const force = process.argv.includes("--force");
const REPLICATE_GAP_MS = 11000;

function loadEnv() {
  for (const name of [".env.vercel", ".env.local", ".env"]) {
    const envPath = path.join(ROOT, "..", name);
    const envPath2 = path.join(ROOT, name);
    for (const p of [envPath, envPath2]) {
      try {
        const raw = require("fs").readFileSync(p, "utf8");
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
}

function loadRichFamilies() {
  const modPath = path.join(ROOT, "frontend/src/lib/posterRichFamilies.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const start = src.indexOf("export const RICH_POSTER_FAMILIES = ");
  const slice = src.slice(start);
  const end = slice.indexOf("];\n\nexport function buildRichPosterTemplates");
  return new Function(`return ${slice.slice(slice.indexOf("["), end + 1)}`)();
}

function sampleCoverPrompt(raw, replacements = {}) {
  let out = String(raw || "");
  for (const [key, val] of Object.entries(replacements)) {
    const v = String(val || "").trim();
    if (v) out = out.split(`{{${key}}}`).join(v);
  }
  return out.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const k = key.trim();
    return String(replacements[k] || k.replace(/_/g, " ")).trim();
  });
}

function coverSubject(familyId, variantKey) {
  if (familyId === "food_signature") return "none";
  if (familyId === "fashion_editorial") return "woman";
  if (familyId === "fitness_gym") return "man";
  if (familyId === "motivational_impact") {
    return ["mindset_power", "new_chance", "rise_higher"].includes(variantKey) ? "woman" : "man";
  }
  if (familyId === "music_artist") {
    return ["chill_session", "vol_editorial"].includes(variantKey) ? "woman" : "man";
  }
  if (familyId === "music_nightlife") return "man";
  return "man";
}

async function ensureRef(subject) {
  if (subject === "none") return null;
  await fs.mkdir(ASSETS, { recursive: true });
  const file = subject === "woman" ? "ref_user_woman.jpg" : "ref_user_man.jpg";
  const dest = path.join(ASSETS, file);
  try {
    await fs.access(dest);
    return dest;
  } catch {
    /* download */
  }
  const url = subject === "woman" ? REF_WOMAN_GITHUB : REF_MAN_GITHUB;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Ref ${subject} download ${res.status}`);
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
 * Geradas por scripts/generate-poster-covers.mjs, generate-premium-poster-covers.mjs,
 * generate-extended-poster-covers.mjs e generate-rich-poster-covers.mjs
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

async function downloadCover(coverId, prompt, subject) {
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

  const input = {
    prompt: `${prompt}\n\nPoster grid preview cover, 4:5 vertical, premium print quality, readable typography layout.`,
    aspect_ratio: "3:4",
    num_outputs: 1,
  };

  if (subject !== "none") {
    const refPath = await ensureRef(subject);
    input.image = await fileToDataUri(refPath);
  }

  console.log(`→ ${coverId} [${subject}] …`);
  const pred = await createPrediction(input);
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
  const families = loadRichFamilies();
  const mapEntries = {};
  const jobs = [];

  for (const family of families) {
    let firstVariantCoverId = null;
    for (const variant of family.variants) {
      const coverId = `${family.id}__${variant.key}`;
      if (!firstVariantCoverId) firstVariantCoverId = coverId;
      jobs.push({
        coverId,
        prompt: sampleCoverPrompt(variant.prompt, variant.replacements),
        subject: coverSubject(family.id, variant.key),
      });
      mapEntries[coverId] = `/images/poster-covers/${coverId}.jpg`;
    }
    if (firstVariantCoverId) {
      mapEntries[family.id] = `/images/poster-covers/${firstVariantCoverId}.jpg`;
    }
  }

  console.log(`A gerar ${jobs.length} capas rich (Grok Imagine)…\n`);
  for (const job of jobs) {
    await downloadCover(job.coverId, job.prompt, job.subject);
  }

  await writeCoverMap(mapEntries);
  console.log("\nConcluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
