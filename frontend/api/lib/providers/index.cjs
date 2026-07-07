/**
 * AI provider registry — Replicate (default) + RunPod (admin dev mode).
 */
const replicate = require("./replicateProvider.cjs");
const runpod = require("./runpodProvider.cjs");
const { getAiEngine } = require("../aiEngineSettings.cjs");
const { isAdminEmail } = require("../usersDb.cjs");

const PROVIDERS = {
  replicate,
  runpod,
};

const VIDEO_TYPES = new Set(["video", "marketing_video", "motion_flyer"]);

/** Image generation types eligible for RunPod when admin selects it. */
const RUNPOD_IMAGE_TYPES = new Set([
  "image",
  "edit",
  "easy",
  "pro",
  "artistic",
  "poster",
  "manga",
  "manga_panel",
  "manga_page",
  "bg_remove",
  "upscale",
  "restore",
  "colorize",
  "clothes",
  "inpaint",
  "carousel",
  "brand_campaign",
  "padrao",
  "identity",
]);

function getProviderModule(providerId) {
  return PROVIDERS[providerId] || PROVIDERS.replicate;
}

function isRunpodEligibleType(type) {
  const t = String(type || "image").toLowerCase();
  if (VIDEO_TYPES.has(t)) return false;
  if (RUNPOD_IMAGE_TYPES.has(t)) return true;
  return !VIDEO_TYPES.has(t);
}

/**
 * Resolve which provider handles this generation.
 * RunPod only when: admin email + engine=runpod + image type + runpod configured.
 */
async function resolveProviderForGeneration({ userEmail, type }) {
  const engine = await getAiEngine();
  if (
    engine === "runpod"
    && isAdminEmail(userEmail)
    && isRunpodEligibleType(type)
    && runpod.isConfigured()
  ) {
    return "runpod";
  }
  return "replicate";
}

async function submitProviderJob(providerId, { modelId, input, aspectRatio, type }) {
  const mod = getProviderModule(providerId);
  if (providerId === "runpod") {
    return mod.submitJob({ modelId, input, aspectRatio, type });
  }
  return mod.submitJob({ modelId, input });
}

async function getProviderJobStatus(providerId, jobId) {
  const mod = getProviderModule(providerId);
  return mod.getJobStatus(jobId);
}

/** Poll helper — uses pending.provider (defaults to replicate). */
async function getJobStatusForPending(pending) {
  const providerId = pending?.provider || "replicate";
  const jobId = pending?.provider_job_id || pending?.replicate_prediction_id;
  if (!jobId) {
    return { status: "failed", output: null, error: "Missing provider job id" };
  }
  return getProviderJobStatus(providerId, jobId);
}

function providerStatusSummary() {
  return {
    replicate: { id: "replicate", configured: replicate.isConfigured() },
    runpod: {
      id: "runpod",
      configured: runpod.isConfigured(),
      endpoint_id: runpod.isConfigured() ? runpod.runpodConfig().endpointId : null,
    },
  };
}

module.exports = {
  PROVIDERS,
  VIDEO_TYPES,
  RUNPOD_IMAGE_TYPES,
  getProviderModule,
  isRunpodEligibleType,
  resolveProviderForGeneration,
  submitProviderJob,
  getProviderJobStatus,
  getJobStatusForPending,
  providerStatusSummary,
  replicate,
  runpod,
};
