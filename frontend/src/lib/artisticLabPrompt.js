/** Instruções fixas para AI Lab — preservar identidade na edição Qwen. */

export const AI_LAB_IDENTITY_LOCK =
  "CRITICAL EDIT RULES: Edit ONLY the provided reference photo. "
  + "Keep the EXACT same person — same face, facial features, eyes, nose, lips, skin tone, "
  + "hair style and color, body shape, muscle definition, proportions, pose, hands, and camera angle. "
  + "Do NOT replace the subject, do NOT generate a different person, do NOT change identity. "
  + "Apply ONLY the specific changes listed below; everything else must stay pixel-consistent with the reference.";

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
