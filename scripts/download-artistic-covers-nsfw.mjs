#!/usr/bin/env node
/**
 * Descarrega capas AI Lab (cat nsfw) via Pollinations — prompts únicos por estilo.
 * Uso: node scripts/download-artistic-covers-nsfw.mjs [--force]
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const OUT_DIR = path.join(ROOT, "frontend/public/images/artistic-covers");
const COVERS_JS = path.join(ROOT, "frontend/src/lib/artisticStyleCovers.js");
const FORCE = process.argv.includes("--force");
const DELAY_MS = 2500;

const PREVIEW_PROMPT_BY_ID = {
  lab_qwen_edit:
    "Futuristic AI photo editing mood, holographic monitors showing portrait before after, cyan magenta light, sci-fi lab, no text",
  lab_ai_rapid:
    "Fashion portrait with motion speed lines, rapid flash aesthetic, electric pink orange streaks, dynamic studio energy, no text",
  lab_cinematic_edit:
    "Cinematic anamorphic portrait in rain alley, teal orange grade, lens flare, film still drama, no text",
  lab_advanced_prompt:
    "Artistic double exposure portrait, layered ghosting faces, purple surreal editorial, no text",
  lab_experimental_ai:
    "Neon lab portrait soft glow tubes, experimental sci-fi beauty, pink cyan rim light, dark background, no text",
  lab_ultra_style:
    "Macro beauty portrait extreme skin detail sharp eyes, neutral grey studio, hyper-real campaign, no text",
  lab_flux_edit:
    "Saturated color portrait liquid light on skin, deep blue magenta, glossy fashion editorial, no text",
  lab_realistic_edit:
    "Photoreal window light portrait natural skin texture, documentary realism morning sun, no text",
  lab_hybrid_nsfw:
    "Digital art lab portrait chromatic aberration glitch edges, bold contrast modern, no text",

  nsfw_swimwear:
    "Tropical beach golden hour woman red bikini in waves back view sun flare travel editorial photo no text",
  nsfw_beach:
    "Sandy beach sunset woman white sarong wind hair ocean horizon vacation lifestyle photo no text",
  nsfw_lingerie_soft:
    "Boudoir lace lingerie bed window soft morning light romantic pastel side silhouette no text",
  nsfw_fitness_glam:
    "Gym fitness woman black sports bra dramatic side light sweat highlight industrial photo no text",
  nsfw_boudoir:
    "Boudoir velvet sofa silk robe warm lamp intimate editorial portrait no text",
  nsfw_pinup:
    "1950s retro pin-up polka dot backdrop red lipstick victory rolls vintage glamour stool photo no text",
  nsfw_dark:
    "Dark moody portrait single rim light deep shadows black dress smoke studio no text",
  nsfw_fantasy:
    "Fantasy warrior woman ornate armor magical forest bokeh epic painterly photo no text",

  nsfw_sheer:
    "High fashion sheer veil wind studio monochrome dramatic silhouette editorial no text",
  nsfw_figure_study:
    "Fine art figure study classical lighting museum black backdrop artistic side profile tasteful no text",
  nsfw_explicit_art:
    "Fine art chiaroscuro implied nude silk sheet shadow gallery mood no explicit detail no text",
  nsfw_intimate_couple:
    "Couple silhouette embrace bedroom warm lamp cinematic romantic editorial no text",
  nsfw_cosplay:
    "Cosplay fantasy mage woman glowing staff detailed costume purple lights convention photo no text",
  nsfw_wet_look:
    "Wet skin shower portrait water droplets shoulders cool blue tiles glossy beauty no text",
  nsfw_stockings:
    "Fashion legs stockings red heels marble floor luxury boudoir no face editorial no text",
  nsfw_oil_body:
    "Body oil gloss torso arms golden highlights dark studio athletic skin macro beauty no text",
  nsfw_oil_render:
    "Semi realistic 3D full body glossy oily wet skin HDR neutral studio athletic feminine cinematic no text",
  nsfw_explicit_pose:
    "Artistic silhouette behind frosted glass strong backlight contemporary gallery photo no text",
};

function loadNsfwStyles() {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const slice = src.slice(src.indexOf("export const ARTISTIC_STUDIO_STYLES = "));
  const arrEnd = slice.indexOf("];\n\nexport const ARTISTIC_EFFECT_SECTIONS");
  return new Function(`return ${slice.slice(slice.indexOf("["), arrEnd + 1)}`)().filter(
    (s) => s.cat === "nsfw",
  );
}

function pollinationsUrl(prompt) {
  const q = encodeURIComponent(`${prompt}. No text, no watermark, no logo.`);
  return `https://image.pollinations.ai/prompt/${q}?width=512&height=640&nologo=true&seed=${Math.floor(Math.random() * 1e9)}`;
}

async function patchCoversJs(ids) {
  let src = await fs.readFile(COVERS_JS, "utf8");
  const blockStart = "  // —— AI Lab (Admin) previews ——\n";
  if (!src.includes(blockStart)) {
    const insert = `${blockStart}${ids.map((id) => `  ${id}: "/images/artistic-covers/${id}.jpg",`).join("\n")}\n`;
    src = src.replace(
      /export const ARTISTIC_STYLE_COVER_BY_ID = \{\n/,
      `export const ARTISTIC_STYLE_COVER_BY_ID = {\n${insert}`,
    );
  } else {
    for (const id of ids) {
      const line = `  ${id}: "/images/artistic-covers/${id}.jpg",`;
      if (!src.includes(line)) {
        src = src.replace(blockStart, `${blockStart}${line}\n`);
      }
    }
  }
  await fs.writeFile(COVERS_JS, src);
}

async function main() {
  const styles = loadNsfwStyles();
  await fs.mkdir(OUT_DIR, { recursive: true });
  const ok = [];

  for (const style of styles) {
    const dest = path.join(OUT_DIR, `${style.id}.jpg`);
    if (!FORCE) {
      try {
        await fs.access(dest);
        console.log(`skip ${style.id}`);
        ok.push(style.id);
        continue;
      } catch {
        /* */
      }
    }
    const prompt = PREVIEW_PROMPT_BY_ID[style.id] || `Editorial preview ${style.label} ${style.suffix}`;
    const url = pollinationsUrl(prompt);
    console.log(`→ ${style.id}`);
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 8000) throw new Error("ficheiro demasiado pequeno");
        await fs.writeFile(dest, buf);
        ok.push(style.id);
        console.log(`  ✓ ${style.id} (${buf.length} bytes)`);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    if (lastErr) console.error(`  ✗ ${style.id}:`, lastErr.message);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  await patchCoversJs(ok);
  console.log(`\n${ok.length}/${styles.length} capas em ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
