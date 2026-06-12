/** Video tool registry — Replicate models, pricing keys, input builders. */

const MODELS = {
  grok: "xai/grok-imagine-video",
  kling_turbo: "kwaivgi/kling-v2.5-turbo-pro",
  wan_t2v_fast: "wan-video/wan-2.2-t2v-fast",
  wan_i2v_fast: "wan-video/wan-2.2-i2v-fast",
  wan_edit: "wan-video/wan-2.7-videoedit",
  kling_edit: "kwaivgi/kling-o1",
  grok_edit: "xai/grok-imagine-video",
  wan_extend: "wan-video/wan-2.7-i2v",
};

const WAN_ASPECT = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "16:9",
  "4:5": "9:16",
};

const KLING_ASPECT = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "1:1",
  "4:5": "9:16",
};

const TOOL_META = {
  grok: {
    modelKey: "grok",
    costKey: "videoImage",
    flow: "generate",
    needsImage: true,
    testMode: true,
    durations: [4, 6, 8],
    defaultDuration: 6,
  },
  kling_turbo: {
    modelKey: "kling_turbo",
    costKey: "videoMarketing",
    costKeyImage: "videoMarketingImage",
    flow: "generate",
    needsImage: false,
    optionalImage: true,
    testMode: false,
    durations: [5, 10],
    defaultDuration: 5,
  },
  wan_t2v_fast: {
    modelKey: "wan_t2v_fast",
    costKey: "videoFast",
    flow: "generate",
    needsImage: false,
    testMode: true,
    durations: [5],
    defaultDuration: 5,
  },
  wan_i2v_fast: {
    modelKey: "wan_i2v_fast",
    costKey: "videoFastImage",
    flow: "generate",
    needsImage: true,
    testMode: true,
    durations: [5],
    defaultDuration: 5,
  },
  kling_elements: {
    modelKey: "kling_turbo",
    costKey: "videoElements",
    flow: "generate",
    needsImage: true,
    optionalReference: true,
    testMode: false,
    durations: [5, 10],
    defaultDuration: 5,
  },
  wan_edit: {
    modelKey: "wan_edit",
    costKey: "videoEdit",
    flow: "edit",
  },
  kling_edit: {
    modelKey: "kling_edit",
    costKey: "videoEdit",
    flow: "edit",
  },
  grok_edit: {
    modelKey: "grok_edit",
    costKey: "videoEdit",
    flow: "edit",
  },
  wan_extend: {
    modelKey: "wan_extend",
    costKey: "videoExtend",
    flow: "extend",
    durations: [4, 6, 8, 10],
    defaultDuration: 6,
  },
};

const PRESET_PROMPT_PREFIX = {
  background: "Change the background only — keep the person, pose, motion and lighting on the subject identical. New background: ",
  outfit: "Change the outfit/clothing only — preserve face, body, pose, motion and background. New look: ",
  restyle: "Restyle the entire video with this aesthetic while preserving motion and composition: ",
  marketing: "Professional marketing video, polished camera motion, brand-ready look: ",
  fun: "Fun, playful, viral social clip with energetic motion: ",
};

function resolveToolId(raw, { hasPhoto = false, preset = "" } = {}) {
  const id = String(raw || "").trim().toLowerCase();
  if (id === "grok") return "grok";
  if (id === "kling_elements" || id === "elements") return "kling_elements";
  if (id === "wan_t2v_fast" || id === "text-fast" || id === "fun" || preset === "fun") return "wan_t2v_fast";
  if (id === "wan_i2v_fast" || id === "image-fast") return "wan_i2v_fast";
  if (id === "wan_extend" || id === "extend") return "wan_extend";
  if (id === "wan_edit" || id === "wan-2.7" || id === "wan") return "wan_edit";
  if (id === "kling_edit" || id === "kling-o1" || id === "kling_o1") {
    return "kling_edit";
  }
  if (id === "kling_turbo" || id === "kling" || id === "text-marketing" || id === "image-marketing" || preset === "marketing") {
    return "kling_turbo";
  }
  if (hasPhoto && id === "image") return "grok";
  if (hasPhoto) return "wan_i2v_fast";
  return "kling_turbo";
}

function costKeyForTool(toolId, { hasPhoto = false } = {}) {
  const meta = TOOL_META[toolId] || TOOL_META.kling_turbo;
  if (hasPhoto && meta.costKeyImage) return meta.costKeyImage;
  return meta.costKey;
}

function computeVideoToolCost(CREDIT, surcharges, toolId, { duration = 6, testMode = false, hasPhoto = false } = {}) {
  const meta = TOOL_META[toolId] || TOOL_META.kling_turbo;
  if (testMode && meta.testMode) return CREDIT.videoTest ?? 0;
  const key = costKeyForTool(toolId, { hasPhoto });
  let cost = CREDIT[key] ?? CREDIT.video ?? 50;
  const dur = Math.round(Number(duration));
  if (toolId === "grok" || toolId === "kling_turbo" || toolId === "kling_elements") {
    if (dur >= 10) cost += surcharges.videoDuration10 ?? 25;
    else if (dur >= 8) cost += surcharges.videoDuration8 ?? 12;
  }
  return cost;
}

function klingDuration(duration) {
  const d = Math.round(Number(duration));
  return d >= 8 ? 10 : 5;
}

function wanResolution(aspect) {
  return aspect === "9:16" || aspect === "4:5" ? "480p" : "480p";
}

function buildWanFastInput({ prompt, aspect, photo, reference, isI2v }) {
  const aspectRatio = WAN_ASPECT[aspect] || "16:9";
  const input = {
    prompt,
    go_fast: true,
    num_frames: 81,
    resolution: wanResolution(aspectRatio),
    aspect_ratio: aspectRatio,
    sample_shift: 12,
    frames_per_second: 16,
    interpolate_output: true,
    optimize_prompt: false,
  };
  if (isI2v) {
    input.image = photo;
    delete input.aspect_ratio;
    input.resolution = "480p";
    if (reference) input.last_image = reference;
  }
  return input;
}

function buildKlingInput({ prompt, aspect, photo, reference, duration, elements = false }) {
  const input = {
    prompt,
    aspect_ratio: KLING_ASPECT[aspect] || "16:9",
    duration: klingDuration(duration),
  };
  if (photo) input.start_image = photo;
  if (elements && reference) input.end_image = reference;
  else if (reference && !photo) input.start_image = reference;
  return input;
}

function buildWanExtendInput({ firstClip, prompt, duration, resolution = "1080p" }) {
  const dur = Math.min(15, Math.max(2, Math.round(Number(duration) || 6)));
  const res = String(resolution || "1080p").trim().toLowerCase() === "720p" ? "720p" : "1080p";
  return {
    first_clip: firstClip,
    prompt,
    duration: dur,
    resolution: res,
    enable_prompt_expansion: true,
  };
}

function buildVideoExtendPrompt(userPrompt) {
  const base = String(userPrompt || "").trim();
  return (
    `Continue seamlessly from the last frame of the input clip. `
    + `Preserve subject identity, motion style, lighting and camera feel. `
    + `Next action: ${base}`
  );
}

function applyPresetPrefix(preset, userPrompt) {
  const p = String(preset || "").trim().toLowerCase();
  const prefix = PRESET_PROMPT_PREFIX[p];
  if (!prefix) return userPrompt;
  return `${prefix}${userPrompt}`;
}

/** Vídeo→vídeo — apenas Wan 2.7 (Grok/Kling desactivados). */
function resolveVideoEditToolId(_raw) {
  return "wan_edit";
}

function klingEditModeFromResolution(resolution) {
  return String(resolution || "original").trim().toLowerCase() === "1080p" ? "pro" : "std";
}

function buildKlingEditInput({
  video,
  prompt,
  referenceImage = null,
  resolution = "original",
  keepOriginalSound = true,
}) {
  const input = {
    prompt,
    reference_video: video,
    video_reference_type: "base",
    mode: klingEditModeFromResolution(resolution),
    keep_original_sound: keepOriginalSound,
  };
  if (referenceImage) input.reference_images = [referenceImage];
  return input;
}

function buildGrokEditInput({ video, prompt }) {
  return { video, prompt };
}

module.exports = {
  MODELS,
  TOOL_META,
  PRESET_PROMPT_PREFIX,
  resolveToolId,
  resolveVideoEditToolId,
  costKeyForTool,
  computeVideoToolCost,
  klingDuration,
  buildWanFastInput,
  buildKlingInput,
  buildKlingEditInput,
  buildGrokEditInput,
  buildWanExtendInput,
  buildVideoExtendPrompt,
  applyPresetPrefix,
  klingEditModeFromResolution,
};
