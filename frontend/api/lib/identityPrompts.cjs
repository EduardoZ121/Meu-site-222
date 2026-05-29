/** Shared identity / compositing instructions for img2img flows. */

const PADRAO_IDENTITY_TRAIL =
  "Edit the reference photo in-place like professional retouching: preserve exact identity, same face, "
  + "facial structure, bone structure, skin tone and ethnicity (do not lighten, darken or alter undertones), "
  + "maintain original identity, do not change person or race, realistic face consistency for all skin tones "
  + "including deep and melanin-rich skin, preserve original facial expression, keep same emotion, "
  + "keep same eye expression, natural symmetric anatomy, no warped or melted features, "
  + "keep same pose and head angle unless the style explicitly requires otherwise";

const LEGACY_PADRAO_IDENTITY_TRAIL =
  "preserve identity, keep same face, keep facial structure, keep skin tone, maintain original identity, "
  + "do not change person, realistic face consistency, preserve original facial expression, keep same emotion, "
  + "keep same eye expression, keep same pose";

const PHOTO_EDIT_IDENTITY_BLOCK =
  "REFERENCE PHOTO EDIT (mandatory): Treat this as in-place photo retouching/compositing on the uploaded image — "
  + "not a face swap or sticker overlay. Keep the exact same person: identical face, bone structure, eyes, nose, "
  + "lips, skin tone, ethnicity and hair texture. Do not lighten, darken, bleach or shift undertones. "
  + "Avoid facial distortion, asymmetry, warped features or age changes. Preserve natural skin texture for all "
  + "ethnicities. Keep composition, pose and camera angle unless the edit explicitly requires a small adjustment.";

const POSTER_REFERENCE_PERSON =
  "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, "
  + "facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster "
  + "like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, "
  + "no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while "
  + "keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text "
  + "overlap, cut through or hide behind the face; place headlines in negative space or on background layers "
  + "behind the subject when needed.";

const POSTER_REFERENCE_FOOD =
  "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same dish — preserve plating, textures, colors "
  + "and food identity. Composite it naturally into the poster with matching lighting, perspective and shadows; "
  + "no floating cutout look.";

const LEGACY_POSTER_REFERENCE_PERSON =
  "Use the provided reference image as the identity.\nReplace face and hair, preserve identity.";

const LEGACY_POSTER_REFERENCE_FOOD =
  "Use the provided reference image as the dish.\n\nReplace the main food item with the dish from the reference image, preserving exact texture, colors, and details. Do not alter the dish identity.";

function appendPhotoEditIdentity(prompt) {
  const base = String(prompt || "").trim();
  if (!base || base.includes("REFERENCE PHOTO EDIT (mandatory)")) return base;
  return `${base}\n\n${PHOTO_EDIT_IDENTITY_BLOCK}`;
}

function upgradePadraoPrompt(prompt) {
  let out = String(prompt || "");
  if (out.includes(PADRAO_IDENTITY_TRAIL)) return out;
  if (out.includes(LEGACY_PADRAO_IDENTITY_TRAIL)) {
    out = out.split(LEGACY_PADRAO_IDENTITY_TRAIL).join(PADRAO_IDENTITY_TRAIL);
  }
  return out;
}

/** Qwen manga-interaction: two reference images = two different characters. */
function buildMangaDualCharacterBlock(nameA, nameB, descA = "", descB = "") {
  const a = String(nameA || "Character A").trim() || "Character A";
  const b = String(nameB || "Character B").trim() || "Character B";
  const lines = [
    "DUAL CHARACTER REFERENCE — MANDATORY (read before scene description):",
    `- Input reference image 1 is ONLY "${a}". ${a} must have the EXACT face, hairstyle, hair color, skin tone, ethnicity, body type and outfit from image 1.`,
    `- Input reference image 2 is ONLY "${b}". ${b} must have the EXACT face, hairstyle, hair color, skin tone, ethnicity, body type and outfit from image 2.`,
    `- ${a} and ${b} are DIFFERENT people. Do NOT swap identities. Do NOT use image 1's face on ${b}. Do NOT use image 2's face on ${a}.`,
    `- Do NOT invent random NPCs, generic anime gym extras, or stock characters. Only ${a} and ${b} when the panel lists them.`,
    "- Seamless in-place compositing: unified lighting, natural skin blend, no sticker/cutout look.",
    "- Only pose, expression and camera angle may change — never face, hair or skin identity.",
    "- Each manga panel section is isolated: do not merge unrelated beats or characters into one panel.",
  ];
  if (descA) lines.push(`- ${a} visual notes: ${String(descA).slice(0, 300)}`);
  if (descB) lines.push(`- ${b} visual notes: ${String(descB).slice(0, 300)}`);
  return lines.join("\n");
}

module.exports = {
  PADRAO_IDENTITY_TRAIL,
  LEGACY_PADRAO_IDENTITY_TRAIL,
  PHOTO_EDIT_IDENTITY_BLOCK,
  POSTER_REFERENCE_PERSON,
  POSTER_REFERENCE_FOOD,
  LEGACY_POSTER_REFERENCE_PERSON,
  LEGACY_POSTER_REFERENCE_FOOD,
  appendPhotoEditIdentity,
  upgradePadraoPrompt,
  buildMangaDualCharacterBlock,
};
