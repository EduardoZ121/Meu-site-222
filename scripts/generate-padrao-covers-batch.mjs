#!/usr/bin/env node
/**
 * Gera capas JPG para estilos Personalizar (padrao) com Nano Banana + ref mulher/homem.
 *
 * Uso:
 *   node scripts/generate-padrao-covers-batch.mjs --force
 *   node scripts/generate-padrao-covers-batch.mjs --only=men_ceo_boardroom,wom_runway_gold
 *   node scripts/generate-padrao-covers-batch.mjs --cat=men --force
 *
 * Requer REPLICATE_API_TOKEN (.env.vercel ou .env.local)
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/padrao-covers");
const NANO_BANANA = "google/nano-banana";
const GAP_MS = 9000;
const REPO_RAW = "https://raw.githubusercontent.com/EduardoZ121/Meu-site-222/main/scripts/assets";
const REF_WOMAN = `${REPO_RAW}/ref_user_woman.jpg`;
const REF_MAN = `${REPO_RAW}/ref_user_man.jpg`;

/** Prompts mais neutros só para capa da grelha (evita filtros de conteúdo). */
const COVER_THUMB_OVERRIDES = {
  sn_silk_slip:
    "Soft fashion editorial of [subject] in an elegant full-length silk dress, warm window light, refined confident pose, luxury magazine cover, professional portrait, fully clothed SFW, ultra-realistic 8K.",
};

function loadEnv() {
  for (const name of [".env.vercel", ".env.local", ".env"]) {
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

function loadPadraoStyles() {
  const basePath = path.join(ROOT, "frontend/api/lib/padraoStylesData.cjs");
  const extPath = path.join(ROOT, "frontend/api/lib/padraoStyleExtensions.cjs");
  const base = require(basePath);
  let ext = [];
  try {
    ext = require(extPath);
  } catch {
    /* extensions optional during rollout */
  }
  return [...base, ...ext];
}

function parseArgs() {
  const force = process.argv.includes("--force");
  const catArg = process.argv.find((a) => a.startsWith("--cat="))?.slice(6)
    || (process.argv.includes("--cat") ? process.argv[process.argv.indexOf("--cat") + 1] : null);
  const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7)
    || (process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null);
  const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim()).filter(Boolean)) : null;
  return { force, cat: catArg || null, only };
}

function refForStyle(style) {
  if (style.cat === "men" || style.subject === "the man") return REF_MAN;
  if (style.cat === "women" || style.subject === "the woman") return REF_WOMAN;
  return REF_WOMAN;
}

function subjectLabel(style) {
  return style.subject || (style.cat === "men" ? "the man" : style.cat === "women" ? "the woman" : "the person");
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

async function waitPrediction(id, maxSec = 180) {
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

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) throw new Error("ficheiro demasiado pequeno");
  await fs.writeFile(dest, buf);
  return buf.length;
}

function seedFromId(id) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 999999;
}

async function generatePollinations(style, prompt, ref) {
  const dest = path.join(OUT_DIR, `${style.id}.jpg`);
  const shortPrompt = `${prompt.slice(0, 600)}. Centered portrait, face visible, 3:4 vertical, professional thumbnail, no text, no watermark.`;
  const q = encodeURIComponent(shortPrompt);
  const params = new URLSearchParams({
    width: "480",
    height: "640",
    model: "flux",
    nologo: "true",
    enhance: "false",
    seed: String(seedFromId(style.id)),
    image: ref,
    negative_prompt: "text, watermark, logo, deformed, blurry",
  });
  const url = `https://image.pollinations.ai/prompt/${q}?${params.toString()}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 12000) throw new Error("resposta inválida");
      await fs.writeFile(dest, buf);
      console.log(`  ✓ pollinations ${buf.length} bytes`);
      return true;
    } catch (e) {
      console.warn(`  pollinations tentativa ${attempt + 1}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  return false;
}

async function generateOne(style, { force }) {
  const dest = path.join(OUT_DIR, `${style.id}.jpg`);
  if (!force) {
    try {
      await fs.access(dest);
      console.log(`skip ${style.id}`);
      return true;
    } catch {
      /* generate */
    }
  }

  const subject = subjectLabel(style);
  const basePrompt = COVER_THUMB_OVERRIDES[style.id] || style.prompt;
  const prompt = basePrompt.replace(/\[subject\]/gi, subject);
  const ref = refForStyle(style);

  console.log(`→ ${style.id} (${style.nome}) ref=${style.cat}`);

  const hasReplicate = Boolean(process.env.REPLICATE_API_TOKEN);
  if (!hasReplicate) {
    return generatePollinations(style, prompt, ref);
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const pred = await createPrediction({
        prompt,
        aspect_ratio: "3:4",
        output_format: "jpg",
        image_input: [ref],
      });
      const done = await waitPrediction(pred.id);
      const bytes = await download(done.output, dest);
      console.log(`  ✓ ${bytes} bytes`);
      return true;
    } catch (e) {
      console.warn(`  tentativa ${attempt + 1} falhou: ${e.message}`);
      await new Promise((r) => setTimeout(r, 6000));
    }
  }
  console.warn(`  replicate esgotado — fallback pollinations`);
  return generatePollinations(style, prompt, ref);
}

async function main() {
  loadEnv();
  const { force, cat, only } = parseArgs();
  await fs.mkdir(OUT_DIR, { recursive: true });

  let styles = loadPadraoStyles();
  if (cat) styles = styles.filter((s) => s.cat === cat);
  if (only?.size) styles = styles.filter((s) => only.has(s.id));

  console.log(`Padrao covers — ${styles.length} estilos (force=${force})\n`);

  let ok = 0;
  let fail = 0;
  for (const style of styles) {
    const success = await generateOne(style, { force });
    if (success) ok += 1;
    else fail += 1;
    await new Promise((r) => setTimeout(r, process.env.REPLICATE_API_TOKEN ? GAP_MS : 4500));
  }

  console.log(`\nConcluído: ${ok} ok, ${fail} falhas → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
