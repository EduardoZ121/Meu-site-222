#!/usr/bin/env node
/**
 * Capas JPG só para AI Lab (cat nsfw) — prompts variados por estilo.
 *
 * Uso: node scripts/generate-artistic-covers-nsfw.mjs
 *      node scripts/generate-artistic-covers-nsfw.mjs --force  (regenera existentes)
 * Requer REPLICATE_API_TOKEN
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/artistic-covers");
const COVERS_JS = path.join(ROOT, "frontend/src/lib/artisticStyleCovers.js");
const REPLICATE_GAP_MS = 11000;
const FORCE = process.argv.includes("--force");

/** Prompt único por card — composição e sujeito diferentes (evitar clones). */
const PREVIEW_PROMPT_BY_ID = {
  lab_qwen_edit:
    "Futuristic AI photo editing UI mood, split-screen before-after portrait on holographic monitors, cyan magenta light, no text, no watermark",
  lab_ai_rapid:
    "Motion-blur speed lines around a fashion portrait, rapid flash photography aesthetic, electric pink and orange streaks, dynamic energy",
  lab_cinematic_edit:
    "Cinematic anamorphic portrait in rain-soaked alley, teal orange grade, lens flare, film still, dramatic noir mood",
  lab_advanced_prompt:
    "Complex layered collage portrait, multiple exposure ghosting, surreal editorial, purple haze, artistic double exposure",
  lab_experimental_ai:
    "Neon laboratory portrait with soft glow tubes, experimental sci-fi beauty, pink and cyan rim light, clean dark background",
  lab_ultra_style:
    "Extreme macro skin detail portrait, 8K sharp eyes, neutral grey studio, hyper-real beauty campaign, crisp pores visible",
  lab_flux_edit:
    "Rich saturated color portrait, flowing liquid light trails on skin, deep blues and magentas, glossy editorial fashion",
  lab_realistic_edit:
    "Photoreal DSLR portrait window light, natural imperfections, documentary realism, soft morning sun, authentic skin",
  lab_hybrid_nsfw:
    "Dual-tone rapid edit aesthetic portrait, glitch chromatic aberration edges, modern digital art lab look, bold contrast",

  nsfw_swimwear:
    "Tropical beach golden hour, woman in red bikini walking in shallow waves, back three-quarter view, sun flare, travel editorial",
  nsfw_beach:
    "Wide sandy beach lifestyle photo, woman in white sarong at sunset, wind in hair, ocean horizon, vacation campaign",
  nsfw_lingerie_soft:
    "Boudoir lace lingerie on bed by window, soft morning light, romantic pastel tones, elegant silhouette side pose",
  nsfw_fitness_glam:
    "Gym fitness glamour, athletic woman in black sports bra, dramatic side lighting, sweat highlight, industrial background",
  nsfw_boudoir:
    "Classic boudoir on velvet sofa, woman in silk robe partially open, warm tungsten lamp, intimate editorial portrait",
  nsfw_pinup:
    "Retro 1950s pin-up poster style photo, polka dot backdrop, red lipstick, victory roll hair, vintage glamour pose on stool",
  nsfw_dark:
    "Dark sensual portrait, single hard rim light, deep shadows, mysterious black dress, smoke atmosphere, moody studio",
  nsfw_fantasy:
    "Fantasy pin-up illustration-photo hybrid, elf warrior woman ornate armor, magical forest bokeh, painterly epic light",

  nsfw_sheer:
    "High fashion sheer fabric editorial, translucent veil over silhouette, dramatic wind machine, monochrome studio",
  nsfw_figure_study:
    "Fine art figure study, classical nude sculpture lighting, museum black backdrop, artistic side profile, tasteful form",
  nsfw_explicit_art:
    "Bold adult fine art studio, implied nude covered by shadow and silk sheet, chiaroscuro, gallery exhibition mood",
  nsfw_intimate_couple:
    "Intimate couple silhouette embracing in bedroom, warm lamp, cinematic shallow depth, romantic mature editorial",
  nsfw_cosplay:
    "Cosplay convention portrait, woman as fantasy mage with glowing staff, detailed costume, purple convention lights",
  nsfw_wet_look:
    "Wet skin shower portrait, water droplets on shoulders, cool blue tiles background, glossy highlights, beauty campaign",
  nsfw_stockings:
    "Fashion legs focus stockings and red heels on marble floor, luxury boudoir, no face visible, editorial product style",
  nsfw_oil_body:
    "Body oil gloss close-up torso and arms, golden specular highlights, dark studio, athletic skin texture, beauty macro",
  nsfw_oil_render:
    "Semi-realistic 3D render full body, glossy oily wet skin UE5 quality, neutral HDR studio, athletic feminine form, cinematic",
  nsfw_explicit_pose:
    "Artistic implied nude pose behind frosted glass, blurred privacy, strong backlight outline, contemporary gallery photo",
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

function loadNsfwStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const slice = src.slice(src.indexOf("export const ARTISTIC_STUDIO_STYLES = "));
  const arrStart = slice.indexOf("[");
  const arrEnd = slice.indexOf("];\n\nexport const ARTISTIC_EFFECT_SECTIONS");
  const styles = new Function(`return ${slice.slice(arrStart, arrEnd + 1)}`)();
  return styles.filter((s) => s.cat === "nsfw");
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
  if (!res.ok) throw new Error(data.detail || data.error || `Replicate ${res.status}`);
  return data;
}

async function createPrediction(input) {
  try {
    return await replicateFetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-2-klein-9b/predictions",
      { method: "POST", body: JSON.stringify({ input }) },
    );
  } catch (e) {
    const model = await replicateFetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-2-klein-9b",
    );
    const version = model?.latest_version?.id;
    if (!version) throw e;
    return await replicateFetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      body: JSON.stringify({ version, input }),
    });
  }
}

async function waitPrediction(id, maxSec = 300) {
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
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

function buildPrompt(style) {
  const custom = PREVIEW_PROMPT_BY_ID[style.id];
  const core = custom || `Style preview for ${style.label}. ${style.suffix}`;
  return `${core}. Single striking image for a style picker card. No text, no watermark, no logo, no UI.`;
}

async function patchCoversJs(ids) {
  let src = await fs.readFile(COVERS_JS, "utf8");
  const existing = new Set([...src.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]));
  const lines = [];
  for (const id of ids) {
    if (!existing.has(id)) {
      lines.push(`  ${id}: "/images/artistic-covers/${id}.jpg",`);
    }
  }
  if (!lines.length) return;
  src = src.replace(
    /export const ARTISTIC_STYLE_COVER_BY_ID = \{\n/,
    `export const ARTISTIC_STYLE_COVER_BY_ID = {\n${lines.join("\n")}\n`,
  );
  await fs.writeFile(COVERS_JS, src);
  console.log(`\nAtualizado ${COVERS_JS} (+${lines.length} entradas)`);
}

async function main() {
  loadEnv();
  const styles = loadNsfwStyles();
  await fs.mkdir(OUT_DIR, { recursive: true });
  const generated = [];

  console.log(`AI Lab covers: ${styles.length} estilos\n`);

  for (const style of styles) {
    const outFile = path.join(OUT_DIR, `${style.id}.jpg`);
    if (!FORCE) {
      try {
        await fs.access(outFile);
        console.log(`→ ${style.id} (skip)`);
        generated.push(style.id);
        continue;
      } catch {
        /* new */
      }
    }

    const prompt = buildPrompt(style);
    const input = {
      prompt,
      aspect_ratio: "4:5",
      num_outputs: 1,
    };

    console.log(`→ ${style.id} …`);
    const pred = await createPrediction(input);
    const done = await waitPrediction(pred.id);
    const url = firstUrl(done.output);
    if (!url) throw new Error(`${style.id}: sem URL`);
    await download(url, outFile);
    generated.push(style.id);
    console.log(`  ✓ ${style.id}`);
    await new Promise((r) => setTimeout(r, REPLICATE_GAP_MS));
  }

  await patchCoversJs(generated);
  console.log("\nConcluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
