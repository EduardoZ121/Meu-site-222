/**
 * RunPod Serverless ComfyUI — admin-only image provider.
 * Docs: https://docs.runpod.io/serverless/endpoints/send-requests
 */
const fs = require("fs");
const path = require("path");

const PROVIDER_ID = "runpod";
const WORKFLOW_DIR = path.join(__dirname, "comfyWorkflows");

const ASPECT_DIMS = {
  "1:1": [1024, 1024],
  "16:9": [1344, 768],
  "9:16": [768, 1344],
  "4:3": [1152, 896],
  "3:4": [896, 1152],
  "3:2": [1216, 832],
  "2:3": [832, 1216],
  "21:9": [1536, 640],
  "9:21": [640, 1536],
  "4:5": [896, 1152],
  "5:4": [1152, 896],
};

function runpodConfig() {
  const apiKey = String(process.env.RUNPOD_API_KEY || "").trim();
  const endpointId = String(process.env.RUNPOD_ENDPOINT_ID || "").trim();
  return { apiKey, endpointId };
}

function isConfigured() {
  const { apiKey, endpointId } = runpodConfig();
  return Boolean(apiKey && endpointId);
}

function apiBase() {
  const { endpointId } = runpodConfig();
  return `https://api.runpod.ai/v2/${endpointId}`;
}

async function runpodFetch(pathSuffix, options = {}) {
  const { apiKey } = runpodConfig();
  if (!apiKey) {
    const err = new Error("RUNPOD_API_KEY not configured");
    err.status = 500;
    throw err;
  }
  const res = await fetch(`${apiBase()}${pathSuffix}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `RunPod error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function loadWorkflowTemplate(name) {
  const file = path.join(WORKFLOW_DIR, `${name}.json`);
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

function dimsFromAspect(aspectRatio) {
  const key = String(aspectRatio || "1:1").trim();
  return ASPECT_DIMS[key] || ASPECT_DIMS["1:1"];
}

function isFluxModel(modelId) {
  const id = String(modelId || "").toLowerCase();
  return id.includes("flux") || id.includes("klein");
}

const { resolveWorkflow } = require("./runpodModelMap.cjs");

function pickWorkflowTemplate({ type, hasImage }) {
  // Per-session model map decides the workflow; falls back to SDXL when the
  // target model (Flux/PuLID/Kontext) is not installed on the worker yet.
  return resolveWorkflow({ type, hasImage }).template;
}

function firstImageUrl(input) {
  if (!input || typeof input !== "object") return null;
  // Site passes the reference in many shapes: string, array on .image,
  // .images[], .reference_image, .input_image, .start_image.
  const candidates = [
    input.image,
    input.images,
    input.reference_image,
    input.input_image,
    input.start_image,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("http")) return c;
    if (Array.isArray(c)) {
      const hit = c.find((v) => typeof v === "string" && v.startsWith("http"));
      if (hit) return hit;
    }
  }
  return null;
}

function buildWorkflow({ modelId, input, aspectRatio, type }) {
  const prompt = String(input?.prompt || "").trim();
  if (!prompt) {
    const err = new Error("Prompt em falta para RunPod ComfyUI");
    err.status = 400;
    throw err;
  }
  const imageUrl = firstImageUrl(input);
  const templateName = pickWorkflowTemplate({ type, hasImage: Boolean(imageUrl) });
  const workflow = loadWorkflowTemplate(templateName);
  const [width, height] = dimsFromAspect(aspectRatio || input?.aspect_ratio);
  const seed = Math.floor(Math.random() * 2 ** 31);

  if (templateName === "sdxl-txt2img") {
    workflow["3"].inputs.seed = seed;
    workflow["5"].inputs.width = width;
    workflow["5"].inputs.height = height;
    workflow["6"].inputs.text = prompt;
  } else if (templateName === "flux-txt2img") {
    workflow["25"].inputs.noise_seed = seed;
    workflow["5"].inputs.width = width;
    workflow["5"].inputs.height = height;
    workflow["6"].inputs.text = prompt;
  } else if (templateName === "sdxl-img2img") {
    workflow["3"].inputs.seed = seed;
    workflow["6"].inputs.text = prompt;
    workflow["1"].inputs.image = "input_ref.png";
  } else if (templateName === "flux-img2img") {
    workflow["25"].inputs.noise_seed = seed;
    workflow["6"].inputs.text = prompt;
    workflow["1"].inputs.image = "input_ref.png";
  }

  return { workflow, templateName, width, height, seed, imageUrl: imageUrl || null };
}

/** Convert RunPod Comfy output to URLs / data-URLs for extractUrls + mirrorUrlsToBlob. */
function normalizeOutput(rawOutput) {
  if (!rawOutput) return null;
  if (typeof rawOutput === "string" && rawOutput.startsWith("http")) return [rawOutput];
  const urls = [];
  const images = rawOutput.images || rawOutput.output?.images || [];
  if (Array.isArray(images)) {
    for (const img of images) {
      if (!img) continue;
      if (typeof img === "string" && img.startsWith("http")) {
        urls.push(img);
        continue;
      }
      if (typeof img.url === "string") {
        urls.push(img.url);
        continue;
      }
      if (img.type === "base64" && img.data) {
        const mime = String(img.mime || "image/png");
        urls.push(`data:${mime};base64,${img.data}`);
        continue;
      }
      if (typeof img.data === "string" && img.data.length > 100) {
        urls.push(`data:image/png;base64,${img.data}`);
      }
    }
  }
  if (Array.isArray(rawOutput)) {
    for (const item of rawOutput) {
      if (typeof item === "string" && item.startsWith("http")) urls.push(item);
    }
  }
  if (typeof rawOutput.message === "string" && rawOutput.message.startsWith("http")) {
    urls.push(rawOutput.message);
  }
  return urls.length ? urls : rawOutput;
}

function normalizeJobInfo(job) {
  if (!job) return { status: "failed", output: null, error: "Empty RunPod job" };
  const raw = String(job.status || "").toUpperCase();
  let status = "processing";
  if (raw === "COMPLETED") status = "succeeded";
  else if (raw === "FAILED" || raw === "CANCELLED" || raw === "TIMED_OUT") status = "failed";
  else if (raw === "IN_QUEUE") status = "starting";

  const output = normalizeOutput(job.output);
  const error = job.error || job.output?.error || (status === "failed" ? "RunPod generation failed" : null);

  return {
    status,
    output,
    error,
    provider: PROVIDER_ID,
    raw_status: job.status,
    execution_time_ms: job.executionTime ?? job.delayTime ?? null,
  };
}

async function submitJob({ modelId, input, aspectRatio, type }) {
  const { workflow, templateName, imageUrl } = buildWorkflow({ modelId, input, aspectRatio, type });
  const payload = { workflow };
  if (imageUrl && (templateName === "sdxl-img2img" || templateName === "flux-img2img")) {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      const err = new Error(`Não foi possível carregar a imagem de referência (${imgRes.status})`);
      err.status = 400;
      throw err;
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const mime = String(imgRes.headers.get("content-type") || "image/png").split(";")[0];
    payload.images = [{
      name: "input_ref.png",
      image: `data:${mime};base64,${buf.toString("base64")}`,
    }];
  }
  const data = await runpodFetch("/run", {
    method: "POST",
    body: JSON.stringify({ input: payload }),
  });
  return {
    id: data.id,
    provider: PROVIDER_ID,
    workflow_template: templateName,
    raw: data,
  };
}

async function getJobStatus(jobId) {
  const data = await runpodFetch(`/status/${jobId}`);
  return normalizeJobInfo(data);
}

/**
 * Submit a fully-built ComfyUI workflow as-is (AI Lab / power use).
 * @param {object} workflow  ComfyUI prompt graph
 * @param {string} [imageDataUrl]  optional data: URL for an "input_ref.png" upload
 */
async function submitRawJob({ workflow, imageDataUrl, imageName = "input_ref.png" }) {
  if (!workflow || typeof workflow !== "object") {
    const err = new Error("Workflow ComfyUI inválido.");
    err.status = 400;
    throw err;
  }
  const payload = { workflow };
  if (imageDataUrl && String(imageDataUrl).startsWith("data:")) {
    payload.images = [{ name: imageName, image: imageDataUrl }];
  }
  const data = await runpodFetch("/run", {
    method: "POST",
    body: JSON.stringify({ input: payload }),
  });
  return { id: data.id, provider: PROVIDER_ID, raw: data };
}

async function restFetch(pathSuffix, options = {}) {
  const { apiKey } = runpodConfig();
  if (!apiKey) {
    const err = new Error("RUNPOD_API_KEY not configured");
    err.status = 500;
    throw err;
  }
  const res = await fetch(`https://rest.runpod.io/v1${pathSuffix}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `RunPod REST error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function getEndpointInfo() {
  const { endpointId } = runpodConfig();
  return restFetch(`/endpoints/${endpointId}`);
}

/** workersMax=0 pauses new workers; resume with workersMax>=1. */
async function setWorkersMax(workersMax) {
  const { endpointId } = runpodConfig();
  const max = Math.max(0, Math.min(10, Number(workersMax) || 0));
  return restFetch(`/endpoints/${endpointId}`, {
    method: "PATCH",
    body: JSON.stringify({ workersMax: max }),
  });
}

async function pauseEndpoint() {
  return setWorkersMax(0);
}

async function resumeEndpoint() {
  return setWorkersMax(1);
}

/** Cancel all pending jobs — required after stuck queue / failed tests. */
async function purgeQueue() {
  const data = await runpodFetch("/purge-queue", { method: "POST" });
  return {
    removed: data?.removed ?? 0,
    status: data?.status || "completed",
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function workerTotal(workers) {
  if (!workers) return 0;
  return (workers.idle || 0) + (workers.ready || 0) + (workers.running || 0)
    + (workers.unhealthy || 0) + (workers.initializing || 0);
}

function hasReadyWorker(workers) {
  return ((workers?.idle || 0) + (workers?.ready || 0)) > 0 && !(workers?.unhealthy);
}

/**
 * Ensure RunPod can accept a job: kill zombie workers, purge stale queue,
 * wait for a healthy idle worker. Required before AI Lab generations.
 */
async function prepareForGeneration() {
  let health = await checkHealth();
  const workers = health.health?.workers;
  const needsRecycle = health.paused
    || (workers?.unhealthy > 0)
    || health.stale_queue
    || (Number(health.jobs_in_queue) > 0 && !hasReadyWorker(workers));

  if (needsRecycle) {
    await pauseEndpoint();
    for (let i = 0; i < 18; i += 1) {
      await sleep(5000);
      health = await checkHealth();
      if (workerTotal(health.health?.workers) === 0) break;
    }
  }

  try {
    await purgeQueue();
  } catch {
    /* queue may already be empty */
  }

  if (health.paused || needsRecycle) {
    await resumeEndpoint();
  } else {
    await resumeEndpoint();
  }

  for (let i = 0; i < 15; i += 1) {
    await sleep(4000);
    health = await checkHealth();
    const w = health.health?.workers;
    if (hasReadyWorker(w) && Number(health.jobs_in_queue ?? 0) === 0) {
      return { ...health, prepared: true, recycled: needsRecycle };
    }
  }

  return { ...health, prepared: false, recycled: needsRecycle };
}

async function checkHealth() {
  if (!isConfigured()) {
    return {
      ok: false,
      configured: false,
      message: "RUNPOD_API_KEY ou RUNPOD_ENDPOINT_ID em falta",
    };
  }
  try {
    const [data, endpoint] = await Promise.all([
      runpodFetch("/health"),
      getEndpointInfo().catch(() => null),
    ]);
    const workers = data?.workers;
    const workersMax = endpoint?.workersMax ?? null;
    const jobsInQueue = data?.jobs?.inQueue ?? null;
    const jobsInProgress = data?.jobs?.inProgress ?? null;
    const staleQueue = (Number(jobsInQueue) > 0 && Number(jobsInProgress) === 0
      && Number(workers?.running ?? 0) > 0)
      || Number(workers?.unhealthy ?? 0) > 0;
    return {
      ok: true,
      configured: true,
      endpoint_id: runpodConfig().endpointId,
      paused: workersMax === 0,
      workers_max: workersMax,
      health: data,
      workers_running: workers?.running ?? data?.jobs?.running ?? null,
      workers_idle: workers?.idle ?? null,
      jobs_in_queue: jobsInQueue,
      jobs_in_progress: jobsInProgress,
      stale_queue: staleQueue,
      warning: staleQueue
        ? "Fila presa — clica «Limpar fila» antes de gerar."
        : (jobsInQueue > 0 ? `${jobsInQueue} job(s) em fila` : null),
    };
  } catch (e) {
    return {
      ok: false,
      configured: true,
      endpoint_id: runpodConfig().endpointId,
      message: String(e.message || e).slice(0, 200),
    };
  }
}

module.exports = {
  PROVIDER_ID,
  isConfigured,
  buildWorkflow,
  loadWorkflowTemplate,
  normalizeJobInfo,
  normalizeOutput,
  submitJob,
  submitRawJob,
  getJobStatus,
  checkHealth,
  pauseEndpoint,
  resumeEndpoint,
  purgeQueue,
  prepareForGeneration,
  getEndpointInfo,
  setWorkersMax,
  runpodConfig,
};
