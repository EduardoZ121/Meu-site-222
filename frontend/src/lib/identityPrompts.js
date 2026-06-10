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

export const LEGACY_POSTER_REFERENCE_PERSON =
  "Use the provided reference image as the identity.\nReplace face and hair, preserve identity.";

export const LEGACY_POSTER_REFERENCE_FOOD =
  "Use the provided reference image as the dish.\n\nReplace the main food item with the dish from the reference image, preserving exact texture, colors, and details. Do not alter the dish identity.";
