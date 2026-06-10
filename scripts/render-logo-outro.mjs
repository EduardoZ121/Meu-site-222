/**
 * Renders reusable Remake Pixel logo outro (Cursor-style end motion).
 */
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HTML = path.join(ROOT, "marketing/brand/logo-outro.html");
const OUT_DIR = path.join(ROOT, "marketing");

async function captureFrames(page, framesDir, count = 120) {
  await fs.rm(framesDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });
  for (let i = 0; i < count; i += 1) {
    await page.screenshot({ path: path.join(framesDir, `f_${String(i).padStart(4, "0")}.png`) });
    await page.waitForTimeout(33);
  }
}

async function framesToMp4(framesDir, out, extraVf = "") {
  const vf = extraVf ? `-vf "${extraVf}"` : "";
  execSync(
    `ffmpeg -y -framerate 30 -i "${framesDir}/f_%04d.png" ${vf} -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart "${out}"`,
    { stdio: "inherit" },
  );
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

  const page916 = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page916.goto(`file://${HTML}`);
  await captureFrames(page916, path.join(OUT_DIR, "frames-outro-916"));
  const out916 = path.join(OUT_DIR, "rp-logo-outro-9x16.mp4");
  await framesToMp4(path.join(OUT_DIR, "frames-outro-916"), out916);
  console.log(`✅ ${out916}`);

  const pageSq = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await pageSq.goto(`file://${HTML}`);
  await captureFrames(pageSq, path.join(OUT_DIR, "frames-outro-sq"));
  const outSq = path.join(OUT_DIR, "rp-logo-outro-1x1.mp4");
  await framesToMp4(
    path.join(OUT_DIR, "frames-outro-sq"),
    outSq,
    "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:black",
  );
  console.log(`✅ ${outSq}`);

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
