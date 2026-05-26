/**
 * Demo login → dashboard → generate (desktop or mobile).
 * DEMO_MOBILE=1 → 9:16 vertical. Mocks API so no error toasts on Generate.
 */
import { chromium, devices } from "playwright";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import http from "http";
import {
  sleep,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  setupDemoApiMocks,
  injectDemoAccount,
  injectHideToasts,
  dismissVisibleToasts,
  injectUiChrome,
} from "./demo-recording-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "marketing");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";
const MOBILE = process.env.DEMO_MOBILE === "1";
const VIEWPORT = MOBILE ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };

async function waitForServer(url, maxMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => { res.resume(); resolve(res.statusCode); });
        req.on("error", reject);
        req.setTimeout(4000, () => req.destroy(new Error("timeout")));
      });
      return;
    } catch {
      await sleep(1200);
    }
  }
  throw new Error(`Server not ready: ${url}`);
}

async function moveCursor(page, x, y, opts = {}) {
  const { click = false, pause = 450 } = opts;
  await page.mouse.move(x, y, { steps: 22 });
  await page.evaluate(({ px, py }) => {
    const c = document.getElementById("rp-tutorial-cursor");
    if (c) { c.style.left = `${px}px`; c.style.top = `${py}px`; }
  }, { px: x, py: y });
  await sleep(pause);
  if (click) {
    await page.evaluate(() => document.getElementById("rp-tutorial-cursor")?.classList.add("click"));
    await page.mouse.click(x, y);
    await sleep(180);
    await page.evaluate(() => document.getElementById("rp-tutorial-cursor")?.classList.remove("click"));
    await sleep(350);
  }
}

async function spotlight(page, locator, opts = {}) {
  const { step = "", pad = 10 } = opts;
  const box = await locator.first().boundingBox().catch(() => null);
  if (!box) return;
  await page.evaluate(({ x, y, w, h, label }) => {
    const s = document.getElementById("rp-spotlight");
    const b = document.getElementById("rp-step-badge");
    if (s) {
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.width = `${w}px`;
      s.style.height = `${h}px`;
      s.style.opacity = "1";
    }
    if (b) {
      b.textContent = label;
      b.classList.toggle("show", !!label);
    }
  }, { x: box.x - pad, y: box.y - pad, w: box.width + pad * 2, h: box.height + pad * 2, label: step });
  await sleep(600);
}

async function clearSpotlight(page) {
  await page.evaluate(() => {
    document.getElementById("rp-spotlight")?.style && (document.getElementById("rp-spotlight").style.opacity = "0");
    document.getElementById("rp-step-badge")?.classList.remove("show");
  });
}

async function typeHuman(page, locator, text, delay = 55) {
  await locator.scrollIntoViewIfNeeded();
  await clearSpotlight(page);
  await locator.click({ force: true, timeout: 15000 });
  await locator.fill("");
  for (const ch of text) {
    await page.keyboard.type(ch, { delay });
  }
}

async function boxCenter(page, locator) {
  const box = await locator.first().boundingBox();
  if (!box) return null;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function openMobileNav(page) {
  const btn = page.locator('[data-testid="mobile-menu-btn"]');
  if (await btn.isVisible().catch(() => false)) {
    const c = await boxCenter(page, btn);
    if (c) await moveCursor(page, c.x, c.y, { click: true });
    await sleep(700);
  }
}

async function navClick(page, testId) {
  const link = page.locator(`[data-testid="${testId}"]`).first();
  await link.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  const c = await boxCenter(page, link);
  if (c) await moveCursor(page, c.x, c.y, { click: true });
  await sleep(MOBILE ? 1800 : 2200);
}

/** Click Generate and wait for real result UI (API mocked). */
async function clickGenerateAndWaitResult(page) {
  const gen = page.locator('[data-testid="generate-button"]');
  await gen.scrollIntoViewIfNeeded();
  await clearSpotlight(page);
  const gC = await boxCenter(page, gen);
  if (gC) await moveCursor(page, gC.x, gC.y, { click: true });
  else await gen.click({ force: true });

  await page.locator('[data-testid="result-loading"]').waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  await sleep(1200);

  try {
    await page.locator('[data-testid="result-image"]').waitFor({ state: "visible", timeout: 20000 });
  } catch {
    const img = `${BASE.replace(/\/$/, "")}/images/generate.jpg`;
    await page.evaluate((src) => {
      const host = document.querySelector('[data-testid="result-panel"]')
        || document.querySelector('[data-testid="result-empty"]')?.parentElement;
      if (!host) return;
      host.innerHTML = `<div class="card-rp p-3" data-testid="result-panel"><div class="relative bg-black/40 rounded-lg overflow-hidden flex items-center justify-center min-h-[280px]"><img src="${src}" alt="" class="max-h-[520px] w-full object-contain" data-testid="result-image" /></div></div>`;
    }, img);
    await sleep(800);
  }
  await dismissVisibleToasts(page);
  await sleep(1200);
}

async function assertNoErrorOnScreen(page) {
  const bad = await page.evaluate(() => {
    const toasts = [...document.querySelectorAll("[data-sonner-toast]")];
    const toastErr = toasts.some((t) => /error|failed|falhou|network/i.test(t.textContent || ""));
    const bodyErr = /generation failed|network error|falhou a geração/i.test(document.body.innerText || "");
    return toastErr || bodyErr;
  });
  if (bad) throw new Error("Error message visible on screen — aborting export");
}

async function runFlow(page) {
  console.log("1/8 Login…");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 90000 });
  await sleep(1500);

  const email = page.locator('[data-testid="login-email"]');
  const password = page.locator('[data-testid="login-password"]');
  const submit = page.locator('[data-testid="login-submit"]');

  await spotlight(page, email, { step: "Step 1 — Sign in" });
  const eBox = await email.boundingBox();
  if (eBox) await moveCursor(page, eBox.x + (MOBILE ? 60 : 80), eBox.y + eBox.height / 2, { click: true, pause: 400 });
  await typeHuman(page, email, DEMO_EMAIL);
  await sleep(400);

  await spotlight(page, password, { step: "Step 1 — Sign in" });
  const pBox = await password.boundingBox();
  if (pBox) await moveCursor(page, pBox.x + 60, pBox.y + pBox.height / 2, { click: true, pause: 400 });
  await typeHuman(page, password, DEMO_PASSWORD, 40);
  await sleep(500);
  await clearSpotlight(page);

  const sBox = await submit.boundingBox();
  if (sBox) await moveCursor(page, sBox.x + sBox.width / 2, sBox.y + sBox.height / 2, { click: true, pause: 800 });
  await sleep(2800);

  console.log("2/8 Dashboard…");
  await page.waitForURL(/\/app\//, { timeout: 30000 }).catch(() => {});
  await sleep(1000);
  if (MOBILE) await openMobileNav(page);
  else {
    await spotlight(page, page.locator('[data-testid="dashboard-layout"]'), { step: "Step 2 — Dashboard", pad: 4 });
    await sleep(2000);
    await clearSpotlight(page);
  }

  console.log("3/8 Studio…");
  if (MOBILE) {
    await navClick(page, "nav-generate");
  } else {
    await navClick(page, "nav-tools");
    const studio = page.locator('[data-testid="nav-generate"]');
    await spotlight(page, studio, { step: "Step 3 — Studio" });
    await navClick(page, "nav-generate");
    await clearSpotlight(page);
  }

  console.log("4/8 Personalization…");
  if (MOBILE) {
    await openMobileNav(page);
    await navClick(page, "nav-settings");
  } else {
    const libSec = page.locator('[data-testid="sidebar-section-library"]');
    await spotlight(page, libSec, { step: "Step 4 — Library" });
    const libC = await boxCenter(page, libSec);
    if (libC) await moveCursor(page, libC.x, libC.y, { pause: 800 });
    await clearSpotlight(page);
    await spotlight(page, page.locator('[data-testid="nav-settings"]'), { step: "Step 5 — Personalize" });
    await navClick(page, "nav-settings");
  }

  const pers = page.locator('[data-testid="personality-creative"]');
  await spotlight(page, pers, { step: MOBILE ? "AI personality" : "Step 5 — AI personality" });
  const prC = await boxCenter(page, pers);
  if (prC) await moveCursor(page, prC.x, prC.y, { click: true });
  await sleep(1200);
  await clearSpotlight(page);

  console.log("5/8 Prompt…");
  if (MOBILE) {
    await openMobileNav(page);
    await navClick(page, "nav-generate");
  } else {
    await navClick(page, "nav-generate");
  }

  const promptAcc = page.locator('[data-testid="studio-acc-prompt"] button[aria-expanded="false"]').first();
  if (await promptAcc.count()) await promptAcc.click({ force: true }).catch(() => {});
  await sleep(600);

  const prompt = page.locator('[data-testid="prompt-input"]');
  await spotlight(page, prompt, { step: "Step 6 — Prompt & generate" });
  const prmC = await boxCenter(page, prompt);
  if (prmC) await moveCursor(page, prmC.x, prmC.y, { click: true });
  await typeHuman(page, prompt, "Editorial portrait, soft studio light, premium fashion campaign", MOBILE ? 30 : 35);
  await sleep(700);
  await clearSpotlight(page);

  console.log("6/8 Generate (mocked API)…");
  await clickGenerateAndWaitResult(page);
  await assertNoErrorOnScreen(page);

  console.log("7/8 Result…");
  await spotlight(page, page.locator('[data-testid="result-image"]'), { step: "Your image is ready", pad: 16 });
  await sleep(MOBILE ? 3500 : 4000);
  await clearSpotlight(page);
  await assertNoErrorOnScreen(page);
}

function buildFinalVideo(rawWebm, outBaseName) {
  const scale = MOBILE ? "1080:1920" : "1920:1080";
  const rawMp4 = path.join(OUT_DIR, `${outBaseName}-raw.mp4`);
  const finalMp4 = path.join(OUT_DIR, `${outBaseName}.mp4`);
  const musicMp3 = path.join(OUT_DIR, "assets", "tutorial-bgm.mp3");
  const fontBold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
  const fontReg = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
  const sub = MOBILE ? "Login · Create · Generate" : "Login · Dashboard · Generate";
  const introRes = MOBILE ? "1080x1920" : "1920x1080";

  execSync(
    `ffmpeg -y -i "${rawWebm}" -vf "scale=${scale}:force_original_aspect_ratio=decrease,pad=${scale}:(ow-iw)/2:(oh-ih)/2:black,fps=30" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -an "${rawMp4}"`,
    { stdio: "inherit" },
  );

  const intro = path.join(OUT_DIR, `intro-${outBaseName}.mp4`);
  const endCard = path.join(OUT_DIR, `endcard-${outBaseName}.mp4`);
  const titleSize = MOBILE ? 56 : 72;
  const subSize = MOBILE ? 26 : 30;

  execSync(
    `ffmpeg -y -f lavfi -i color=c=0x0B0B0C:s=${introRes}:d=2.2:rate=30 -vf "drawtext=fontfile=${fontBold}:text='Remake Pixel':fontsize=${titleSize}:fontcolor=0xF4F1EA:x=(w-text_w)/2:y=(h-text_h)/2-40,drawtext=fontfile=${fontReg}:text='${sub}':fontsize=${subSize}:fontcolor=0xC4B5FD:x=(w-text_w)/2:y=(h-text_h)/2+50" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -an "${intro}"`,
    { stdio: "inherit" },
  );

  execSync(
    `ffmpeg -y -f lavfi -i color=c=0x0B0B0C:s=${introRes}:d=3:rate=30 -vf "drawtext=fontfile=${fontBold}:text='remakepix.com':fontsize=${MOBILE ? 52 : 64}:fontcolor=0xF4F1EA:x=(w-text_w)/2:y=(h-text_h)/2-30,drawtext=fontfile=${fontReg}:text='Start free — 50 credits':fontsize=${MOBILE ? 28 : 32}:fontcolor=0xC4B5FD:x=(w-text_w)/2:y=(h-text_h)/2+45" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -an "${endCard}"`,
    { stdio: "inherit" },
  );

  let mainWithFade = rawMp4;
  try {
    execSync(
      `ffmpeg -y -i "${rawMp4}" -i "${musicMp3}" -filter_complex "[1:a]volume=0.2,afade=t=in:st=0:d=2,afade=t=out:st=50:d=4[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -shortest "${rawMp4}.audio.mp4"`,
      { stdio: "pipe" },
    );
    mainWithFade = `${rawMp4}.audio.mp4`;
  } catch { /* no music */ }

  execSync(
    `ffmpeg -y -i "${intro}" -i "${mainWithFade}" -i "${endCard}" -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1:a=0[outv]" -map "[outv]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart "${finalMp4}"`,
    { stdio: "inherit" },
  );

  try {
    const withAudio = `${finalMp4}.tmp.mp4`;
    execSync(
      `ffmpeg -y -i "${finalMp4}" -i "${musicMp3}" -filter_complex "[1:a]volume=0.18,afade=t=in:st=0:d=2,afade=t=out:st=52:d=5[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart "${withAudio}"`,
      { stdio: "pipe" },
    );
    execSync(`mv "${withAudio}" "${finalMp4}"`);
  } catch { /* ok */ }

  return finalMp4;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const outName = MOBILE ? "demo-login-dashboard-mobile" : "demo-login-dashboard";
  console.log(MOBILE ? "📱 Mobile demo (9:16)…" : "🖥 Desktop demo…");
  console.log("Waiting for server…");
  await waitForServer(BASE);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const videoDir = path.join(OUT_DIR, MOBILE ? "raw-demo-mobile" : "raw-demo-login");
  await fs.mkdir(videoDir, { recursive: true });

  const context = await browser.newContext({
    ...(MOBILE ? { ...devices["iPhone 14 Pro Max"], viewport: VIEWPORT } : { viewport: VIEWPORT }),
    locale: "en-US",
    recordVideo: { dir: videoDir, size: VIEWPORT },
  });

  await setupDemoApiMocks(context, BASE);
  await injectDemoAccount(context);

  const page = await context.newPage();
  await injectHideToasts(page);
  await injectUiChrome(page);

  await runFlow(page);

  await context.close();
  await browser.close();

  const files = (await fs.readdir(videoDir)).filter((f) => f.endsWith(".webm"));
  if (!files.length) throw new Error("No video recorded");
  const finalPath = buildFinalVideo(path.join(videoDir, files[0]), outName);
  const stat = await fs.stat(finalPath);
  console.log(`\n✅ ${finalPath} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
