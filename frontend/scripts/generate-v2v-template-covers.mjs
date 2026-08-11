#!/usr/bin/env node
/**
 * Capas 4:3 para templates Vídeo para vídeo — public/images/tools/video/v2v/{id}.jpg
 *
 * Uso:
 *   node frontend/scripts/generate-v2v-template-covers.mjs
 *   node frontend/scripts/generate-v2v-template-covers.mjs --force --only=medusa,iceman
 *
 * Requer REPLICATE_API_TOKEN (.env.local na raiz ou frontend/)
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const require = createRequire(import.meta.url);
const OUT_DIR = path.resolve(__dirname, "../public/images/tools/video/v2v");
const GAP_MS = 9000;
const REPO_RAW = "https://raw.githubusercontent.com/EduardoZ121/Meu-site-222/main/scripts/assets";
const REF_WOMAN = `${REPO_RAW}/ref_user_woman.jpg`;

/** Cenas sem pessoa — só prompt. */
const TEXT_ONLY = new Set([
  "bg-studio",
  "bg-beach",
  "bg-snow",
  "bg-forest",
  "bg-cyber",
  "bg-space",
  "hellfire-vehicle",
  "pineapple",
  "restyle-cinematic",
  "restyle-anime",
  "restyle-oil",
  "restyle-8mm",
  "restyle-comic",
]);

const THUMBS = {
  "bg-studio": "Minimal white photography studio, soft diffused light, empty clean floor, cinematic 4:3 thumbnail",
  "bg-beach": "Tropical beach golden hour, turquoise ocean, warm sunset sky, cinematic empty scene 4:3",
  "bg-snow": "Snowy city street at night, bokeh lights, falling snow, cinematic mood 4:3",
  "bg-forest": "Lush green forest, dappled sunlight through trees, depth, cinematic nature 4:3",
  "bg-cyber": "Neon cyberpunk alley at night, wet pavement reflections, magenta cyan signs 4:3",
  "bg-space": "Deep space nebula, stars, purple blue cosmic clouds, cinematic sci-fi 4:3",
  "relight-golden": "Portrait woman golden hour rim light, warm sunset glow on skin, cinematic relight 4:3",
  "relight-neon": "Portrait cyberpunk neon magenta cyan edge lights, wet night atmosphere 4:3",
  "relight-studio": "Beauty portrait professional softbox studio lighting, clean commercial look 4:3",
  "relight-noir": "Film noir portrait high contrast chiaroscuro, single hard key light, moody 4:3",
  "relight-moon": "Portrait cool blue moonlight, silvery highlights, night cinematic 4:3",
  medusa: "Cinematic Medusa SFX makeup, living snake hair, pale skin, golden reptilian eyes, horror beauty portrait 4:3",
  "knight-dj": "Medieval knight in plate armor DJ headphones mixing at festival stage, epic party 4:3",
  mecha: "Mecha robot armor transformation on person, glowing energy cores, sci-fi sparks cinematic 4:3",
  "hellfire-vehicle": "Muscle car driving with wheels on fire, hellfire flames, dark cinematic action 4:3",
  pineapple: "Macro inside golden pineapple juice tunnel, liquid pulp, tropical beverage surreal 4:3",
  "jewel-horse": "Person transformed into jewel crystal facets ruby sapphire emerald sparkle fantasy 4:3",
  ryu: "Street Fighter Ryu white karate gi red headband blue energy aura fighter portrait 4:3",
  iceman: "Person frozen into blue white ice crystals, frost breath, ice shards superhero aesthetic 4:3",
  "fire-man": "Person wrapped in controlled supernatural flames, embers, heat distortion cinematic 4:3",
  "gold-coins": "Golden coins pouring around person, treasure explosion, casino jackpot sparkle 4:3",
  "outfit-black-dress": "Elegant woman black evening dress shimmer, fashion portrait studio 4:3",
  "outfit-denim": "Casual denim jacket white t-shirt street style fashion portrait 4:3",
  "outfit-red-suit": "Sharp red power suit professional confident fashion portrait 4:3",
  "changing-suits": "Fashion morph multiple outfits suits dresses runway magic cinematic 4:3",
  "hair-color": "Portrait vibrant purple hair color shine natural strands fashion beauty 4:3",
  "restyle-cinematic": "Cinematic teal orange color grade film grain anamorphic lens flare portrait 4:3",
  "restyle-anime": "Anime cel-shaded portrait vibrant colors clean outlines Ghibli warmth 4:3",
  "restyle-oil": "Oil painting portrait visible brush strokes impressionist museum art 4:3",
  "restyle-8mm": "Vintage 8mm home movie warm faded colors light leaks nostalgic grain portrait 4:3",
  "restyle-comic": "Comic book halftone portrait bold ink lines pop art Ben-Day dots 4:3",
};

function loadEnv() {
  for (const name of [".env.local", ".env.vercel", ".env"]) {
    for (const base of [ROOT, path.join(ROOT, "frontend")]) {
      const envPath = path.join(base, name);
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
    if (p.status === "failed" || p.status === "canceled") {
      throw new Error(p.error || "Geração falhou");
    }
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
  if (buf.length < 8000) throw new Error("ficheiro demasiado pequeno");
  await fs.writeFile(dest, buf);
  return buf.length;
}

function buildPrompt(id) {
  const base = THUMBS[id];
  if (!base) return null;
  const suffix = "Premium video template preview card. No text, no watermark, no logo, high quality.";
  if (TEXT_ONLY.has(id)) return `${base}. ${suffix}`;
  return `The woman as subject. ${base}. ${suffix}`;
}

async function generateOne(id, force) {
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

  const prompt = buildPrompt(id);
  if (!prompt) {
    console.warn(`no prompt for ${id}`);
    return false;
  }

  console.log(`→ ${id}${TEXT_ONLY.has(id) ? " [scene]" : " [portrait]"}`);

  const input = {
    prompt,
    aspect_ratio: "4:3",
    num_outputs: 1,
  };
  if (!TEXT_ONLY.has(id)) {
    input.image = REF_WOMAN;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const pred = await createPrediction(input);
      const done = await waitPrediction(pred.id);
      const url = firstUrl(done.output);
      if (!url) throw new Error("sem URL");
      const bytes = await download(url, dest);
      console.log(`  ✓ ${bytes} bytes`);
      return true;
    } catch (e) {
      console.warn(`  tentativa ${attempt + 1}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 6000));
    }
  }
  console.error(`  ✗ ${id} falhou`);
  return false;
}

async function main() {
  loadEnv();
  const force = process.argv.includes("--force");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg
    ? new Set(onlyArg.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean))
    : null;

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("REPLICATE_API_TOKEN em falta — coloca em .env.local");
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const ids = Object.keys(THUMBS).filter((id) => !only || only.has(id));
  let ok = 0;
  for (const id of ids) {
    // eslint-disable-next-line no-await-in-loop
    if (await generateOne(id, force)) ok += 1;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, GAP_MS));
  }
  console.log(`\nConcluído: ${ok}/${ids.length} → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
