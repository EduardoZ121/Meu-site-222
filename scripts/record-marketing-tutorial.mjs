/**
 * Marketing tutorial — desktop, English, cursor overlay, background music.
 * Usage: node scripts/record-marketing-tutorial.mjs
 * Env: BASE_URL (default http://127.0.0.1:3000), RECORD_LOCAL=1
 */
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "marketing");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const VIEWPORT = { width: 1440, height: 900 };

const DEMO_USER = {
  id: "tutorial_demo",
  email: "creator@remakepix.com",
  name: "Alex",
  role: "user",
  lang: "en",
  credits: 420,
  is_unlimited: false,
  referral_code: "TUTORIAL",
  email_verified: true,
  avatar_url: null,
  created_at: new Date().toISOString(),
};

const CURSOR_SVG = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path fill="#fff" stroke="#111" stroke-width="1.2" d="M4 2l14 9-6 1 3 8-3 1-3-8-5 5z"/></svg>',
);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, maxMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume();
          resolve(res.statusCode);
        });
        req.on("error", reject);
        req.setTimeout(4000, () => req.destroy(new Error("timeout")));
      });
      return;
    } catch {
      await sleep(1500);
    }
  }
  throw new Error(`Server not ready: ${url}`);
}

async function injectCursor(page) {
  await page.addInitScript((svg) => {
    const style = document.createElement("style");
    style.textContent = `
      #rp-tutorial-cursor {
        position: fixed; left: 0; top: 0; width: 28px; height: 28px;
        pointer-events: none; z-index: 999999;
        transform: translate(-2px, -2px);
        transition: left 0.35s cubic-bezier(.22,1,.36,1), top 0.35s cubic-bezier(.22,1,.36,1);
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.45));
      }
      #rp-tutorial-cursor.click { transform: translate(-2px,-2px) scale(0.88); }
    `;
    document.head.appendChild(style);
    const el = document.createElement("div");
    el.id = "rp-tutorial-cursor";
    el.style.backgroundImage = `url("data:image/svg+xml,${svg}")`;
    el.style.backgroundSize = "contain";
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(el));
  }, CURSOR_SVG);
}

async function moveCursor(page, x, y, opts = {}) {
  const { click = false, pause = 500 } = opts;
  await page.mouse.move(x, y, { steps: 18 });
  await page.evaluate(({ px, py }) => {
    const c = document.getElementById("rp-tutorial-cursor");
    if (c) {
      c.style.left = `${px}px`;
      c.style.top = `${py}px`;
    }
  }, { px: x, py: y });
  await sleep(pause);
  if (click) {
    await page.evaluate(() => document.getElementById("rp-tutorial-cursor")?.classList.add("click"));
    await page.mouse.click(x, y);
    await sleep(200);
    await page.evaluate(() => document.getElementById("rp-tutorial-cursor")?.classList.remove("click"));
    await sleep(400);
  }
}

async function injectDemoSession(context) {
  await context.addInitScript((user) => {
    localStorage.setItem("rp_lang", "en");
    localStorage.setItem("rp_token", `local:${user.id}`);
    localStorage.setItem("rp_user", JSON.stringify(user));
    localStorage.setItem("rp_settings", JSON.stringify({
      aspect_ratio_default: "4:5",
      num_variations_default: 1,
      quality: "balanced",
      generation_mode: "balanced",
      personality: "professional",
      lang: "en",
      notifications: true,
    }));
  }, DEMO_USER);
}

async function showMockResult(page) {
  const img = `${BASE}/images/generate.jpg`;
  await page.evaluate((src) => {
    const host = document.querySelector('[data-testid="result-panel"]')?.parentElement
      || document.querySelector(".rp-editor-panel");
    if (!host) return;
    let box = document.getElementById("marketing-result-inject");
    if (!box) {
      box = document.createElement("div");
      box.id = "marketing-result-inject";
      box.style.cssText = "margin-top:12px;border-radius:14px;overflow:hidden;border:1px solid rgba(124,58,237,0.4);box-shadow:0 24px 80px rgba(0,0,0,0.5);animation:fadeIn .6s ease";
      host.appendChild(box);
    }
    box.innerHTML = `<img src="${src}" alt="Result" style="width:100%;display:block;aspect-ratio:4/5;object-fit:cover" />`;
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }, img);
}

async function downloadMusic(dest) {
  const url = process.env.TUTORIAL_MUSIC_URL
    || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";
  try {
    execSync(`curl -fsSL "${url}" -o "${dest}"`, { stdio: "pipe", timeout: 60000 });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  if (process.env.RECORD_LOCAL === "1" || BASE.includes("127.0.0.1") || BASE.includes("localhost")) {
    console.log("Waiting for dev server…");
    await waitForServer(BASE);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const videoDir = path.join(OUT_DIR, "raw-tutorial");
  await fs.mkdir(videoDir, { recursive: true });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: "en-US",
    recordVideo: { dir: videoDir, size: VIEWPORT },
  });

  await injectDemoSession(context);
  const page = await context.newPage();
  await injectCursor(page);

  console.log("1/6 Studio intro…");
  await page.goto(`${BASE}/app/studio`, { waitUntil: "networkidle", timeout: 90000 });
  await sleep(2000);

  console.log("2/6 Library section → Settings…");
  const libSection = page.locator('[data-testid="sidebar-section-library"]');
  const libBox = await libSection.boundingBox();
  if (libBox) {
    await moveCursor(page, libBox.x + libBox.width / 2, libBox.y + 10, { pause: 900 });
  }

  const settingsLink = page.locator('[data-testid="nav-settings"]');
  const setBox = await settingsLink.boundingBox();
  if (setBox) {
    await moveCursor(page, setBox.x + 40, setBox.y + setBox.height / 2, { pause: 700, click: true });
  } else {
    await page.goto(`${BASE}/app/settings`, { waitUntil: "networkidle" });
  }
  await sleep(2200);

  console.log("3/6 AI personalization…");
  const persPanel = page.locator('[data-testid="settings-panel-personality"]');
  await persPanel.scrollIntoViewIfNeeded();
  await sleep(800);
  const creative = page.locator('[data-testid="personality-creative"]');
  const crBox = await creative.boundingBox();
  if (crBox) {
    await moveCursor(page, crBox.x + crBox.width / 2, crBox.y + crBox.height / 2, { pause: 600, click: true });
  }
  await sleep(1200);

  console.log("4/6 Back to Studio…");
  const studioLink = page.locator('[data-testid="nav-generate"], [data-testid="nav-studio"]').first();
  const stBox = await studioLink.boundingBox();
  if (stBox) {
    await moveCursor(page, stBox.x + 30, stBox.y + stBox.height / 2, { pause: 500, click: true });
  } else {
    await page.goto(`${BASE}/app/studio`, { waitUntil: "networkidle" });
  }
  await sleep(2500);

  console.log("5/6 Prompt + Generate…");
  const promptAcc = page.locator('[data-testid="studio-acc-prompt"] button, [data-testid="studio-acc-prompt"] summary').first();
  if (await promptAcc.count()) await promptAcc.click().catch(() => {});
  await sleep(600);

  const prompt = page.locator('[data-testid="prompt-input"]');
  const prBox = await prompt.boundingBox();
  const samplePrompt = "Editorial portrait, soft studio light, cinematic depth, premium fashion campaign";
  if (prBox) {
    await moveCursor(page, prBox.x + 60, prBox.y + 40, { pause: 500, click: true });
  }
  await prompt.fill(samplePrompt, { timeout: 15000 }).catch(() => {});
  await sleep(1200);

  const genBtn = page.locator('[data-testid="generate-button"]');
  const gBox = await genBtn.boundingBox();
  if (gBox) {
    await moveCursor(page, gBox.x + gBox.width / 2, gBox.y + gBox.height / 2, { pause: 700, click: true });
  }
  await sleep(2800);

  console.log("6/6 Result preview…");
  await showMockResult(page);
  await sleep(4500);

  await context.close();
  await browser.close();

  const files = (await fs.readdir(videoDir)).filter((f) => f.endsWith(".webm"));
  if (!files.length) throw new Error("No video recorded");
  const rawWebm = path.join(videoDir, files[0]);
  const rawMp4 = path.join(OUT_DIR, "remakepix-tutorial-en-raw.mp4");
  const finalMp4 = path.join(OUT_DIR, "remakepix-tutorial-en.mp4");
  const musicMp3 = path.join(OUT_DIR, "assets", "tutorial-bgm.mp3");

  console.log("Converting video…");
  execSync(
    `ffmpeg -y -i "${rawWebm}" -vf "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:black,fps=30" -c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p -an "${rawMp4}"`,
    { stdio: "inherit" },
  );

  await fs.mkdir(path.dirname(musicMp3), { recursive: true });
  const hasMusic = await downloadMusic(musicMp3);

  const fontBold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
  const fontReg = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
  const captions = [
    { t: 0, d: 4, text: "Remake Pixel — Studio Tutorial" },
    { t: 4, d: 5, text: "Library → Settings → Personalization" },
    { t: 10, d: 5, text: "Choose your AI personality" },
    { t: 16, d: 5, text: "Write a prompt & generate" },
    { t: 22, d: 6, text: "Your image — in seconds" },
  ];
  const drawParts = captions.map((c) =>
    `drawtext=fontfile=${fontBold}:text='${c.text.replace(/'/g, "\\'")}':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=h-120:enable='between(t,${c.t},${c.t + c.d})'`,
  ).join(",");

  if (hasMusic) {
    execSync(
      `ffmpeg -y -i "${rawMp4}" -i "${musicMp3}" -filter_complex "[0:v]${drawParts}[v];[1:a]volume=0.22,afade=t=in:st=0:d=2,afade=t=out:st=28:d=4[a]" -map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 19 -c:a aac -b:a 128k -shortest -movflags +faststart "${finalMp4}"`,
      { stdio: "inherit" },
    );
  } else {
    execSync(
      `ffmpeg -y -i "${rawMp4}" -vf "${drawParts}" -c:v libx264 -preset fast -crf 19 -movflags +faststart -an "${finalMp4}"`,
      { stdio: "inherit" },
    );
  }

  const endCard = path.join(OUT_DIR, "endcard-tutorial.mp4");
  execSync(
    `ffmpeg -y -f lavfi -i color=c=0x0B0B0C:s=1440x900:d=3:rate=30 -vf "drawtext=fontfile=${fontBold}:text='remakepix.com':fontsize=52:fontcolor=0xF4F1EA:x=(w-text_w)/2:y=(h-text_h)/2-30,drawtext=fontfile=${fontReg}:text='Create. Edit. Personalize.':fontsize=28:fontcolor=0xC4B5FD:x=(w-text_w)/2:y=(h-text_h)/2+40" -c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p -an "${endCard}"`,
    { stdio: "inherit" },
  );

  const withEnd = path.join(OUT_DIR, "remakepix-tutorial-en-full.mp4");
  execSync(
    `ffmpeg -y -i "${finalMp4}" -i "${endCard}" -filter_complex "[0:v][0:a][1:v]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -preset fast -crf 19 -c:a aac -movflags +faststart "${withEnd}" 2>/dev/null || ffmpeg -y -i "${finalMp4}" -i "${endCard}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0" -c:v libx264 -preset fast -crf 19 -movflags +faststart "${withEnd}"`,
    { stdio: "inherit" },
  );

  const stat = await fs.stat(withEnd);
  console.log(`\n✅ Tutorial: ${withEnd} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
