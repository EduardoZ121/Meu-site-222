import { VIDEO_TOOL_IDS } from "./videoModels";

/** Motor Vídeo→Vídeo — Grok (NSFW-friendly) + Wan 2.7 (SFW / detalhado). */
export const GROK_VIDEO_EDIT = {
  id: VIDEO_TOOL_IDS.grok_edit,
  labelKey: "vid_edit_engine_grok",
  descKey: "vid_edit_engine_grok_desc",
  badgeKey: "vid_edit_engine_grok_badge",
  maxDurationSec: 8,
  durations: [8],
  resolutions: ["original"],
  showAspect: false,
  showReference: false,
  showAudio: false,
  showDuration: false,
  showResolution: false,
  requiresCloudUrl: true,
  nsfwFriendly: true,
};

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
  nsfwFriendly: false,
};

export const VIDEO_EDIT_ENGINES = [GROK_VIDEO_EDIT, WAN_VIDEO_EDIT];

export function getVideoEditEngine(engineId) {
  const id = String(engineId || "").trim();
  return VIDEO_EDIT_ENGINES.find((e) => e.id === id) || GROK_VIDEO_EDIT;
}

export function defaultVideoEditEngineId() {
  return VIDEO_TOOL_IDS.grok_edit;
}
