import { VIDEO_TOOL_IDS } from "./videoModels";

/** Motor Vídeo→Vídeo — Wan 2.7 (único motor activo). */
export const WAN_VIDEO_EDIT = {
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
};

/** @deprecated Use WAN_VIDEO_EDIT — mantido para imports antigos. */
export const VIDEO_EDIT_ENGINES = [WAN_VIDEO_EDIT];

export function getVideoEditEngine() {
  return WAN_VIDEO_EDIT;
}

export function defaultVideoEditEngineId() {
  return VIDEO_TOOL_IDS.wan_edit;
}
