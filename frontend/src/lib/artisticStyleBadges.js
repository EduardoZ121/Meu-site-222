import { isArtisticExperimentalStyle } from "./artisticLabStyles";

const POPULAR_IDS = new Set([
  "photo_cinematic",
  "photo_glamour",
  "dig_anime",
  "anime_ghibli",
  "toon_disney_3d",
  "dig_cyberpunk",
  "photo_editorial",
  "fan_epic",
]);

const NEW_IDS = new Set([
  "lab_qwen_edit",
  "lab_cinematic_edit",
  "anime_vtuber",
  "dig_holographic",
  "mod_y2k",
]);

/** @returns {"popular"|"new"|"pro"|"experimental"|null} */
export function getArtisticStyleBadge(style) {
  if (!style) return null;
  if (style.labPreset || isArtisticExperimentalStyle(style.id)) return "experimental";
  if (style.tier === "heavy") return "pro";
  if (NEW_IDS.has(style.id)) return "new";
  if (POPULAR_IDS.has(style.id)) return "popular";
  return null;
}
