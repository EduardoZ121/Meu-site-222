/**
 * Montagem de prompts ocultos — Estúdio Artístico v2.
 * Identidade e idade da referência vêm PRIMEIRO; estilo só muda cena/grade.
 */

export const IDENTITY_LOCK =
  "MANDATORY REFERENCE EDIT: Edit the uploaded photo in-place. "
  + "Keep the EXACT same person — same face, eyes, nose, lips, jaw, skin tone, ethnicity, hair, body, pose and biological age. "
  + "Do NOT replace the subject. Do NOT change identity. Do NOT age or de-age. Do NOT add wrinkles. Do NOT change bone structure.";

function join(parts) {
  return parts.filter(Boolean).join(". ").replace(/\.\s*\./g, ".");
}

export function buildArtisticPhotoEditPrompt({
  userPrompt = "",
  stylePrompt = "",
  effects = [],
}) {
  const parts = [IDENTITY_LOCK];
  const trimmed = String(userPrompt || "").trim();
  if (trimmed) parts.push(`User request (priority): ${trimmed}`);
  if (stylePrompt) {
    parts.push(`Style treatment (scene/light/color only — face stays photoreal from reference): ${stylePrompt}`);
  }
  for (const fx of effects) {
    if (fx) parts.push(`Effect (background/grade only): ${fx}`);
  }
  parts.push("Final output must show the same person at the same age as the reference photo.");
  return join(parts);
}

export function buildArtisticTextPrompt({
  userPrompt = "",
  stylePrompt = "",
  effects = [],
}) {
  const parts = [];
  const trimmed = String(userPrompt || "").trim();
  if (trimmed) parts.push(trimmed);
  if (stylePrompt) parts.push(stylePrompt);
  for (const fx of effects) {
    if (fx) parts.push(fx);
  }
  parts.push("High quality, cohesive art direction.");
  return join(parts);
}
