/** Client helpers — mirrors api/lib/motionFlyer pricing. */

export const MOTION_FLYER_DURATION = 10;

const SEEDANCE_ASPECT_RATIOS = [
  { label: "9:16", value: 9 / 16 },
  { label: "3:4", value: 3 / 4 },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
];

export function aspectRatioFromDimensions(width, height, fallback = "9:16") {
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

export function readImageFileDimensions(file) {
  if (!file || typeof window === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) {
        resolve(null);
        return;
      }
      resolve({
        width,
        height,
        ratio: aspectRatioFromDimensions(width, height),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export const MOTION_FLYER_STAGE_KEYS = [
  "mfly_stage_analyze",
  "mfly_stage_layers",
  "mfly_stage_prompt",
  "mfly_stage_generate",
  "mfly_stage_finalize",
  "mfly_stage_email",
];

export function computeMotionFlyerCostFromPricing(pricingMap) {
  if (pricingMap && pricingMap[10] != null) return pricingMap[10];
  return 200;
}

export function statusLabelKey(status) {
  if (status === "completed") return "mfly_status_completed";
  if (status === "refunded") return "mfly_status_refunded";
  if (status === "starting") return "mfly_status_starting";
  return "mfly_status_processing";
}
