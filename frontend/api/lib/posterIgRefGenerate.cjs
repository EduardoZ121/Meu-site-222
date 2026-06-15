const PDF_RELEASE = require("./posterPdfReleaseTemplatesData.json");
const { posterLayoutCoverUrl } = require("./posterLayoutCover.cjs");
const { buildPosterTextManifest } = require("./posterEngine.cjs");

const NANO_BANANA_MODEL = "google/nano-banana";

function getIgRefTemplate(templateId) {
  const id = String(templateId || "").trim();
  return PDF_RELEASE.find((t) => t.id === id) || null;
}

function applyPlaceholders(raw, placeholders = {}, replacements = {}) {
  let out = String(raw || "");
  const merged = { ...replacements, ...placeholders };
  for (const [key, val] of Object.entries(merged)) {
    const v = String(val || "").trim();
    if (!v) continue;
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), v);
    const def = replacements[key];
    if (def && v !== def) {
      out = out.split(String(def)).join(v);
    }
  }
  return out;
}

function buildIgRefNanoBananaPrompt(basePrompt, placeholders, template, { dual }) {
  const manifest = buildPosterTextManifest(placeholders, template?.placeholders);
  const lines = [
    "EDIT POSTER LAYOUT (mandatory):",
    "- IMAGE 1 is the exact poster layout to preserve — same composition, crop, background, colors, typography zones, graphics and poses.",
    dual
      ? "- Replace ONLY the two people in IMAGE 1 with Person A from IMAGE 2 and Person B from IMAGE 3."
      : "- Replace ONLY the person in IMAGE 1 with the person from IMAGE 2.",
    "- Do NOT create a new design. Do NOT change the layout structure. Same poster, new faces.",
    dual
      ? "- Both people are full-size adults at equal scale — never dolls, toys, figurines or props."
      : "- Preserve 100% face identity from the photo upload.",
    "- All headline text must spell exactly as in EXACT COPY BLOCK — crisp, legible, no gibberish.",
    "",
    String(basePrompt || "").trim(),
  ];
  if (manifest) {
    lines.push("", manifest);
  }
  return lines.filter(Boolean).join("\n");
}

function resolveIgRefLayoutUrl(templateId, variantKey) {
  return posterLayoutCoverUrl(process.env.SITE_URL || "https://www.remakepix.com", templateId, variantKey);
}

/**
 * Gera pôster IG com nano-banana — mesmo motor das capas da grelha.
 * @returns {null | { prompt: string, input: object, modelId: string, modelUsed: string, aspectRatio: string }}
 */
function buildIgRefPosterGeneration({
  templateId,
  variantKey = "classic",
  placeholders = {},
  requiresDualPhoto = false,
  photoRef,
  secondPersonRef,
}) {
  const tpl = getIgRefTemplate(templateId);
  if (!tpl) return null;

  const layoutUrl = resolveIgRefLayoutUrl(templateId, variantKey);
  if (!layoutUrl) return null;

  const dual = Boolean(requiresDualPhoto || tpl.requiresDualPhoto);
  if (dual && (!photoRef || !secondPersonRef)) {
    const err = new Error("Este estilo exige 2 fotos — uma de cada pessoa (1.ª principal, 2.ª referência).");
    err.status = 400;
    throw err;
  }
  if (!dual && !photoRef) {
    const err = new Error("Este estilo exige foto de referência.");
    err.status = 400;
    throw err;
  }

  const basePrompt = applyPlaceholders(tpl.prompt, placeholders, tpl.replacements);
  const prompt = buildIgRefNanoBananaPrompt(basePrompt, placeholders, tpl, { dual });

  const imageInput = dual
    ? [layoutUrl, photoRef, secondPersonRef]
    : [layoutUrl, photoRef];

  const input = {
    prompt,
    aspect_ratio: "4:5",
    output_format: "jpg",
    image_input: imageInput,
  };

  return {
    prompt,
    input,
    modelId: NANO_BANANA_MODEL,
    modelUsed: "google/nano-banana · layout IG",
    aspectRatio: "4:5",
  };
}

module.exports = {
  NANO_BANANA_MODEL,
  getIgRefTemplate,
  buildIgRefPosterGeneration,
};
