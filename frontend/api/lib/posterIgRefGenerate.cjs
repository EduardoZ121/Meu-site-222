const PDF_RELEASE = require("./posterPdfReleaseTemplatesData.json");
const { buildPosterTextManifest } = require("./posterEngine.cjs");
const { posterLayoutCoverUrl } = require("./posterLayoutCover.cjs");
const {
  POSTER_REFERENCE_PERSON,
  PHOTO_EDIT_IDENTITY_BLOCK,
  buildPosterIgDualIdentityBlock,
} = require("./identityPrompts.cjs");

const NANO_BANANA_MODEL = "google/nano-banana";
const FLUX_MODEL = "black-forest-labs/flux-2-klein-9b";

const REALISM_BLOCK = (
  "Ultra-realistic photorealistic commercial poster, cinematic lighting, natural human skin texture, "
  + "realistic AI person (not cartoon, not 3D render, not illustration). "
  + "Edit reference identity in-place like professional retouching: preserve exact face, bone structure, "
  + "skin tone, ethnicity, body type, age and outfit from each uploaded photo. "
  + "Crisp legible typography on layout layers — headlines in negative space, never covering the face. "
  + "Premium quality: 8K, sharp focus, professional print design."
);

function getIgRefTemplate(templateId) {
  const id = String(templateId || "").trim();
  const direct = PDF_RELEASE.find((t) => t.id === id);
  if (direct) return direct;
  const familyId = id.replace(/__[^/]+$/, "");
  return PDF_RELEASE.find((t) => t.id === familyId) || null;
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

function buildIgRefIdentityPrompt(promptFinal, placeholders, template, { dual, hasLayout }) {
  const manifest = buildPosterTextManifest(placeholders, template?.placeholders);
  const body = String(promptFinal || "").trim()
    || applyPlaceholders(template?.prompt || "", placeholders, template?.replacements);

  const lines = [
    REALISM_BLOCK,
    dual ? buildPosterIgDualIdentityBlock(hasLayout) : POSTER_REFERENCE_PERSON,
    PHOTO_EDIT_IDENTITY_BLOCK,
    dual
      ? "- Output must show TWO DIFFERENT REAL PEOPLE from the two uploads — same faces, hair, skin and bodies as the photos."
      : "- Output must show the EXACT SAME PERSON as the uploaded photo — same face, hair, skin and body.",
    "- Do NOT invent new faces. Do NOT use stock models. Do NOT create dolls, toys or figurines.",
    "",
    body,
  ];

  if (manifest && !body.includes("EXACT COPY BLOCK")) {
    lines.push("", manifest);
  }

  return lines.filter(Boolean).join("\n\n");
}

function resolveIgRefLayoutUrl(templateId, variantKey) {
  return posterLayoutCoverUrl(process.env.SITE_URL || "https://www.remakepix.com", templateId, variantKey);
}

/**
 * Gera pôster IG — fotos do utilizador = identidade; prompt PDF = layout/estilo.
 * Dual (2 pessoas): FLUX Klein — melhor cópia de rosto/corpo.
 * Single + flux2: nano-banana. Single + grok: null (Grok no caller).
 */
function buildIgRefPosterGeneration({
  templateId,
  variantKey = "classic",
  placeholders = {},
  promptFinal = "",
  requiresDualPhoto = false,
  photoRef,
  secondPersonRef,
  selected = "flux2",
}) {
  const tpl = getIgRefTemplate(templateId);
  if (!tpl) return null;

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

  if (!dual && selected === "grok") {
    return null;
  }

  const layoutUrl = resolveIgRefLayoutUrl(templateId, variantKey);
  const prompt = buildIgRefIdentityPrompt(promptFinal, placeholders, tpl, {
    dual,
    hasLayout: Boolean(dual && layoutUrl),
  });

  if (dual) {
    const images = layoutUrl
      ? [photoRef, secondPersonRef, layoutUrl]
      : [photoRef, secondPersonRef];
    const input = {
      prompt,
      images,
      aspect_ratio: "3:4",
      disable_safety_checker: true,
      go_fast: false,
      output_format: "jpg",
      output_quality: 95,
    };
    return {
      prompt,
      input,
      modelId: FLUX_MODEL,
      modelUsed: selected === "grok"
        ? "FLUX Klein · IG 2 pessoas (económico)"
        : "FLUX Klein · IG 2 pessoas",
      aspectRatio: "3:4",
      variantKey,
      engine: "flux",
    };
  }

  const input = {
    prompt,
    aspect_ratio: "4:5",
    output_format: "jpg",
    image_input: [photoRef],
  };

  return {
    prompt,
    input,
    modelId: NANO_BANANA_MODEL,
    modelUsed: "google/nano-banana · identidade IG",
    aspectRatio: "4:5",
    variantKey,
    engine: "nano",
  };
}

module.exports = {
  NANO_BANANA_MODEL,
  FLUX_MODEL,
  getIgRefTemplate,
  buildIgRefPosterGeneration,
  resolveIgRefLayoutUrl,
};
