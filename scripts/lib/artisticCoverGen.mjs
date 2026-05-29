/**
 * Geração de capas Estúdio Artístico — proporção 4:5 alinhada aos cards (aspect-[4/5]).
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");
const require = createRequire(import.meta.url);

const REPO_RAW =
  "https://raw.githubusercontent.com/EduardoZ121/Meu-site-222/main/scripts/assets";

export const OUT_DIR = path.join(ROOT, "frontend/public/images/artistic-covers");
export const PRO_OUT_DIR = path.join(ROOT, "frontend/public/images/pro-covers");
export const REF_WOMAN_GITHUB = `${REPO_RAW}/ref_user_woman.jpg`;
export const REF_MAN_GITHUB = `${REPO_RAW}/ref_user_man.jpg`;
/** @deprecated use REF_WOMAN_GITHUB */
export const REF_GITHUB = REF_WOMAN_GITHUB;

/** 4:5 — igual ao aspect-[4/5] do ArtisticStyleCard */
export const COVER_WIDTH = "640";
export const COVER_HEIGHT = "800";

export const FRAMING =
  "Centered portrait composition, face and shoulders fully visible, comfortable headroom and side margins, "
  + "subject fills the vertical 4:5 frame naturally, no awkward crop of head or chin, "
  + "professional photography crop, sharp focus on face.";

const IDENTITY_BY_SUBJECT = {
  woman:
    "Same woman from the reference photo as the subject, keep her recognizable face, hair color and likeness. "
    + "Single woman, clean composition, correct anatomy, no extra limbs, no deformed hands. ",
  man:
    "Same man from the reference photo as the subject, keep his recognizable face, hair and likeness. "
    + "Single man, clean composition, correct anatomy, no extra limbs, no deformed hands. ",
};

export function identityWithFraming(subject = "woman") {
  const base = IDENTITY_BY_SUBJECT[subject] || IDENTITY_BY_SUBJECT.woman;
  return base + FRAMING;
}

export function loadStylesByCat(cat, promptById) {
  const modPath = path.join(ROOT, "frontend/src/lib/artisticStudioData.js");
  const src = require("fs").readFileSync(modPath, "utf8");
  const slice = src.slice(src.indexOf("export const ARTISTIC_STUDIO_STYLES = "));
  const arrEnd = slice.indexOf("];\n\nexport const ARTISTIC_EFFECT_SECTIONS");
  return new Function(`return ${slice.slice(slice.indexOf("["), arrEnd + 1)}`)().filter(
    (s) => s.cat === cat && promptById[s.id],
  );
}

export function pollinationsUrl(prompt, refImage, seed, negativePrompt) {
  const q = encodeURIComponent(`${prompt} No text, no watermark, no logo.`);
  const params = new URLSearchParams({
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    model: "flux",
    nologo: "true",
    enhance: "false",
    seed: String(seed),
    image: refImage,
    negative_prompt: negativePrompt,
  });
  return `https://image.pollinations.ai/prompt/${q}?${params.toString()}`;
}

export function seedFromId(id) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 999999;
}

export async function generateCovers(
  styles,
  promptById,
  { force = false, delayMs = 4500, negativePrompt, refById = {}, outDir = OUT_DIR },
) {
  await fs.mkdir(outDir, { recursive: true });

  for (const style of styles) {
    const dest = path.join(outDir, `${style.id}.jpg`);
    if (!force) {
      try {
        await fs.access(dest);
        console.log(`skip ${style.id}`);
        continue;
      } catch {
        /* */
      }
    }

    const prompt = promptById[style.id];
    const refImage = refById[style.id] || REF_WOMAN_GITHUB;
    const url = pollinationsUrl(prompt, refImage, seedFromId(style.id), negativePrompt);
    const refLabel = /(?:^|[_/])(?:ref_)?(?:user_)?man(?:\.|$)/.test(refImage) ? "man" : "woman";
    console.log(`→ ${style.id} (${style.label}) ref=${refLabel}`);

    let ok = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 12000) throw new Error("resposta inválida");
        await fs.writeFile(dest, buf);
        console.log(`  ✓ ${buf.length} bytes`);
        ok = true;
        break;
      } catch (e) {
        console.warn(`  tentativa ${attempt + 1} falhou:`, e.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    if (!ok) console.error(`  ✗ ${style.id} falhou`);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  console.log("\nConcluído.");
}
