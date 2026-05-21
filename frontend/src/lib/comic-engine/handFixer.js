/**
 * Hand pose hints for generation — avoids bad hands when possible.
 */

const HANDS_VISIBLE_POSES = new Set(["talk", "attack", "surprise", "pointing"]);

export function poseShowsHands(poseId, handPose) {
  if (handPose === "hidden" || handPose === "in_pockets") return false;
  if (["fist", "open", "pointing", "holding", "peace", "waving"].includes(handPose)) {
    return true;
  }
  return HANDS_VISIBLE_POSES.has(poseId);
}

export function handPromptAddendum(poseId, handPose) {
  if (poseShowsHands(poseId, handPose)) {
    return "perfect hands, detailed fingers, anatomically correct hands";
  }
  return "hands hidden behind back, in pockets, or cropped out of frame — no visible fingers";
}

export function validateCustomPose(pose) {
  const warnings = [];
  if (!pose?.thumb && !pose?.previewUrl) {
    warnings.push({ type: "missing_preview", message: "Pose sem miniatura — difícil validar mãos." });
  }
  if (pose?.category === "fighting" && pose?.handPose !== "fist") {
    warnings.push({
      type: "hand_mismatch",
      message: "Poses de luta costumam precisar de punhos fechados.",
    });
  }
  return warnings;
}
