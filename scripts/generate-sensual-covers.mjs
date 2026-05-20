#!/usr/bin/env node
/**
 * Gera capas JPG para a grelha Sensual (Personalizar / Estúdio).
 * Apenas ref feminina — todos os estilos sn_* usam the woman.
 *
 * Uso: node scripts/generate-sensual-covers.mjs
 * Requer REPLICATE_API_TOKEN no .env.local
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/padrao-covers");
const REF_WOMAN = path.join(ROOT, "scripts/assets/ref_woman.jpg");

const SUBJECT = "the woman";

/** Fallback SFW quando o modelo rejeita o prompt original (E005). */
const PROMPT_OVERRIDES = {
  sn_street_edge:
    "Fashion editorial portrait of [subject] with voluminous curly hair, wearing an oversized red streetwear hoodie and fitted neutral lounge pants. Relaxed side pose, looking over shoulder with confident expression. Modern apartment, large mirror in soft background. Tasteful lifestyle fashion, SFW, no explicit content. Ultra-realistic 8k sharp focus. preserve identity, keep same face, keep facial structure, keep skin tone, maintain original identity, do not change person, realistic face consistency, preserve original facial expression, keep same emotion, keep same eye expression, keep same pose",
};

/** Ordem da grelha + aspect ratio por prompt. */
const SENSUAL_JOBS = [
  { id: "sn_postshower", aspect_ratio: "4:3" },
  { id: "sn_bedroom", aspect_ratio: "4:3" },
  { id: "sn_dark_asteric", aspect_ratio: "4:3" },
  { id: "sn_minimal", aspect_ratio: "3:4" },
  { id: "sn_mirror_gaming", aspect_ratio: "9:16" },
  { id: "sn_actress", aspect_ratio: "3:4" },
  { id: "sn_lux_mirror", aspect_ratio: "3:4" },
  { id: "sn_softglam", aspect_ratio: "3:4" },
  { id: "sn_clean_jumpsuit", aspect_ratio: "3:4" },
  { id: "sn_high_impact", aspect_ratio: "3:4" },
  { id: "sn_street_edge", aspect_ratio: "3:4" },
];

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

function loadSensualStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/publicFallbacks.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const start = src.indexOf("export const FALLBACK_PADRAO_STYLES = ");
  if (start < 0) throw new Error("FALLBACK_PADRAO_STYLES não encontrado");
  const slice = src.slice(start);
  const arrStart = slice.indexOf("[");
  const arrEnd = slice.indexOf("];\n\nexport const FALLBACK_PADRAO_GROUPS");
  const jsonish = slice.slice(arrStart, arrEnd + 1);
  const styles = new Function(`return ${jsonish}`)();
  return Object.fromEntries(styles.filter((s) => s.cat === "sensual").map((s) => [s.id, s]));
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

async function main() {
  loadEnv();
  const styles = loadSensualStyles();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const imageUri = await fileToDataUri(REF_WOMAN);
  console.log(`Referência: ref_woman.jpg → [subject] = "${SUBJECT}"\n`);

  for (const job of SENSUAL_JOBS) {
    const style = styles[job.id];
    if (!style) {
      console.warn(`Skip ${job.id}: estilo não encontrado`);
      continue;
    }
    const rawPrompt = PROMPT_OVERRIDES[job.id] || style.prompt;
    const prompt = rawPrompt.replace(/\[subject\]/gi, SUBJECT);
    const outFile = path.join(OUT_DIR, `${job.id}.jpg`);
    try {
      await fs.access(outFile);
      console.log(`→ ${job.id} (já existe, skip)`);
      continue;
    } catch {
      /* generate */
    }

    console.log(`→ ${job.id} (${style.nome}) [${job.aspect_ratio}] …`);
    const pred = await createPrediction({
      prompt,
      image: imageUri,
      aspect_ratio: job.aspect_ratio,
      num_outputs: 1,
    });
    const done = await waitPrediction(pred.id);
    const url = firstUrl(done.output);
    if (!url) throw new Error(`${job.id}: sem URL`);
    await download(url, outFile);
    console.log(`  ✓ ${outFile}`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\nConcluído. Entradas sn_* em padraoStyleCovers.js.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
