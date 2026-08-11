/**
 * Descarrega os 3 vídeos de capa a partir do link TeraBox (preview/share).
 * Requer: npx playwright install chromium (primeira vez)
 *
 * Uso: node scripts/fetch-terabox-video-covers.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import { chromium } from "playwright";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "images", "tools", "video");
const SHARE = "https://1024terabox.com/s/1Ijs9Xe_xQlqIBfFu8hV7ow";
const FOLDER = "Para a sessão de videos";
const FFMPEG = ffmpegInstaller.path;

const FILES = [
  { name: "Text to video.mp4", out: "text-fast.mp4" },
  { name: "Este video vai na sessão de imagem to video.mp4", out: "image.mp4" },
  { name: "Video to video.mp4", out: "edit.mp4" },
];

function parseM3u8(text, baseUrl) {
  const segments = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    segments.push(new URL(trimmed, baseUrl).href);
  }
  return segments;
}

async function downloadM3u8(m3u8Url) {
  const res = await fetch(m3u8Url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://www.1024tera.com/",
    },
  });
  if (!res.ok) throw new Error(`M3U8 HTTP ${res.status}`);
  const playlist = await res.text();
  const segments = parseM3u8(playlist, m3u8Url);
  if (!segments.length) throw new Error("Playlist M3U8 sem segmentos");

  const chunks = [];
  for (const segUrl of segments) {
    const segRes = await fetch(segUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://www.1024tera.com/",
      },
    });
    if (!segRes.ok) throw new Error(`Segmento HTTP ${segRes.status}`);
    chunks.push(Buffer.from(await segRes.arrayBuffer()));
  }
  return Buffer.concat(chunks);
}

function remuxTsToMp4(tsPath, mp4Path) {
  execFileSync(FFMPEG, ["-y", "-i", tsPath, "-c", "copy", "-movflags", "+faststart", mp4Path], {
    stdio: "pipe",
  });
}

async function openFolder(page) {
  await page.goto(SHARE, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForTimeout(2500);

  const folderRow = page
    .locator(".webmaster-file-item, .file-item-listmode")
    .filter({ hasText: FOLDER })
    .first();
  await folderRow.dblclick();
  await page.waitForTimeout(2500);
}

async function fetchCover(page, file) {
  console.log(`A obter: ${file.name}`);

  const row = page
    .locator(".webmaster-file-item, .file-item-listmode")
    .filter({ hasText: file.name })
    .first();
  await row.click({ timeout: 60_000 });
  await page.waitForTimeout(5000);

  const src = await page.evaluate(() => document.querySelector("video")?.src || null);
  if (!src) throw new Error(`Sem preview para ${file.name}`);

  const dest = path.join(outDir, file.out);
  const tmpTs = path.join(outDir, `.tmp-${file.out}.ts`);

  let raw;
  if (src.startsWith("blob:")) {
    const bytes = await page.evaluate(async (blobUrl) => {
      const resp = await fetch(blobUrl);
      return Array.from(new Uint8Array(await resp.arrayBuffer()));
    }, src);
    raw = Buffer.from(bytes);
  } else if (src.includes("streaming") || src.includes(".m3u8")) {
    raw = await downloadM3u8(src);
  } else {
    const direct = await fetch(src, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://www.1024tera.com/" },
    });
    if (!direct.ok) throw new Error(`Download directo HTTP ${direct.status}`);
    raw = Buffer.from(await direct.arrayBuffer());
  }

  if (raw[0] === 0x47) {
    fs.writeFileSync(tmpTs, raw);
    remuxTsToMp4(tmpTs, dest);
    fs.unlinkSync(tmpTs);
  } else {
    fs.writeFileSync(dest, raw);
  }

  const size = fs.statSync(dest).size;
  console.log(`  Guardado ${file.out} (${size} bytes)`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const file of FILES) {
    await openFolder(page);
    await fetchCover(page, file);
  }

  await browser.close();
  console.log("Concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
