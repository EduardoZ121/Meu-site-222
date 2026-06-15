/** Motion flyer — aspect ratio comes from the uploaded image, not platform presets. */
const { aspectRatioFromDimensions } = require("./motionFlyerAspect.cjs");

function resolveMotionFlyerAspectRatio(aspectRatioOrLegacyFormat, fallback = "9:16") {
  const raw = String(aspectRatioOrLegacyFormat || "").trim();
  if (/^\d+:\d+$/.test(raw)) return raw;
  return fallback;
}

function resolveMotionFlyerAspectFromImage({ width, height, aspectRatio, fallback = "9:16" } = {}) {
  if (width && height) {
    return aspectRatioFromDimensions(width, height, fallback);
  }
  if (aspectRatio && /^\d+:\d+$/.test(String(aspectRatio))) {
    return String(aspectRatio).trim();
  }
  return fallback;
}

module.exports = {
  resolveMotionFlyerAspectRatio,
  resolveMotionFlyerAspectFromImage,
  aspectRatioFromDimensions,
};
