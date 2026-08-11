/** Locks for video edit presets — keep subject/pose/motion stable. */

const OUTFIT_VIDEO_LOCK =
  "IN-PLACE CLOTHING SWAP ONLY on the source footage — replace garment/fabric pixels, not the person. "
  + "LOCKED UNCHANGED: exact same person, face, facial features, skin tone, ethnicity, hair, "
  + "body type, body proportions, height, weight, silhouette, skeleton, limb positions, "
  + "head angle, gaze, facial expression, camera framing, camera angle, perspective, "
  + "background, environment, lighting on the subject, and the original motion/choreography timing. "
  + "Do NOT re-pose, do NOT change stance, do NOT slim or reshape the body, "
  + "do NOT change walking style, gestures, or body language.";

const BACKGROUND_VIDEO_LOCK =
  "BACKGROUND/SCENE SWAP ONLY. Keep the person completely unchanged: face, body, pose, motion, "
  + "camera framing, and subject lighting identical to the source clip.";

const RESTYLE_VIDEO_LOCK =
  "Apply the new look globally while preserving identity, pose, skeleton, motion timing, "
  + "and camera framing from the source clip.";

const RELIGHT_VIDEO_LOCK =
  "RELIGHT ONLY — change scene lighting, shadows, color temperature and grade. "
  + "Keep the person, pose, motion, composition, background layout and camera framing identical.";

const VFX_VIDEO_LOCK =
  "VFX EFFECT ONLY — apply the described visual effect with cinematic quality and temporal consistency. "
  + "LOCK unchanged unless explicitly part of the effect: person identity, face, body proportions, "
  + "skeleton, limb positions, head angle, gait, and camera framing. "
  + "No morphing artifacts, no duplicated limbs, no identity drift between frames.";

const GENERIC_VIDEO_LOCK =
  "Preserve the exact same person: identical face, facial features, eyes, skin tone, hair, "
  + "body shape, body proportions, pose, and natural motion in every frame. "
  + "Apply only the requested visual change. Photorealistic, temporally consistent, "
  + "no identity drift, no morphing artifacts, no extra limbs or duplicated body parts.";

function buildVideoEditPromptText(userPrompt, { preset = "" } = {}) {
  const base = String(userPrompt || "").trim();
  if (base.length < 3) {
    const err = new Error("Descreve a edição que queres (mín. 3 caracteres).");
    err.status = 400;
    throw err;
  }
  const key = String(preset || "").trim().toLowerCase();
  if (key === "outfit") {
    return `${base}. ${OUTFIT_VIDEO_LOCK}`;
  }
  if (key === "background") {
    return `${base}. ${BACKGROUND_VIDEO_LOCK}`;
  }
  if (key === "restyle") {
    return `${base}. ${RESTYLE_VIDEO_LOCK}`;
  }
  if (key === "relight") {
    return `${base}. ${RELIGHT_VIDEO_LOCK}`;
  }
  if (key === "vfx") {
    return `${base}. ${VFX_VIDEO_LOCK}`;
  }
  return `${base}. ${GENERIC_VIDEO_LOCK}`;
}

module.exports = {
  OUTFIT_VIDEO_LOCK,
  BACKGROUND_VIDEO_LOCK,
  RESTYLE_VIDEO_LOCK,
  RELIGHT_VIDEO_LOCK,
  VFX_VIDEO_LOCK,
  GENERIC_VIDEO_LOCK,
  buildVideoEditPromptText,
};
