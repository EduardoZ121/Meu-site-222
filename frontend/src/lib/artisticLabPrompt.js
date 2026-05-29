/** Instruções fixas para AI Lab — preservar identidade na edição Qwen. */

export const AI_LAB_IDENTITY_LOCK =
  "CRITICAL EDIT RULES: Edit ONLY the provided reference photo. "
  + "Keep the EXACT same person — same face, facial features, eyes, nose, lips, skin tone, "
  + "hair style and color, body shape, muscle definition, proportions, pose, hands, and camera angle. "
  + "Do NOT replace the subject, do NOT generate a different person, do NOT change identity. "
  + "Apply ONLY the specific changes listed below; everything else must stay pixel-consistent with the reference.";

/** Fotografia fotorrealista — bloqueio forte de identidade (rosto, idade, corpo, pose). */
export const PHOTOGRAPHY_IDENTITY_LOCK =
  "CRITICAL PHOTOREAL EDIT RULES: Edit ONLY the provided reference photo. "
  + "Keep the EXACT same person — same face, facial features, eyes, nose, lips, skin tone, age, "
  + "hair style and color, body shape, height, weight, muscle definition, proportions, pose, hands, "
  + "and camera framing. "
  + "Do NOT replace the subject, do NOT generate a different person, do NOT change identity, "
  + "do NOT age or de-age the subject, do NOT slim, bulk, or reshape the body. "
  + "Apply ONLY the photographic style treatment and user-requested changes listed below; "
  + "everything else must stay pixel-consistent with the reference.";

export function buildPhotographyEditPrompt({
  userPrompt = "",
  styleSuffix = "",
  extras = [],
}) {
  const parts = [PHOTOGRAPHY_IDENTITY_LOCK];
  const trimmed = String(userPrompt || "").trim();
  if (trimmed) {
    parts.push(`Required changes (follow exactly, highest priority): ${trimmed}`);
  }
  if (styleSuffix) {
    parts.push(
      `Photographic style treatment only (lighting, lens, color grade — do not alter face, age, or body structure): ${styleSuffix}`,
    );
  }
  for (const extra of extras) {
    if (extra) parts.push(extra);
  }
  parts.push(
    "Ultra high quality photorealistic output, professional photography finish, cohesive visual recipe, 8K detail where applicable.",
  );
  return parts.filter(Boolean).join(". ").replace(/\.\s*\./g, ".");
}

export function buildAiLabEditPrompt({ userPrompt = "", styleSuffix = "" }) {
  const parts = [AI_LAB_IDENTITY_LOCK];
  const trimmed = String(userPrompt || "").trim();
  if (trimmed) {
    parts.push(`Required changes (follow exactly, highest priority): ${trimmed}`);
  }
  if (styleSuffix) {
    parts.push(
      `Visual treatment only (lighting, skin material, color grade — do not alter face or body structure): ${styleSuffix}`,
    );
  }
  return parts.filter(Boolean).join(" ");
}
