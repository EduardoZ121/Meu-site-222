/**
 * Previews da grelha Pro (/app/pro — Refinamento fotorrealista).
 * Gerar: `node scripts/generate-pro-covers.mjs [--force]`
 */
export const PRO_PRESET_COVER_VERSION = "20260528-2";

const BASE = "/images/pro-covers";

export const PRO_PRESET_COVER_BY_ID = {
  original: `${BASE}/original.jpg`,
  expression: `${BASE}/expression.jpg`,
  softer: `${BASE}/softer.jpg`,
  cinematic: `${BASE}/cinematic.jpg`,
  ultra_real: `${BASE}/ultra_real.jpg`,
  iphone: `${BASE}/iphone.jpg`,
  studio: `${BASE}/studio.jpg`,
  smile: `${BASE}/smile.jpg`,
  seductive: `${BASE}/seductive.jpg`,
  model: `${BASE}/model.jpg`,
  intense: `${BASE}/intense.jpg`,
  romantic: `${BASE}/romantic.jpg`,
  fun: `${BASE}/fun.jpg`,
  fullbody: `${BASE}/fullbody.jpg`,
  lighting: `${BASE}/lighting.jpg`,
  skin_hair: `${BASE}/skin_hair.jpg`,
  outfit: `${BASE}/outfit.jpg`,
  color: `${BASE}/color.jpg`,
  eyes: `${BASE}/eyes.jpg`,
  max: `${BASE}/max.jpg`,
};

export function proPresetCoverSrc(presetId) {
  const path = PRO_PRESET_COVER_BY_ID[presetId];
  return path ? `${path}?v=${PRO_PRESET_COVER_VERSION}` : "";
}
