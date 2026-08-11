/**
 * AI Lab — build a ComfyUI workflow from the catalog + params and run it on
 * Vast.ai (ComfyUI direct). Admin-only.
 */
const comfy = require("../providers/comfyUiProvider.cjs");
const { getModel, getWorkflow, PARAM_SCHEMA, LAB_PAUSED, LAB_PAUSE_MESSAGE } = require("./catalog.cjs");

const SEED_MAX = 4294967295;

function labPausedError() {
  const err = new Error(LAB_PAUSE_MESSAGE);
  err.status = 503;
  throw err;
}

function paramDefault(id) {
  const p = PARAM_SCHEMA.find((x) => x.id === id);
  return p ? p.default : undefined;
}

function setNode(workflow, target, value) {
  if (!Array.isArray(target) || target.length < 2) return;
  let ref = workflow[target[0]];
  for (let i = 1; i < target.length - 1; i += 1) {
    if (!ref || typeof ref !== "object") return;
    ref = ref[target[i]];
  }
  if (ref && typeof ref === "object") ref[target[target.length - 1]] = value;
}

function needsImageInput(wf) {
  const req = wf?.requires || [];
  return req.includes("image") || req.includes("face_ref");
}

function clampResolvedParams(model, resolved) {
  if (model?.family === "sd15") {
    for (const id of ["width", "height"]) {
      if (resolved[id] == null) continue;
      let v = Math.round(Number(resolved[id]));
      if (!Number.isFinite(v)) continue;
      v = Math.min(512, Math.max(256, v));
      v = Math.round(v / 64) * 64;
      resolved[id] = v;
    }
  }
  return resolved;
}

function buildLabWorkflow({ modelId, workflowId, prompt, negativePrompt, params = {} }) {
  const model = getModel(modelId);
  const wf = getWorkflow(workflowId);
  if (!wf) {
    const err = new Error("Workflow desconhecido.");
    err.status = 400;
    throw err;
  }
  if (model && !model.workflows.includes(workflowId)) {
    const err = new Error("Workflow não pertence a este modelo.");
    err.status = 400;
    throw err;
  }
  const text = String(prompt || "").trim();
  if (!text) {
    const err = new Error("Escreve um prompt.");
    err.status = 400;
    throw err;
  }

  const workflow = comfy.loadWorkflowTemplate(wf.template);
  const map = wf.nodeMap || {};
  const resolved = {};
  const defaults = wf.defaults || {};

  for (const id of wf.params) {
    let v = params[id] != null && params[id] !== "" ? params[id] : (defaults[id] ?? paramDefault(id));
    if (["steps", "width", "height", "batch"].includes(id)) v = Math.round(Number(v));
    else if (["cfg", "denoise", "guidance"].includes(id)) v = Number(v);
    if (id === "seed") {
      v = Math.round(Number(v));
      if (!Number.isFinite(v) || v <= 0) v = Math.floor(Math.random() * SEED_MAX);
    }
    resolved[id] = v;
    if (map[id]) setNode(workflow, map[id], v);
  }

  clampResolvedParams(model, resolved);
  for (const id of wf.params) {
    if (map[id] && resolved[id] != null) setNode(workflow, map[id], resolved[id]);
  }

  if (map.prompt) setNode(workflow, map.prompt, text);
  if (map.negative) setNode(workflow, map.negative, String(negativePrompt || "").trim());
  if (map.image) setNode(workflow, map.image, "input_ref.png");
  if (map.face_ref) setNode(workflow, map.face_ref, "input_ref.png");
  if (map.checkpoint && model?.checkpoint) setNode(workflow, map.checkpoint, model.checkpoint);

  return {
    workflow,
    needsImage: needsImageInput(wf),
    resolvedParams: resolved,
    model,
    workflow_def: wf,
  };
}

async function submitLabGeneration({
  modelId,
  workflowId,
  prompt,
  negativePrompt,
  params,
  imageDataUrl,
}) {
  if (LAB_PAUSED) labPausedError();
  if (!comfy.isConfigured()) {
    const err = new Error("ComfyUI não configurado (COMFYUI_BASE_URL na Vercel).");
    err.status = 503;
    throw err;
  }

  const health = await comfy.checkHealth();
  if (!health.ok) {
    const err = new Error(health.message || "ComfyUI offline — verifica o pod Vast.");
    err.status = 503;
    throw err;
  }

  const built = buildLabWorkflow({ modelId, workflowId, prompt, negativePrompt, params });
  if (built.needsImage && !imageDataUrl) {
    const err = new Error("Este workflow precisa de uma imagem de referência.");
    err.status = 400;
    throw err;
  }

  const job = await comfy.submitRawJob({
    workflow: built.workflow,
    imageDataUrl: built.needsImage ? imageDataUrl : null,
  });

  return {
    job_id: job.id,
    model_id: modelId,
    model_label: built.model?.label || modelId,
    workflow_id: workflowId,
    workflow_label: built.workflow_def.label,
    resolved_params: built.resolvedParams,
    provider: job.provider,
  };
}

async function getLabJobStatus(jobId) {
  if (LAB_PAUSED) labPausedError();
  return comfy.getJobStatus(jobId);
}

module.exports = {
  buildLabWorkflow,
  submitLabGeneration,
  getLabJobStatus,
};
