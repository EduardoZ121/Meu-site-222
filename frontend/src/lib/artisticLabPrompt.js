/** AI Lab — edição com foto; estilo só como tratamento visual. */

export const AI_LAB_IDENTITY_LOCK =
  "Edit only the provided reference photo. Keep the same person, face, apparent age, skin tone, hair, body, pose, and framing. "
  + "Do not replace the subject or change identity.";

export function buildAiLabEditPrompt({ userPrompt = "", styleSuffix = "" }) {
  const parts = [AI_LAB_IDENTITY_LOCK];
  const trimmed = String(userPrompt || "").trim();
  if (trimmed) {
    parts.push(`User request (priority): ${trimmed}`);
  }
  if (styleSuffix) {
    parts.push(`Visual style treatment only: ${styleSuffix}`);
  }
  return parts.filter(Boolean).join(". ");
}
