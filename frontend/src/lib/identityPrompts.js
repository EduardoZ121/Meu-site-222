/** Client-side mirror of api/lib/identityPrompts.cjs (posters editor). */

export const POSTER_REFERENCE_PERSON =
  "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same person — preserve 100% of their face, "
  + "facial features, skin tone, ethnicity, hair texture and likeness. Seamlessly composite them into this poster "
  + "like professional photo retouching: unified lighting on face and body, natural skin blend, no floating cutout, "
  + "no pasted sticker look, no disjointed face layer. Place the subject in the pose/position described below while "
  + "keeping their real identity. Typography and graphic elements must sit in clear layout zones — never let text "
  + "overlap, cut through or hide behind the face; place headlines in negative space or on background layers "
  + "behind the subject when needed.";

export const POSTER_REFERENCE_FOOD =
  "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same dish — preserve plating, textures, colors "
  + "and food identity. Composite it naturally into the poster with matching lighting, perspective and shadows; "
  + "no floating cutout look.";

export const POSTER_REFERENCE_PRODUCT =
  "REFERENCE PHOTO (mandatory): Use the uploaded photo as the exact same product — preserve shape, colors, materials, "
  + "branding, packaging and proportions. Composite it naturally into the poster with matching lighting, perspective, "
  + "reflections and soft shadows; no floating cutout look.";

export const LEGACY_POSTER_REFERENCE_PERSON =
  "Use the provided reference image as the identity.\nReplace face and hair, preserve identity.";

export const LEGACY_POSTER_REFERENCE_FOOD =
  "Use the provided reference image as the dish.\n\nReplace the main food item with the dish from the reference image, preserving exact texture, colors, and details. Do not alter the dish identity.";

/** Duas pessoas reais — pôsteres IG com 2 fotos (principal + 2.ª pessoa). */
export const POSTER_DUAL_PERSON_BLOCK =
  "DUAL PERSON PHOTO COMPOSE — PHOTOREALISTIC (mandatory):\n"
  + "Two reference photos of TWO DIFFERENT REAL PEOPLE.\n"
  + "- Image 1 (MAIN upload): Person A — preserve 100% of their face, hair, skin tone, ethnicity, body type, age and outfit from image 1.\n"
  + "- Image 2 (REFERENCE upload): Person B — preserve 100% of their face, hair, skin tone, ethnicity, body type, age and outfit from image 2.\n"
  + "- Output ONE photograph with Person A AND Person B together in the same scene, both visible clearly.\n"
  + "- Both are FULL-SIZE ADULTS at equal scale — standing or posing together (side by side unless user says otherwise).\n"
  + "- Person B must NOT appear as a doll, toy, figurine, miniature, baby, prop, or blurred object in Person A's hands.\n"
  + "- Do NOT merge faces, do NOT clone one person twice, do NOT swap identities between the two photos.\n"
  + "- Natural unified lighting and realistic camera — magazine/editorial photo quality.";
