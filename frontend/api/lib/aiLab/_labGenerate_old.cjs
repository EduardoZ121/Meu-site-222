/**
 * AI Lab — build a ComfyUI workflow from the catalog + params and run it on
 * RunPod. Admin-only. Does not touch credits, creations, or production flow.
 */
const runpod = require("../providers/runpodProvider.cjs");
const { getModel, getWorkflow, PARAM_SCHEMA } = require("./catalog.cjs");

const SEED_MAX = 4294967295;

function paramDefault(id) {
  const p = PARAM_SCHEMA.find((x) => x.id === id);
  return p ? p.default : undefined;
}

/** Write a value into the workflow graph following a [nodeId, ...path] target. */
function setNode(workflow, target, value) {
  if (!Array.isArray(target) || target.length < 2) return;
  let ref = workflow[target[0]];
  for (let i = 1; i < target.length - 1; i += 1) {
    if (!ref || typeof ref !== "object") return;
    ref = ref[target[i]];
  }
  if (ref && typeof ref === "object") ref[target[target.length - 1]] = value;
}

/**
 * Build the workflow JSON for a lab request.
 * @returns {{ workflow, type, imageName, resolvedParams, model, workflow_def }}
 */
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

  const workflow = runpod.loadWorkflowTemplate(wf.template);
  const map = wf.nodeMap || {};
  const resolved = {};

  // Resolve each supported param (request value -> default).
  for (const id of wf.params) {
    let v = params[id] != null && params[id] !== "" ? params[id] : paramDefault(id);
    if (["steps", "width", "height", "batch"].includes(id)) v = Math.round(Number(v));
    else if (["cfg", "denoise"].includes(id)) v = Number(v);
    if (id === "seed") {
      v = Math.round(Number(v));
      if (!Number.isFinite(v) || v <= 0) v = Math.floor(Math.random() * SEED_MAX);
    }
    resolved[id] = v;
    if (map[id]) setNode(workflow, map[id], v);
  }

  // Prompt + optional negative.
  if (map.prompt) setNode(workflow, map.prompt, text);
  if (map.negative) setNode(workflow, map.negative, String(negativePrompt || "").trim());
  if (map.image) setNode(workflow, map.image, "input_ref.png");

  return {
    workflow,
    type: wf.type,
    needsImage: wf.type === "img2img",
    resolvedParams: resolved,
    model,
    workflow_def: wf,
  };
}

/** Submit a lab generation to RunPod. Returns the job id + echo metadata. */
async function submitLabGeneration({ modelId, workflowId, prompt, negativePrompt, params, imageDataUrl }) {
  if (!runpod.isConfigured()) {
    const err = new Error("RunPod não está configurado (RUNPOD_API_KEY / RUNPOD_ENDPOINT_ID).");
    err.status = 400;
    throw err;
  }
  const built = buildLabWorkflow({ modelId, workflowId, prompt, negativePrompt, params });
  if (built.needsImage && !imageDataUrl) {
    const err = new Error("Este workflow (imagem→imagem) precisa de uma imagem.");
    err.status = 400;
    throw err;
  }
  const job = await runpod.submitRawJob({
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
    type: built.type,
  };
}

async function getLabJobStatus(jobId) {
  return runpod.getJobStatus(jobId);
}

module.exports = {
  buildLabWorkflow,
  submitLabGeneration,
  getLabJobStatus,
};
