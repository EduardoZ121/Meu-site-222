import { VIDEO_TOOL_IDS } from "./videoModels";

/** Duração máxima do motor Grok (Vídeo→Vídeo) — Replicate aceita até ~8.7 s. */
export const GROK_VIDEO_EDIT_MAX_SEC = 8;

/** Motores Vídeo→Vídeo — limites e UI por motor. */
export const VIDEO_EDIT_ENGINES = [
  {
    id: VIDEO_TOOL_IDS.wan_edit,
    labelKey: "vid_edit_engine_wan",
    descKey: "vid_edit_engine_wan_desc",
    badgeKey: "vid_edit_engine_wan_badge",
    maxDurationSec: 10,
    durations: [4, 6, 8, 10],
    resolutions: ["original", "720p", "1080p"],
    showAspect: true,
    showReference: true,
    showAudio: true,
    showDuration: true,
    showResolution: true,
    requiresCloudUrl: true,
    default: true,
  },
  {
    id: VIDEO_TOOL_IDS.kling_edit,
    labelKey: "vid_edit_engine_kling",
    descKey: "vid_edit_engine_kling_desc",
    badgeKey: "vid_edit_engine_kling_badge",
    maxDurationSec: 10,
    durations: [4, 6, 8, 10],
    resolutions: ["original", "720p", "1080p"],
    showAspect: true,
    showReference: true,
    showAudio: true,
    showDuration: true,
    showResolution: true,
    requiresCloudUrl: true,
    default: false,
  },
  {
    id: VIDEO_TOOL_IDS.grok_edit,
    labelKey: "vid_edit_engine_grok",
    descKey: "vid_edit_engine_grok_desc",
    badgeKey: "vid_edit_engine_grok_badge",
    maxDurationSec: GROK_VIDEO_EDIT_MAX_SEC,
    fixedDurationSec: GROK_VIDEO_EDIT_MAX_SEC,
    durations: [GROK_VIDEO_EDIT_MAX_SEC],
    resolutions: [],
    showAspect: false,
    showReference: false,
    showAudio: false,
    showDuration: true,
    showResolution: false,
    requiresCloudUrl: true,
    default: false,
  },
];

export function getVideoEditEngine(id) {
  return VIDEO_EDIT_ENGINES.find((e) => e.id === id) || VIDEO_EDIT_ENGINES[0];
}

export function defaultVideoEditEngineId() {
  return VIDEO_EDIT_ENGINES.find((e) => e.default)?.id || VIDEO_TOOL_IDS.wan_edit;
}
