/**
 * Seedance 2.0 input builder (Replicate).
 */
const { getMarketingVideoProvider } = require("./marketingVideoModels.cjs");

const SEEDANCE_PROMPT_MAX = 3900;

const SEEDANCE_SAFETY_PREFIX =
  "PG-rated professional brand advertisement. Fully clothed subjects in commercial context. "
  + "No violence, weapons, gore, nudity, sexual content, or minors. Family-safe cinematic trailer.";

const SEEDANCE_LANGUAGE_FIXES = [
  [/\bsharingan[- ]?red\b/gi, "crimson red"],
  [/\bcombat[- ]ready\b/gi, "hero-ready"],
  [/\bmartial arts\b/gi, "choreographed cooking"],
  [/\bmartial precision\b/gi, "precise technique"],
  [/\bbattle map\b/gi, "styled ingredient layout"],
  [/\bbattle station\b/gi, "gaming setup"],
  [/\bcircular knife movement\b/gi, "circular slicing motion"],
  [/\bknife flips once\b/gi, "tool flourish once"],
  [/\bchef knife\b/gi, "kitchen knife"],
  [/\bknife wipes clean\b/gi, "blade wipes clean"],
  [/\bline of action\b/gi, "hero stance"],
];

function sanitizeSeedanceLanguage(prompt) {
  let out = String(prompt || "");
  for (const [pattern, replacement] of SEEDANCE_LANGUAGE_FIXES) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

function adaptPromptForImageMode(prompt) {
  return String(prompt || "")
    .replace(/\[Image1\]/gi, "the subject in the input photo")
    .replace(/\[Image(\d+)\]/gi, "reference $1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function clampPromptForSeedance(prompt, max = SEEDANCE_PROMPT_MAX) {
  const s = String(prompt || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastBreak = Math.max(cut.lastIndexOf("\n\n"), cut.lastIndexOf(". "));
  if (lastBreak > max * 0.65) return cut.slice(0, lastBreak + 1).trim();
  return `${cut.trim()}…`;
}

/**
 * @param {object} opts
 * @param {"auto"|"image"|"reference"} [opts.inputMode] — image-to-video is less strict for portraits
 */
function buildSeedanceInput({
  prompt,
  imageUrls,
  duration,
  providerId,
  aspectRatio,
  generateAudio,
  inputMode = "auto",
}) {
  const provider = getMarketingVideoProvider(providerId);
  const urls = (imageUrls || []).filter(Boolean).slice(0, provider.maxReferenceImages);
  if (!urls.length) {
    const err = new Error("Envia pelo menos uma imagem.");
    err.status = 400;
    throw err;
  }

  const dur = Math.min(provider.maxDuration, Math.max(4, Math.round(Number(duration) || 6)));
  const ratio = String(aspectRatio || provider.defaultAspect || "9:16").trim() || "9:16";
  const audio = typeof generateAudio === "boolean" ? generateAudio : provider.generateAudio;
  const body = sanitizeSeedanceLanguage(String(prompt || "").trim());
  const useImageMode = inputMode === "image" || (inputMode === "auto" && urls.length === 1);
  const safePrompt = clampPromptForSeedance(
    `${SEEDANCE_SAFETY_PREFIX}\n\n${useImageMode ? adaptPromptForImageMode(body) : body}`,
  );

  const input = {
    prompt: safePrompt,
    duration: dur,
    aspect_ratio: ratio,
    resolution: provider.defaultResolution,
    generate_audio: audio,
  };

  if (useImageMode) {
    input.image = urls[0];
  } else {
    input.reference_images = urls;
  }

  return {
    modelId: provider.replicateModel,
    providerId: provider.id,
    input,
  };
}

module.exports = {
  SEEDANCE_PROMPT_MAX,
  SEEDANCE_SAFETY_PREFIX,
  sanitizeSeedanceLanguage,
  adaptPromptForImageMode,
  clampPromptForSeedance,
  buildSeedanceInput,
};
