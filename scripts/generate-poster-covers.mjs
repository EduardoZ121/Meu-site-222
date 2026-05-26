#!/usr/bin/env node
/**
 * Gera capas JPG para a grelha Posters Pro.
 * - Pessoas: ref_woman.jpg / ref_man.jpg (conforme template)
 * - Restaurante/comida: refs de prato em scripts/assets/
 * - Sem pessoa (ex. leão): só prompt, sem imagem de entrada
 *
 * Uso: node scripts/generate-poster-covers.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/poster-covers");
const ASSETS = path.join(ROOT, "scripts/assets");
const REF_WOMAN = path.join(ASSETS, "ref_woman.jpg");
const REF_MAN = path.join(ASSETS, "ref_man.jpg");

/** id → woman | man | dish | text */
const POSTER_INPUT = {
  music_street_energy: "woman",
  music_night_vibes: "man",
  music_chill_mode: "woman",
  music_stream_control: "man",
  music_street_chaos: "man",
  music_night_frequency: "man",
  music_night_frequency_2: "man",
  music_classic_drop: "man",
  music_gold_rush: "woman",
  music_new_single: "man",
  music_vol_02: "woman",
  music_club_night: "man",
  music_underground_drop: "man",
  music_sunset_sound: "woman",
  music_new_release: "man",
  food_restaurante_sabores_que_conectam: "dish:ref_food_rustic.jpg",
  food_sabor_qualidade: "dish:ref_food_bowl.jpg",
  food_burgers_artesanais: "dish:ref_food_burger.jpg",
  food_oriental: "dish:ref_food_sushi.jpg",
  food_experiencia_unica: "dish:ref_food_fine.jpg",
  fitness_beast_mode: "man",
  fitness_train_hard: "man",
  fitness_strong_life: "man",
  fitness_iron_club: "man",
  fitness_discipline: "man",
  fitness_fitness_zone: "man",
  motivational_discipline_today: "man",
  motivational_no_limits: "man",
  motivational_no_limit: "man",
  motivational_new_chance: "woman",
  motivational_mindset_power: "text",
  motivational_execute: "man",
  flyers_lorem_ipsum_dolor: "woman",
  flyers_lorem_ipsum: "man",
  flyers_lorem_ipsum_2: "man",
  flyers_lorem_ipsum_dolor_2: "man",
  flyers_lorem_ipsum_3: "woman",
  flyers_lorem_ipsum_dolor_sit_amet: "woman",
  flyers_raw_identity: "woman",
  flyers_modern_contrast: "woman",
  flyers_dark_focus: "man",
  flyers_street_impact: "man",
  flyers_editorial_frame: "woman",
  flyers_modern_structure: "man",
};

/** Replicate: ~6 req/min com crédito baixo — esperar entre chamadas. */
const REPLICATE_GAP_MS = 11000;

async function replicatePause() {
  await new Promise((r) => setTimeout(r, REPLICATE_GAP_MS));
}

const FOOD_REF_SEEDS = {
  "ref_food_rustic.jpg":
    "Ultra-realistic food photography, gourmet plated dish on dark cast-iron plate, rustic restaurant styling, steam, warm Edison bulb mood, 8k, appetizing, no people, no text",
  "ref_food_bowl.jpg":
    "Ultra-realistic food photography, fresh healthy bowl with greens and colorful toppings in white ceramic bowl on marble, bright natural light, 8k, appetizing, no people, no text",
  "ref_food_burger.jpg":
    "Ultra-realistic food photography, artisan gourmet burger on wooden cutting board, cinematic side light, juicy details, 8k, appetizing, no people, no text",
  "ref_food_sushi.jpg":
    "Ultra-realistic food photography, assorted sushi and sashimi on glossy dark plate with chopsticks, dramatic spotlight, 8k, appetizing, no people, no text",
  "ref_food_fine.jpg":
    "Ultra-realistic fine dining food photography, elegant gourmet plate with refined presentation, soft dramatic lighting, wine glass blur background, 8k, no people, no text",
};

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

function loadPosterTemplates() {
  const modPath = path.join(ROOT, "frontend/src/lib/posterFallbacks.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const start = src.indexOf("export const FALLBACK_POSTER_TEMPLATES = ");
  if (start < 0) throw new Error("FALLBACK_POSTER_TEMPLATES não encontrado");
  const slice = src.slice(start);
  const arrStart = slice.indexOf("[");
  const arrEnd = slice.indexOf("];\n\nexport const FALLBACK_POSTER_MODELS");
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

async function ensureFoodRefs() {
  await fs.mkdir(ASSETS, { recursive: true });
  for (const [filename, seedPrompt] of Object.entries(FOOD_REF_SEEDS)) {
    const dest = path.join(ASSETS, filename);
    try {
      await fs.access(dest);
      console.log(`  ref OK: ${filename}`);
      continue;
    } catch {
      /* generate */
    }
    console.log(`  a gerar ref comida: ${filename} …`);
    await replicatePause();
    const pred = await createPrediction({
      prompt: seedPrompt,
      aspect_ratio: "3:4",
      num_outputs: 1,
    });
    const done = await waitPrediction(pred.id);
    const url = firstUrl(done.output);
    if (!url) throw new Error(`Sem URL para ${filename}`);
    await download(url, dest);
    console.log(`  ✓ ${dest}`);
    await replicatePause();
  }
}

function resolveInputUri(kind) {
  if (kind === "woman") return fileToDataUri(REF_WOMAN);
  if (kind === "man") return fileToDataUri(REF_MAN);
  if (kind.startsWith("dish:")) {
    const file = kind.slice(5);
    return fileToDataUri(path.join(ASSETS, file));
  }
  return null;
}

async function main() {
  loadEnv();
  const templates = loadPosterTemplates();
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("A garantir refs de comida…");
  await ensureFoodRefs();
  console.log("");

  for (const tpl of templates) {
    const outFile = path.join(OUT_DIR, `${tpl.id}.jpg`);
    try {
      await fs.access(outFile);
      console.log(`→ ${tpl.id} (já existe, skip)`);
      continue;
    } catch {
      /* generate */
    }

    const kind = POSTER_INPUT[tpl.id];
    if (!kind) {
      console.warn(`Skip ${tpl.id}: sem entrada em POSTER_INPUT`);
      continue;
    }

    const aspect = tpl.aspect === "9:16" ? "9:16" : "3:4";
    console.log(`→ ${tpl.id} [${kind}] [${aspect}] …`);

    const input = {
      prompt: tpl.prompt,
      aspect_ratio: aspect,
      num_outputs: 1,
    };

    if (kind !== "text") {
      const uri = await resolveInputUri(kind);
      if (!uri) throw new Error(`${tpl.id}: ref inválida`);
      input.image = uri;
    }

    await replicatePause();
    const pred = await createPrediction(input);
    const done = await waitPrediction(pred.id);
    const url = firstUrl(done.output);
    if (!url) throw new Error(`${tpl.id}: sem URL`);
    await download(url, outFile);
    console.log(`  ✓ ${outFile}`);
    await replicatePause();
  }

  console.log("\nConcluído. Capas em frontend/public/images/poster-covers/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
