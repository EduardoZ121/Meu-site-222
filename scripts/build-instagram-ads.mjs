/**
 * 2 Instagram ad reels (9:16) + reusable logo outro.
 * Style A: transformation / wow (ref DVvJpDA — fast before→after + hook)
 * Style B: 3 steps UI (ref DVOWhkL — numbered kinetic + app flow)
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import {
  hookCard, imageClip, stepCard, fitVertical, concatClips, writeConcatList, addMusic, run,
} from "./lib/ffmpeg-reel.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "marketing");
const IMG = path.join(ROOT, "frontend/public/images");
const TMP = path.join(OUT, "ig-build-tmp");
const MUSIC = path.join(OUT, "assets/tutorial-bgm.mp3");

async function ensureMusic() {
  try {
    await fs.access(MUSIC);
  } catch {
    execSync(`curl -fsSL "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" -o "${MUSIC}"`, { stdio: "pipe" });
  }
}

async function extractClip(srcVideo, start, duration, out) {
  run(
    `ffmpeg -y -ss ${start} -i "${srcVideo}" -t ${duration} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" -c:v libx264 -preset fast -crf 18 -an "${out}"`,
  );
}

/** REEL 1 — Transformation / viral hook (inspired by AI before-after reels) */
async function buildReel1(outroPath) {
  await fs.mkdir(TMP, { recursive: true });
  const clips = [];

  const c1 = path.join(TMP, "r1-hook.mp4");
  hookCard(c1, "YOUR PHOTO.", "STUDIO-READY IN SECONDS", 1.4);
  clips.push(c1);

  const c2 = path.join(TMP, "r1-before.mp4");
  imageClip(path.join(IMG, "founder.jpg"), c2, 1.3, "in");
  clips.push(c2);

  const c3 = path.join(TMP, "r1-after.mp4");
  imageClip(path.join(IMG, "generate.jpg"), c3, 1.4, "out");
  clips.push(c3);

  const c4 = path.join(TMP, "r1-hook2.mp4");
  hookCard(c4, "ONE PROMPT.", "INFINITE STYLES", 1.1, "0xC4B5FD");
  clips.push(c4);

  // App UI from existing demo
  const demo = path.join(OUT, "demo-login-dashboard-mobile.mp4");
  try {
    await fs.access(demo);
    const u1 = path.join(TMP, "r1-ui1.mp4");
    const u2 = path.join(TMP, "r1-ui2.mp4");
    await extractClip(demo, 38, 2.2, u1);
    await extractClip(demo, 48, 2.5, u2);
    clips.push(u1, u2);
  } catch {
    imageClip(path.join(IMG, "styles-grid.jpg"), path.join(TMP, "r1-fallback.mp4"), 2.5, "in");
    clips.push(path.join(TMP, "r1-fallback.mp4"));
  }

  const styles = ["men_luxury.jpg", "u_bw_chiar.jpg", "men_underwater.jpg", "men_darkhero.jpg"].map((f) => path.join(IMG, "padrao-covers", f));
  for (let i = 0; i < 3; i += 1) {
    const p = styles[i];
    try {
      await fs.access(p);
      const o = path.join(TMP, `r1-style${i}.mp4`);
      imageClip(p, o, 0.85, i % 2 ? "out" : "in");
      clips.push(o);
    } catch { /* skip */ }
  }

  const cCta = path.join(TMP, "r1-cta.mp4");
  hookCard(cCta, "50 FREE CREDITS", "remakepix.com", 1.2);
  clips.push(cCta);

  clips.push(outroPath);

  const list = await writeConcatList(TMP, clips);
  const raw = path.join(OUT, "ig-ad-reel-transform-raw.mp4");
  concatClips(list, raw);

  const final = path.join(OUT, "ig-ad-reel-transform.mp4");
  await ensureMusic();
  addMusic(raw, MUSIC, final, 0.32);
  return final;
}

/** REEL 2 — 3 steps + UI (inspired by tutorial/step reels) */
async function buildReel2() {
  await fs.mkdir(TMP, { recursive: true });
  const clips = [];

  const open = path.join(TMP, "r2-open.mp4");
  hookCard(open, "CREATE IN 3 STEPS", "REMAKE PIXEL STUDIO", 1.3);
  clips.push(open);

  const s1 = path.join(TMP, "r2-s1.mp4");
  stepCard(s1, "01", "OPEN STUDIO", 1.1);
  clips.push(s1);

  const s2 = path.join(TMP, "r2-s2.mp4");
  stepCard(s2, "02", "WRITE PROMPT", 1.1);
  clips.push(s2);

  const s3 = path.join(TMP, "r2-s3.mp4");
  stepCard(s3, "03", "GENERATE", 1.1);
  clips.push(s3);

  const demo = path.join(OUT, "demo-login-dashboard-mobile.mp4");
  try {
    await fs.access(demo);
    const seg = [
      [8, 2.0], [22, 2.2], [35, 2.5], [48, 2.8],
    ];
    for (let i = 0; i < seg.length; i += 1) {
      const o = path.join(TMP, `r2-ui${i}.mp4`);
      await extractClip(demo, seg[i][0], seg[i][1], o);
      clips.push(o);
    }
  } catch {
    imageClip(path.join(IMG, "dashboard-mockup.jpg"), path.join(TMP, "r2-dash.mp4"), 3, "in");
    clips.push(path.join(TMP, "r2-dash.mp4"));
  }

  imageClip(path.join(IMG, "generate.jpg"), path.join(TMP, "r2-result.mp4"), 1.8, "out");
  clips.push(path.join(TMP, "r2-result.mp4"));

  const end = path.join(TMP, "r2-end.mp4");
  hookCard(end, "START FREE TODAY", "LINK IN BIO · remakepix.com", 1.6, "0xC4B5FD");
  clips.push(end);

  const list = await writeConcatList(TMP, clips);
  const raw = path.join(OUT, "ig-ad-reel-steps-raw.mp4");
  concatClips(list, raw);

  const final = path.join(OUT, "ig-ad-reel-steps.mp4");
  await ensureMusic();
  addMusic(raw, MUSIC, final, 0.3);
  return final;
}

async function main() {
  console.log("1/3 Logo outro motion…");
  execSync(`node "${path.join(__dirname, "render-logo-outro.mjs")}"`, { stdio: "inherit" });

  const outro = path.join(OUT, "rp-logo-outro-9x16.mp4");
  await fs.access(outro);

  console.log("2/3 Reel 1 — Transform / WOW…");
  const r1 = await buildReel1(outro);

  console.log("3/3 Reel 2 — 3 Steps…");
  const r2 = await buildReel2();

  console.log("\n✅ Deliverables:");
  console.log(`   Logo outro (reuse): ${outro}`);
  console.log(`   Logo 1:1:         ${path.join(OUT, "rp-logo-outro-1x1.mp4")}`);
  console.log(`   Ad Reel 1:        ${r1}`);
  console.log(`   Ad Reel 2:        ${r2}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
