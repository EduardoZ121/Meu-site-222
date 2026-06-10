const { MATCH_ASPECT, TARGET_PIXELS } = require("./aspectOutputPrompt.cjs");

const OUTPUT_WIDTH = 1080;

function parseTargetPixels(aspectRatio) {
  const px = TARGET_PIXELS[String(aspectRatio || "").trim()];
  if (!px) return null;
  const parts = px.split("×").map((n) => Number(String(n).trim()));
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { w: parts[0], h: parts[1] };
}

function parseAspectRatio(aspectRatio) {
  const parts = String(aspectRatio || "").split(":").map((n) => Number(n));
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { w: parts[0], h: parts[1] };
}

async function loadImageBuffer(imageRef) {
  const ref = String(imageRef || "");
  if (ref.startsWith("data:")) {
    const comma = ref.indexOf(",");
    if (comma < 0) return null;
    return Buffer.from(ref.slice(comma + 1), "base64");
  }
  if (/^https?:\/\//i.test(ref)) {
    const res = await fetch(ref);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }
  return null;
}

/**
 * Recorta/encaixa a referência no rácio pedido (Grok Imagine ignora aspect_ratio com image).
 *
 * @param {string} imageRef data URI ou URL
 * @param {string} aspectRatio ex. 1:1, 2:3, 9:16
 * @returns {Promise<string|null>} data URI JPEG ou null se falhar
 */
async function fitImageRefToAspect(imageRef, aspectRatio, options = {}) {
  const ar = String(aspectRatio || "").trim();
  if (!imageRef || MATCH_ASPECT.has(ar)) return imageRef;

  const ratio = parseAspectRatio(ar);
  if (!ratio) return imageRef;

  const target = parseTargetPixels(ar);
  if (target) {
    return fitImageRefToPixelSize(imageRef, target.w, target.h, options.position || "centre");
  }

  const targetW = OUTPUT_WIDTH;
  const targetH = Math.round((targetW * ratio.h) / ratio.w);
  return fitImageRefToPixelSize(imageRef, targetW, targetH, options.position || "centre");
}

/**
 * Recorta a referência para dimensões exactas (evita letterbox no Motor GPT).
 *
 * @param {string} imageRef
 * @param {number} width
 * @param {number} height
 * @param {string} [position] sharp position — "bottom" deixa margem visual para headlines no topo
 */
async function fitImageRefToPixelSize(imageRef, width, height, position = "centre") {
  if (!imageRef || !width || !height) return imageRef;

  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    return imageRef;
  }

  const buf = await loadImageBuffer(imageRef);
  if (!buf?.length) return imageRef;

  try {
    const out = await sharp(buf, { failOn: "none" })
      .rotate()
      .resize(Math.round(width), Math.round(height), { fit: "cover", position })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return imageRef;
  }
}

module.exports = {
  fitImageRefToAspect,
  fitImageRefToPixelSize,
  parseAspectRatio,
  OUTPUT_WIDTH,
};
