#!/usr/bin/env node
/**
 * Capa antes/depois para a grelha Vídeo Marketing IA (1:1).
 * Gera foto "antes" + transformação "depois" via Replicate e compõe lado a lado.
 *
 * Uso: node frontend/scripts/generate-marketing-video-cover.mjs [--force]
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const require = createRequire(import.meta.url);
const OUT_DIR = path.resolve(__dirname, "../public/images/tools/video");
const OUT_MAIN = path.join(OUT_DIR, "marketing-video-ai.jpg");
const OUT_LEGACY = path.join(OUT_DIR, "marketing.jpg");
const HALF = 640;

const BEFORE_PROMPT =
  "Amateur smartphone product photo for a marketing ad: young woman holding a sleek cosmetic serum bottle "
  + "at chest height, harsh indoor ceiling light, slightly cluttered home background, flat uninspiring colors, "
  + "minor motion blur, realistic casual snapshot, square 1:1 crop, no text, no watermark.";

const AFTER_PROMPT =
  "Transform into a single frame from a premium 15-second luxury skincare TV commercial. "
  + "Same woman and same serum bottle, identical pose. Cinematic golden rim light, shallow depth of field, "
  + "slow-motion water droplets and soft lens flare, teal-gold color grade, broadcast advertising quality, "
  + "professional camera angle, film grain, aspirational beauty brand energy. Square 1:1, no text, no watermark.";

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

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) throw new Error("ficheiro demasiado pequeno");
  return buf;
}

async function fileToDataUri(filePath) {
  const buf = await fs.readFile(filePath);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function generateImage(prompt, { imageUri, label = "image" } = {}) {
  const input = { prompt, aspect_ratio: "1:1", num_outputs: 1 };
  if (imageUri) input.image = imageUri;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const pred = await createPrediction(input);
      const done = await waitPrediction(pred.id);
      const url = firstUrl(done.output);
      if (!url) throw new Error("sem URL");
      return downloadBuffer(url);
    } catch (e) {
      const msg = String(e.message || e);
      const throttled = /throttl|rate limit/i.test(msg);
      console.warn(`  ${label} tentativa ${attempt + 1}: ${msg.slice(0, 120)}`);
      if (!throttled || attempt >= 4) throw e;
      const waitMs = 15000 + attempt * 12000;
      console.log(`  aguardar ${Math.round(waitMs / 1000)}s (rate limit)…`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw new Error(`${label} falhou`);
}

async function composeBeforeAfter(beforeBuf, afterBuf, dest) {
  const before = await sharp(beforeBuf)
    .resize(HALF, HALF, { fit: "cover", position: "centre" })
    .jpeg({ quality: 92 })
    .toBuffer();

  const after = await sharp(afterBuf)
    .resize(HALF, HALF, { fit: "cover", position: "centre" })
    .jpeg({ quality: 92 })
    .toBuffer();

  const w = HALF * 2;
  const h = HALF;

  const dividerSvg = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.9"/>
          <stop offset="50%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#7C3AED" stop-opacity="0.9"/>
        </linearGradient>
      </defs>
      <rect x="${HALF - 2}" y="0" width="4" height="${h}" fill="url(#g)"/>
      <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#7C3AED" stroke-width="3" opacity="0.35"/>
    </svg>`,
  );

  const overlay = await sharp(dividerSvg).png().toBuffer();

  const composed = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 10, g: 10, b: 12 } },
  })
    .composite([
      { input: before, left: 0, top: 0 },
      { input: after, left: HALF, top: 0 },
      { input: overlay, left: 0, top: 0 },
    ])
    .jpeg({ quality: 93, mozjpeg: true })
    .toBuffer();

  await fs.writeFile(dest, composed);
  return composed.length;
}

async function main() {
  loadEnv();
  const force = process.argv.includes("--force");

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("REPLICATE_API_TOKEN em falta");
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  if (!force) {
    try {
      await fs.access(OUT_MAIN);
      const stat = await fs.stat(OUT_MAIN);
      if (stat.size > 50000) {
        console.log(`skip ${OUT_MAIN} (${stat.size} bytes) — usa --force para regenerar`);
        return;
      }
    } catch {
      /* generate */
    }
  }

  const tmpBefore = path.join(OUT_DIR, "_mktvid_before.jpg");
  const tmpAfter = path.join(OUT_DIR, "_mktvid_after.jpg");
  const onlyAfter = process.argv.includes("--only-after");

  let beforeBuf;
  if (onlyAfter) {
    beforeBuf = await fs.readFile(tmpBefore);
    console.log(`→ Reutilizar ANTES (${beforeBuf.length} bytes)`);
  } else {
    console.log("→ Gerar ANTES (foto casual)…");
    beforeBuf = await generateImage(BEFORE_PROMPT, { label: "antes" });
    await fs.writeFile(tmpBefore, beforeBuf);
    console.log(`  ✓ antes ${beforeBuf.length} bytes`);
    console.log("  pausa 70s antes do DEPOIS (rate limit Replicate)…");
    await new Promise((r) => setTimeout(r, 70000));
  }

  console.log("→ Gerar DEPOIS (frame comercial)…");
  const beforeUri = await fileToDataUri(tmpBefore);
  const afterBuf = await generateImage(AFTER_PROMPT, { imageUri: beforeUri, label: "depois" });
  await fs.writeFile(tmpAfter, afterBuf);
  console.log(`  ✓ depois ${afterBuf.length} bytes`);

  console.log("→ Compor diptych antes/depois…");
  const bytes = await composeBeforeAfter(beforeBuf, afterBuf, OUT_MAIN);
  await fs.copyFile(OUT_MAIN, OUT_LEGACY);
  console.log(`  ✓ ${OUT_MAIN} (${bytes} bytes)`);
  console.log(`  ✓ ${OUT_LEGACY} (cópia)`);

  await fs.unlink(tmpBefore).catch(() => {});
  await fs.unlink(tmpAfter).catch(() => {});
  console.log("\nConcluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
