/**
 * Motion flyer aspect ratio — derived from uploaded image (no platform picker).
 * Maps to nearest Seedance 2.0 supported ratio so the flyer is not force-cropped.
 */

const SEEDANCE_ASPECT_RATIOS = [
  { label: "9:16", value: 9 / 16 },
  { label: "3:4", value: 3 / 4 },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
];

function aspectRatioFromDimensions(width, height, fallback = "9:16") {
  const w = Math.round(Number(width) || 0);
  const h = Math.round(Number(height) || 0);
  if (w < 8 || h < 8) return fallback;

  const r = w / h;
  let best = SEEDANCE_ASPECT_RATIOS[0];
  let bestDiff = Infinity;

  for (const item of SEEDANCE_ASPECT_RATIOS) {
    const diff = Math.abs(Math.log(r / item.value));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = item;
    }
  }

  return best.label;
}

async function probeImageDimensionsFromFile(filepath) {
  if (!filepath) return null;
  try {
    const sharp = require("sharp");
    const meta = await sharp(filepath, { failOn: "none" }).metadata();
    const width = meta?.width;
    const height = meta?.height;
    if (!width || !height) return null;
    return { width, height };
  } catch {
    return null;
  }
}

async function probeImageDimensionsFromUrl(url) {
  const src = String(url || "").trim();
  if (!src.startsWith("http")) return null;
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(25_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const sharp = require("sharp");
    const meta = await sharp(buf, { failOn: "none" }).metadata();
    const width = meta?.width;
    const height = meta?.height;
    if (!width || !height) return null;
    return { width, height };
  } catch {
    return null;
  }
}

function parseClientDimensions(fields, textFn) {
  const w = Math.round(Number(textFn(fields, "image_width", "")) || 0);
  const h = Math.round(Number(textFn(fields, "image_height", "")) || 0);
  if (w >= 8 && h >= 8) return { width: w, height: h };
  return null;
}

async function resolveMotionFlyerAspectRatio({
  fields,
  files,
  imageUrls,
  fileOf,
  textFn,
  fallback = "9:16",
}) {
  const file = fileOf ? fileOf(files, "image_0") : null;
  let dims = file?.filepath ? await probeImageDimensionsFromFile(file.filepath) : null;

  if (!dims && imageUrls?.[0]) {
    dims = await probeImageDimensionsFromUrl(imageUrls[0]);
  }

  if (!dims && fields && textFn) {
    dims = parseClientDimensions(fields, textFn);
  }

  if (!dims) {
    return { aspectRatio: fallback, width: null, height: null, source: "fallback" };
  }

  return {
    aspectRatio: aspectRatioFromDimensions(dims.width, dims.height, fallback),
    width: dims.width,
    height: dims.height,
    source: "image",
  };
}

module.exports = {
  SEEDANCE_ASPECT_RATIOS,
  aspectRatioFromDimensions,
  probeImageDimensionsFromFile,
  probeImageDimensionsFromUrl,
  resolveMotionFlyerAspectRatio,
};
