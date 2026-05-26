#!/usr/bin/env node
/**
 * Gera capas JPG para a grelha Comics (Personalizar / Estúdio).
 * Todos os estilos usam ref masculina — história Cole / Walking Dead style.
 *
 * Uso: node scripts/generate-comic-covers.mjs
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
const REF_MAN = path.join(ROOT, "scripts/assets/ref_man.jpg");

const COMIC_IDS = [
  "x_a_p1",
  "x_a_p2",
  "x_b_p1",
  "x_b_p2",
  "x_b_p3",
  "x_b_p4",
  "x_b_p5",
];

const SUBJECT = "the man";

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

function loadComicStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/publicFallbacks.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const start = src.indexOf("export const FALLBACK_PADRAO_STYLES = ");
  if (start < 0) throw new Error("FALLBACK_PADRAO_STYLES não encontrado");
  const slice = src.slice(start);
  const arrStart = slice.indexOf("[");
  const arrEnd = slice.indexOf("];\n\nexport const FALLBACK_PADRAO_GROUPS");
  const jsonish = slice.slice(arrStart, arrEnd + 1);
  const styles = new Function(`return ${jsonish}`)();
  return Object.fromEntries(
    styles.filter((s) => s.cat === "comic" && COMIC_IDS.includes(s.id)).map((s) => [s.id, s])
  );
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
  const styles = loadComicStyles();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const imageUri = await fileToDataUri(REF_MAN);
  console.log(`Referência: ref_man.jpg → [subject] = "${SUBJECT}"\n`);

  for (const id of COMIC_IDS) {
    const style = styles[id];
    if (!style) {
      console.warn(`Skip ${id}: estilo não encontrado`);
      continue;
    }
    const prompt = style.prompt.replace(/\[subject\]/gi, SUBJECT);
    const outFile = path.join(OUT_DIR, `${id}.jpg`);

    console.log(`→ ${id} (${style.nome}) …`);
    const pred = await createPrediction({
      prompt,
      image: imageUri,
      aspect_ratio: "3:4",
      num_outputs: 1,
    });
    const done = await waitPrediction(pred.id);
    const url = firstUrl(done.output);
    if (!url) throw new Error(`${id}: sem URL`);
    await download(url, outFile);
    console.log(`  ✓ ${outFile}`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\nConcluído. Entradas x_* em padraoStyleCovers.js.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
