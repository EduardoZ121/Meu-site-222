/** Instruções fixas — preservar identidade, idade e corpo em todas as edições com foto. */

export const AI_LAB_IDENTITY_LOCK =
  "CRITICAL EDIT RULES: Edit ONLY the provided reference photo. "
  + "Keep the EXACT same person — same face, facial features, eyes, nose, lips, jawline, skin tone, ethnicity, "
  + "biological age (do NOT age, de-age, add wrinkles, or make the subject look older or younger), "
  + "hair style and color, body shape, muscle definition, proportions, pose, hands, and camera angle. "
  + "Do NOT replace the subject, do NOT generate a different person, do NOT change identity. "
  + "Apply ONLY the specific changes listed below; face and body stay pixel-faithful to the reference.";

export const PHOTOGRAPHY_IDENTITY_LOCK =
  "CRITICAL PHOTOREAL EDIT RULES: Edit ONLY the provided reference photo. "
  + "Keep the EXACT same person — same face, facial features, eyes, nose, lips, skin tone, biological age, "
  + "hair style and color, body shape, height, weight, muscle definition, proportions, pose, hands, "
  + "and camera framing. "
  + "Do NOT replace the subject, do NOT generate a different person, do NOT change identity, "
  + "do NOT age or de-age the subject, do NOT slim, bulk, or reshape the body. "
  + "Apply ONLY the photographic style treatment and user-requested changes listed below; "
  + "everything else must stay pixel-consistent with the reference.";

export const ARTISTIC_IMAGE_IDENTITY_LOCK =
  "CRITICAL ARTISTIC EDIT RULES: Edit ONLY the provided reference photo. "
  + "Keep the EXACT same person — same face, facial features, eyes, nose, lips, jawline, skin tone, ethnicity, "
  + "biological age (do NOT age, de-age, add wrinkles, or make the subject look older or younger), "
  + "hair style and color, body shape, proportions, pose, hands, and camera framing. "
  + "Do NOT replace the subject, do NOT generate a different person. "
  + "Stylization may change rendering medium, lighting, color grade, outfit, and background ONLY — "
  + "the face and body must remain faithful to the reference photo.";

function joinParts(parts) {
  return parts.filter(Boolean).join(". ").replace(/\.\s*\./g, ".");
}

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
      `Photographic style treatment only (lighting, lens, color grade — do not alter face, age, wrinkles, or body structure): ${styleSuffix}`,
    );
  }
  for (const extra of extras) {
    if (extra) {
      parts.push(
        `Camera and atmosphere adjustment (background and grade only — do not age the face): ${extra}`,
      );
    }
  }
  parts.push(
    "Ultra high quality photorealistic output, professional photography finish, preserve exact facial age from reference.",
  );
  return joinParts(parts);
}

export function buildArtisticImageEditPrompt({
  userPrompt = "",
  styleSuffix = "",
  extras = [],
}) {
  const parts = [ARTISTIC_IMAGE_IDENTITY_LOCK];
  const trimmed = String(userPrompt || "").trim();
  if (trimmed) {
    parts.push(`Required changes (follow exactly, highest priority): ${trimmed}`);
  }
  if (styleSuffix) {
    parts.push(
      `Artistic style treatment (rendering, lighting, color — never alter face age, bone structure, or identity): ${styleSuffix}`,
    );
  }
  for (const extra of extras) {
    if (extra) {
      parts.push(
        `Scene lighting and color adjustment (not facial aging): ${extra}`,
      );
    }
  }
  parts.push(
    "Cohesive professional art direction; preserve exact facial age and identity from the reference photo.",
  );
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
    parts.push(`Required changes (follow exactly, highest priority): ${trimmed}`);
  }
  if (styleSuffix) {
    parts.push(
      `Visual treatment only (lighting, color grade, materials — do not alter face, age, or body structure): ${styleSuffix}`,
    );
  }
  for (const extra of extras) {
    if (extra) {
      parts.push(`Grade and atmosphere (preserve face age): ${extra}`);
    }
  }
  parts.push("Preserve exact facial age and identity from the reference; no added wrinkles or aging.");
  return joinParts(parts);
}
