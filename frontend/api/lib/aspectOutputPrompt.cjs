/** @typedef {string} AspectRatio */

const MATCH_ASPECT = new Set(["", "match", "match_input_image", "original", "auto"]);

/** Dimensões alvo para instrução no prompt (Grok pode ignorar aspect_ratio com imagem). */
const TARGET_PIXELS = {
  "1:1": "1080×1080",
  "2:3": "1080×1620",
  "3:4": "1080×1440",
  "4:5": "1080×1350",
  "9:16": "1080×1920",
  "16:9": "1920×1080",
  "3:2": "1620×1080",
  "2:1": "1920×960",
  "1:2": "1080×2160",
  "21:9": "2560×1080",
  "9:21": "1080×2560",
};

/**
 * Reforça no prompt o formato de saída quando o modelo recebe foto de referência
 * (ex. Grok Imagine ignora aspect_ratio em image-to-image).
 *
 * @param {string} prompt
 * @param {AspectRatio} aspectRatio
 * @returns {string}
 */
function appendAspectOutputInstruction(prompt, aspectRatio) {
  const ar = String(aspectRatio || "").trim();
  if (!ar || MATCH_ASPECT.has(ar)) {
    return String(prompt || "").trim();
  }
  const px = TARGET_PIXELS[ar] || ar;
  const block = [
    "CRITICAL OUTPUT FORMAT (must obey — highest priority):",
    `Final poster MUST be exactly ${ar} aspect ratio (${px}), full-bleed edge-to-edge artwork.`,
    "Fill 100% of the canvas — NEVER add black bars, letterboxing, empty margins, or unpainted strips at top, bottom, or sides.",
    "Extend or crop background art to cover the full frame. All headline typography must be fully visible, never cut off at edges.",
    "Never output the same pixel width/height as the raw reference upload without completing the poster design.",
  ].join(" ");
  const base = String(prompt || "").trim();
  return base ? `${base}\n\n${block}` : block;
}

module.exports = { appendAspectOutputInstruction, MATCH_ASPECT, TARGET_PIXELS };
