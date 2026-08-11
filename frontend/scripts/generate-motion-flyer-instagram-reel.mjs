#!/usr/bin/env node
/**
 * Vídeo marketing 15s (Instagram 9:16) — Motion Flyer IA no RemakePix.
 * Usa Seedance 2.0 + screenshots UI + flyer demo como referências.
 *
 * Uso: node frontend/scripts/generate-motion-flyer-instagram-reel.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import sharp from "sharp";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const require = createRequire(import.meta.url);
const OUT_DIR = path.resolve(__dirname, "output/motion-flyer-marketing");

const FLYER_PROMPT =
  "Professional Instagram event flyer poster, neon purple and black, bold typography "
  + "NIGHT SESSION, DJ name, date 24 MAY, club promo, vertical 9:16, high contrast, "
  + "print quality, no watermark, no mockup frame.";

const MARKETING_PROMPT = `Create a 15-second vertical Instagram marketing video for RemakePix "Motion Flyer IA" — an AI tool that animates static flyers into cinematic motion videos.

Use [Image1] as the static event flyer reference. Use [Image2] as the dark purple RemakePix studio UI style reference (upload screen).

Storyboard — show the product journey visually (premium SaaS ad, no fake logos):

Shot 1 (0:00-0:02): Phone screen glow — finger drops the static flyer [Image1] onto a sleek dark purple upload zone matching [Image2] aesthetic. Soft UI reflection, RemakePix studio vibe.

Shot 2 (0:02-0:05): Flyer layers separate in 3D parallax inside the app — typography, subject, background float with After Effects motion-graphics energy. Purple accent lights.

Shot 3 (0:05-0:08): AI processing pulse — subtle neural glow, layers snap into rhythmic animation. Text stays sharp and readable.

Shot 4 (0:08-0:11): Full-screen motion flyer result — flyer comes alive: camera push-in, particles, beat-synced light on the same design from [Image1]. Concert/promo energy.

Shot 5 (0:11-0:13): Quick cut — email notification on phone: "Your motion flyer is ready" with video thumbnail playing.

Shot 6 (0:13-0:15): Hero end card — animated flyer loop + text space for CTA. Premium, cinematic, dark purple brand mood.

Audio: upbeat electronic promo beat, whooshes on transitions, subtle notification ping.

Style: Ultra-realistic product marketing film, dark mode UI, purple (#7C3AED) accents, broadcast social ad quality, dynamic camera, no unreadable text overlays, no watermarks.`;

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

async function waitPrediction(id, maxSec = 600) {
  const t0 = Date.now();
  while ((Date.now() - t0) / 1000 < maxSec) {
    const p = await replicateFetch(`https://api.replicate.com/v1/predictions/${id}`);
    if (p.status === "succeeded") return p;
    if (p.status === "failed" || p.status === "canceled") {
      throw new Error(p.error || "Geração falhou");
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error("Timeout Seedance");
}

function firstUrl(output) {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output[0];
  return null;
}

async function generateFlyerImage() {
  console.log("→ Gerar flyer demo (Grok)…");
  const pred = await replicateFetch("https://api.replicate.com/v1/models/xai/grok-imagine-image/predictions", {
    method: "POST",
    body: JSON.stringify({
      input: {
        prompt: FLYER_PROMPT,
        aspect_ratio: "9:16",
        num_outputs: 1,
      },
    }),
  });
  const done = await waitPrediction(pred.id, 300);
  const url = firstUrl(done.output);
  if (!url) throw new Error("Flyer sem URL");
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = path.join(OUT_DIR, "sample-flyer.jpg");
  await fs.writeFile(dest, buf);
  console.log(`  ✓ flyer ${buf.length} bytes`);
  return dest;
}

async function uploadBlob(filePath, name) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN em falta");
  const buf = await fs.readFile(filePath);
  const ext = path.extname(filePath).slice(1) || "jpg";
  const blob = await put(`marketing/motion-flyer-reel/${name}.${ext}`, buf, {
    access: "public",
    token,
    contentType: ext === "png" ? "image/png" : "image/jpeg",
  });
  return blob.url;
}

async function runSeedance({ flyerUrl, uiUrl }) {
  console.log("\n→ Seedance 2.0 — vídeo marketing 15s…");
  const input = {
    prompt: MARKETING_PROMPT,
    reference_images: [flyerUrl, uiUrl].filter(Boolean),
    duration: 15,
    aspect_ratio: "9:16",
    resolution: "720p",
    generate_audio: true,
  };

  const pred = await replicateFetch("https://api.replicate.com/v1/models/bytedance/seedance-2.0/predictions", {
    method: "POST",
    body: JSON.stringify({ input }),
  });

  console.log(`  prediction ${pred.id}`);
  const done = await waitPrediction(pred.id, 900);
  console.log("");
  const videoUrl = firstUrl(done.output);
  if (!videoUrl) throw new Error("Seedance sem URL de vídeo");

  const res = await fetch(videoUrl);
  const videoBuf = Buffer.from(await res.arrayBuffer());
  const outVideo = path.join(OUT_DIR, "motion-flyer-instagram-reel-15s.mp4");
  await fs.writeFile(outVideo, videoBuf);
  console.log(`  ✓ vídeo guardado: ${outVideo} (${(videoBuf.length / 1024 / 1024).toFixed(2)} MB)`);
  return { videoUrl, localPath: outVideo };
}

async function main() {
  loadEnv();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const uiPath = path.join(OUT_DIR, "step1-ui-empty.png");
  try {
    await fs.access(uiPath);
  } catch {
    throw new Error(`Screenshot UI em falta: ${uiPath}. Corre o browser screenshot primeiro.`);
  }

  const flyerPath = await generateFlyerImage();

  console.log("→ Upload referências para Blob…");
  const flyerUrl = await uploadBlob(flyerPath, "sample-flyer");
  const uiUrl = await uploadBlob(uiPath, "ui-empty");
  console.log(`  flyer: ${flyerUrl}`);
  console.log(`  ui: ${uiUrl}`);

  const meta = {
    created_at: new Date().toISOString(),
    flyer_url: flyerUrl,
    ui_url: uiUrl,
    prompt: MARKETING_PROMPT,
    duration: 15,
    aspect_ratio: "9:16",
    model: "bytedance/seedance-2.0",
  };

  const result = await runSeedance({ flyerUrl, uiUrl });
  meta.video_url = result.videoUrl;
  meta.local_path = result.localPath;

  await fs.writeFile(
    path.join(OUT_DIR, "reel-meta.json"),
    JSON.stringify(meta, null, 2),
  );

  console.log("\n════════════════════════════════════════");
  console.log("Vídeo pronto para Instagram:");
  console.log(result.videoUrl);
  console.log("Local:", result.localPath);
  console.log("════════════════════════════════════════\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
