/**
 * Grava preview marketing mobile (9:16) — remakepix.com
 * Uso: node scripts/record-marketing-preview.mjs
 */
import { chromium, devices } from "playwright";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "marketing");
const BASE = process.env.BASE_URL || "https://remakepix.com";
const PORTRAIT = path.join(ROOT, "frontend/public/images/founder.jpg");

const DEMO_USER = {
  id: "marketing_demo",
  email: "criador@remakepix.com",
  name: "Maria",
  role: "user",
  lang: "pt",
  credits: 420,
  is_unlimited: false,
  referral_code: "DEMO",
  email_verified: true,
  avatar_url: null,
  created_at: new Date().toISOString(),
};

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function smoothScroll(page, totalPx, durationMs) {
  const steps = Math.max(20, Math.floor(durationMs / 40));
  const step = totalPx / steps;
  for (let i = 0; i < steps; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await page.evaluate((y) => window.scrollBy(0, y), step);
    // eslint-disable-next-line no-await-in-loop
    await sleep(durationMs / steps);
  }
}

async function injectDemoSession(context) {
  await context.addInitScript((user) => {
    localStorage.setItem("rp_token", `local:${user.id}`);
    localStorage.setItem("rp_user", JSON.stringify(user));
    localStorage.setItem("rp_pricing_region", "intl");
  }, DEMO_USER);
}

async function showMockResult(page) {
  const img = `${BASE}/images/generate.jpg`;
  await page.evaluate((src) => {
    const panel = document.querySelector('[data-testid="result-panel"]')
      || document.querySelector('[data-testid="result-empty"]')?.parentElement;
    const host = panel || document.querySelector(".rp-studio-shell");
    if (!host) return;
    let box = document.getElementById("marketing-result-inject");
    if (!box) {
      box = document.createElement("div");
      box.id = "marketing-result-inject";
      box.style.cssText = "margin-top:16px;border-radius:12px;overflow:hidden;border:1px solid rgba(124,58,237,0.35);box-shadow:0 20px 60px rgba(0,0,0,0.45)";
      host.appendChild(box);
    }
    box.innerHTML = `<img src="${src}" alt="Resultado" style="width:100%;display:block;aspect-ratio:4/5;object-fit:cover" />`;
  }, img);
  await page.evaluate(() => {
    const el = document.getElementById("marketing-result-inject");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const device = devices["iPhone 14 Pro Max"];
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const videoDir = path.join(OUT_DIR, "raw");
  await fs.mkdir(videoDir, { recursive: true });

  const context = await browser.newContext({
    ...device,
    locale: "pt-PT",
    recordVideo: {
      dir: videoDir,
      size: { width: 1080, height: 1920 },
    },
  });

  await injectDemoSession(context);
  const page = await context.newPage();

  console.log("1/7 Landing…");
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await sleep(2500);
  await smoothScroll(page, 2200, 7000);
  await sleep(1500);
  await smoothScroll(page, -800, 2000);
  await sleep(1200);

  console.log("2/7 Explore…");
  await page.goto(`${BASE}/explore`, { waitUntil: "networkidle" });
  await sleep(2000);
  await smoothScroll(page, 400, 1500);
  await sleep(1000);

  console.log("3/7 Login…");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await sleep(3500);

  console.log("4/7 Ferramentas…");
  await page.goto(`${BASE}/app/tools`, { waitUntil: "networkidle" });
  await sleep(2500);
  await smoothScroll(page, 500, 2000);
  await sleep(1500);

  console.log("5/7 Studio / Gerar…");
  await page.goto(`${BASE}/app/studio`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(3500);

  const accPrompt = page.locator('[data-testid="studio-acc-prompt"] button, [data-testid="studio-acc-prompt"] summary').first();
  if (await accPrompt.count()) {
    await accPrompt.click().catch(() => {});
    await sleep(800);
  }

  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count()) {
    await fileInput.setInputFiles(PORTRAIT).catch(() => {});
    await sleep(2200);
  }

  const toggleStyles = page.locator('[data-testid="toggle-styles"]');
  if (await toggleStyles.count()) await toggleStyles.click().catch(() => {});
  await sleep(1000);

  const styleBtn = page.locator('[data-testid^="pstyle-"]').first();
  if (await styleBtn.count()) {
    await styleBtn.click().catch(() => {});
    await sleep(1500);
  }

  const prompt = page.locator('[data-testid="prompt-input"], textarea.rp-editor-textarea, textarea').first();
  if (await prompt.count()) {
    await prompt.click().catch(() => {});
    await prompt.fill("Retrato editorial premium, luz suave, fundo cinematográfico", { timeout: 15000 }).catch(() => {});
  }
  await sleep(1500);

  const genBtn = page.locator('[data-testid="generate-button"], button:has-text("Gerar"), button:has-text("Aplicar")').first();
  if (await genBtn.count()) {
    await genBtn.scrollIntoViewIfNeeded().catch(() => {});
    await sleep(600);
    await genBtn.click().catch(() => {});
  }
  await sleep(3000);

  console.log("6/7 Resultado (preview)…");
  await showMockResult(page);
  await sleep(4500);
  await smoothScroll(page, 300, 1200);

  console.log("7/7 Galeria + Billing…");
  await page.goto(`${BASE}/app/gallery`, { waitUntil: "networkidle" });
  await sleep(2500);
  await page.goto(`${BASE}/app/billing`, { waitUntil: "networkidle" });
  await sleep(2500);
  await page.goto(BASE, { waitUntil: "networkidle" });
  await sleep(2000);

  await context.close();
  await browser.close();

  const files = (await fs.readdir(videoDir)).filter((f) => f.endsWith(".webm"));
  if (!files.length) throw new Error("Nenhum vídeo gravado.");
  const rawWebm = path.join(videoDir, files[0]);
  const rawMp4 = path.join(OUT_DIR, "remakepix-preview-mobile-raw.mp4");
  const finalMp4 = path.join(OUT_DIR, "remakepix-preview-mobile.mp4");

  console.log("A converter vídeo…");
  execSync(
    `ffmpeg -y -i "${rawWebm}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,fps=30" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -an "${rawMp4}"`,
    { stdio: "inherit" },
  );

  const endCardMp4 = path.join(OUT_DIR, "endcard.mp4");
  execSync(
    `ffmpeg -y -f lavfi -i color=c=0x0B0B0C:s=1080x1920:d=3:rate=30 -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='Remake Pixel':fontsize=68:fontcolor=0xF4F1EA:x=(w-text_w)/2:y=(h-text_h)/2-70,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='remakepix.com':fontsize=34:fontcolor=0xC4B5FD:x=(w-text_w)/2:y=(h-text_h)/2+50" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -an "${endCardMp4}"`,
    { stdio: "inherit" },
  );

  execSync(
    `ffmpeg -y -i "${rawMp4}" -i "${endCardMp4}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0,format=yuv420p" -c:v libx264 -preset fast -crf 20 -movflags +faststart -an "${finalMp4}"`,
    { stdio: "inherit" },
  );

  const stat = await fs.stat(finalMp4);
  console.log(`\n✅ Vídeo: ${finalMp4} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
