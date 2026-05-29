/** Prompts ocultos — edição com foto: rosto e idade da referência são sagrados. */

export const PHOTO_IDENTITY_LOCK =
  "REFERENCE PHOTO EDIT: Edit the uploaded image in-place only. "
  + "Keep the EXACT same person — same face, eyes, nose, lips, jaw, skin tone, ethnicity, hair, body shape, pose and age. "
  + "Do NOT replace the subject, do NOT change identity, do NOT age or de-age, do NOT add wrinkles or change bone structure.";

export const AI_LAB_IDENTITY_LOCK =
  `${PHOTO_IDENTITY_LOCK} `
  + "Apply ONLY the changes listed below; everything else stays pixel-faithful to the reference.";

function joinParts(parts) {
  return parts.filter(Boolean).join(". ").replace(/\.\s*\./g, ".");
}

/** Estilos artísticos (anime, óleo, vintage, etc.) — o look não pode alterar o rosto. */
export function wrapStyleSuffixForPhotoEdit(suffix) {
  const s = String(suffix || "").trim();
  if (!s) return "";
  return (
    "Style look for background, lighting, color grade, clothing and atmosphere ONLY — "
    + "keep the reference face photoreal and unchanged (same person, same age, same bone structure): "
    + s
  );
}

export function buildPhotoStyleEditPrompt({
  userPrompt = "",
  styleSuffix = "",
  extras = [],
}) {
  const parts = [PHOTO_IDENTITY_LOCK];
  const trimmed = String(userPrompt || "").trim();
  if (trimmed) {
    parts.push(`User request (highest priority): ${trimmed}`);
  }
  const wrapped = wrapStyleSuffixForPhotoEdit(styleSuffix);
  if (wrapped) parts.push(wrapped);
  for (const extra of extras) {
    if (extra) {
      parts.push(`Scene adjustment only (not face or age): ${extra}`);
    }
  }
  parts.push("Output must look like the same person from the reference photo.");
  return joinParts(parts);
}

export function buildPhotographyEditPrompt({
  userPrompt = "",
  styleSuffix = "",
  extras = [],
}) {
  const parts = [PHOTO_IDENTITY_LOCK];
  const trimmed = String(userPrompt || "").trim();
  if (trimmed) {
    parts.push(`User request (highest priority): ${trimmed}`);
  }
  const wrapped = wrapStyleSuffixForPhotoEdit(styleSuffix);
  if (wrapped) {
    parts.push(
      `Photographic treatment only (lens, light, grade — never alter face or age): ${wrapped}`,
    );
  }
  for (const extra of extras) {
    if (extra) {
      parts.push(`Camera/atmosphere only: ${extra}`);
    }
  }
  parts.push("Photoreal finish; same face and age as reference.");
  return joinParts(parts);
}

export function buildAiLabEditPrompt({
  userPrompt = "",
  styleSuffix = "",
  extras = [],
}) {
  const parts = [AI_LAB_IDENTITY_LOCK];
  const trimmed = String(userPrompt || "").trim();
  if (trimmed) {
    parts.push(`User request (highest priority): ${trimmed}`);
  }
  const wrapped = wrapStyleSuffixForPhotoEdit(styleSuffix);
  if (wrapped) parts.push(wrapped);
  for (const extra of extras) {
    if (extra) parts.push(`Grade only: ${extra}`);
  }
  return joinParts(parts);
}
