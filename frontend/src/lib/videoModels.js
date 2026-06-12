/** Video tool registry — mirrors api/lib/videoModels.cjs for UI pricing & behaviour. */

export const VIDEO_TOOL_IDS = {
  grok: "grok",
  kling_turbo: "kling_turbo",
  wan_t2v_fast: "wan_t2v_fast",
  wan_i2v_fast: "wan_i2v_fast",
  kling_elements: "kling_elements",
  wan_edit: "wan_edit",
  kling_edit: "kling_edit",
  grok_edit: "grok_edit",
  wan_extend: "wan_extend",
};

export const VIDEO_TOOL_META = {
  grok: {
    costKey: "videoImage",
    flow: "generate",
    needsImage: true,
    testMode: true,
    durations: [4, 6, 8],
    defaultDuration: 6,
    modelLabel: "Grok Imagine",
  },
  kling_turbo: {
    costKey: "videoMarketing",
    costKeyImage: "videoMarketingImage",
    flow: "generate",
    needsImage: false,
    optionalImage: true,
    testMode: false,
    durations: [5, 10],
    defaultDuration: 5,
    modelLabel: "Kling 2.5 Turbo",
  },
  wan_t2v_fast: {
    costKey: "videoFast",
    flow: "generate",
    needsImage: false,
    testMode: true,
    durations: [5],
    defaultDuration: 5,
    modelLabel: "Wan 2.2 Fast",
  },
  wan_i2v_fast: {
    costKey: "videoFastImage",
    flow: "generate",
    needsImage: true,
    testMode: true,
    durations: [5],
    defaultDuration: 5,
    modelLabel: "Wan 2.2 Fast",
  },
  kling_elements: {
    costKey: "videoElements",
    flow: "generate",
    needsImage: true,
    optionalReference: true,
    testMode: false,
    durations: [5, 10],
    defaultDuration: 5,
    modelLabel: "Kling 2.5 Turbo",
  },
  wan_edit: {
    costKey: "videoEdit",
    flow: "edit",
    modelLabel: "Wan 2.7 VideoEdit",
  },
  kling_edit: {
    costKey: "videoEdit",
    flow: "edit",
    modelLabel: "Kling O1 Edit",
  },
  grok_edit: {
    costKey: "videoEdit",
    flow: "edit",
    modelLabel: "Grok Imagine",
  },
  wan_extend: {
    costKey: "videoExtend",
    flow: "extend",
    durations: [4, 6, 8, 10],
    defaultDuration: 6,
    modelLabel: "Wan 2.7 Continue",
  },
};

export function getVideoToolMeta(toolId) {
  return VIDEO_TOOL_META[toolId] || VIDEO_TOOL_META.kling_turbo;
}

export function costKeyForVideoTool(toolId, { hasPhoto = false } = {}) {
  const meta = getVideoToolMeta(toolId);
  if (hasPhoto && meta.costKeyImage) return meta.costKeyImage;
  return meta.costKey;
}

export function computeVideoToolCost(costs, surcharges, toolId, { duration = 6, testMode = false, hasPhoto = false } = {}) {
  const meta = getVideoToolMeta(toolId);
  if (testMode && meta.testMode) return costs.videoTest ?? 0;
  const key = costKeyForVideoTool(toolId, { hasPhoto });
  let cost = costs[key] ?? costs.video ?? 50;
  const dur = Math.round(Number(duration));
  if (["grok", "kling_turbo", "kling_elements"].includes(toolId)) {
    if (dur >= 10) cost += surcharges.videoDuration10 ?? 25;
    else if (dur >= 8) cost += surcharges.videoDuration8 ?? 12;
  }
  return cost;
}
