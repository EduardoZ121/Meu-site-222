/**
 * AI Lab — data-driven model & workflow catalog (admin-only playground).
 *
 * Single source of truth for what the lab can run. Organised around the
 * 3 pipelines agreed for RemakePix (Eduardo + GPT + Cursor):
 *
 *   Pipeline A — txt2img      → realismo alto (Flux Dev como principal)
 *   Pipeline B — edit/inpaint → trocar roupa/objetos (Flux Fill)
 *   Pipeline C — identity     → manter o rosto (InstantID / IPAdapter / PuLID)
 *
 * Adding a model/workflow = edit this file (+ a workflow JSON if new). When a
 * Network Volume with the required checkpoints/nodes is mounted, just add the
 * filenames to INSTALLED_CHECKPOINTS / the templates to INSTALLED_WORKFLOWS and
 * everything lights up — no code changes elsewhere.
 */

/* ---------------------------------------------------------------------------
 * What is actually present on the current RunPod worker.
 * Today the worker image ships SDXL base only. Update these two sets (data
 * only) when the Network Volume adds Flux / InstantID / etc.
 * ------------------------------------------------------------------------- */
const INSTALLED_WORKFLOWS = new Set(["sdxl-txt2img", "sdxl-img2img"]);
const INSTALLED_CHECKPOINTS = new Set(["sd_xl_base_1.0.safetensors"]);

const PIPELINES = {
  txt2img: { id: "txt2img", label: "Gerar (texto→imagem)", order: 1, hint: "Cria imagens a partir de um prompt." },
  edit: { id: "edit", label: "Editar (trocar roupa/objetos)", order: 2, hint: "Inpainting: muda partes mantendo o resto." },
  identity: { id: "identity", label: "Manter o rosto (identidade)", order: 3, hint: "Preserva a pessoa da imagem de referência." },
};

/** Advanced parameter schema shown in the UI. */
const PARAM_SCHEMA = [
  { id: "steps", label: "Steps", type: "number", min: 1, max: 60, step: 1, default: 28 },
  { id: "cfg", label: "CFG", type: "number", min: 1, max: 20, step: 0.5, default: 7 },
  { id: "seed", label: "Seed", type: "number", min: 0, max: 4294967295, step: 1, default: 0, hint: "0 = aleatório" },
  { id: "sampler", label: "Sampler", type: "select", default: "dpmpp_2m", options: ["euler", "euler_ancestral", "dpmpp_2m", "dpmpp_2m_sde", "dpmpp_sde", "ddim", "uni_pc"] },
  { id: "scheduler", label: "Scheduler", type: "select", default: "karras", options: ["normal", "karras", "sgm_uniform", "simple", "beta"] },
  { id: "denoise", label: "Denoise", type: "number", min: 0.1, max: 1, step: 0.05, default: 0.6, hint: "img2img: <1 preserva mais" },
  { id: "width", label: "Width", type: "number", min: 512, max: 1536, step: 64, default: 1024 },
  { id: "height", label: "Height", type: "number", min: 512, max: 1536, step: 64, default: 1024 },
  { id: "batch", label: "Batch size", type: "number", min: 1, max: 4, step: 1, default: 1 },
];

/**
 * Workflow definitions. nodeMap value = [nodeId, ...path].
 * `checkpoint` points the CheckpointLoaderSimple node so the model can swap the
 * .safetensors file without a new JSON. `requires` lists extra inputs the UI
 * must collect (mask, face reference, etc.).
 */
const WORKFLOWS = {
  "sdxl-txt2img": {
    label: "SDXL · texto→imagem",
    family: "sdxl",
    template: "sdxl-txt2img",
    pipeline: "txt2img",
    requires: [],
    params: ["steps", "cfg", "seed", "sampler", "scheduler", "width", "height"],
    nodeMap: {
      prompt: ["6", "inputs", "text"],
      negative: ["7", "inputs", "text"],
      seed: ["3", "inputs", "seed"],
      steps: ["3", "inputs", "steps"],
      cfg: ["3", "inputs", "cfg"],
      sampler: ["3", "inputs", "sampler_name"],
      scheduler: ["3", "inputs", "scheduler"],
      width: ["5", "inputs", "width"],
      height: ["5", "inputs", "height"],
      checkpoint: ["4", "inputs", "ckpt_name"],
    },
  },
  "sdxl-img2img": {
    label: "SDXL · imagem→imagem",
    family: "sdxl",
    template: "sdxl-img2img",
    pipeline: "txt2img",
    requires: ["image"],
    params: ["steps", "cfg", "seed", "sampler", "scheduler", "denoise"],
    nodeMap: {
      prompt: ["6", "inputs", "text"],
      negative: ["7", "inputs", "text"],
      seed: ["3", "inputs", "seed"],
      steps: ["3", "inputs", "steps"],
      cfg: ["3", "inputs", "cfg"],
      sampler: ["3", "inputs", "sampler_name"],
      scheduler: ["3", "inputs", "scheduler"],
      denoise: ["3", "inputs", "denoise"],
      image: ["1", "inputs", "image"],
      checkpoint: ["4", "inputs", "ckpt_name"],
    },
  },
  "flux-txt2img": {
    label: "Flux · texto→imagem",
    family: "flux",
    template: "flux-txt2img",
    pipeline: "txt2img",
    requires: [],
    params: ["steps", "seed", "width", "height"],
    nodeMap: {
      prompt: ["6", "inputs", "text"],
      seed: ["25", "inputs", "noise_seed"],
      steps: ["17", "inputs", "steps"],
      width: ["5", "inputs", "width"],
      height: ["5", "inputs", "height"],
    },
  },
  "flux-img2img": {
    label: "Flux · imagem→imagem",
    family: "flux",
    template: "flux-img2img",
    pipeline: "txt2img",
    requires: ["image"],
    params: ["steps", "seed", "denoise"],
    nodeMap: {
      prompt: ["6", "inputs", "text"],
      seed: ["25", "inputs", "noise_seed"],
      steps: ["17", "inputs", "steps"],
      denoise: ["17", "inputs", "denoise"],
      image: ["1", "inputs", "image"],
    },
  },
  "flux-fill": {
    label: "Flux Fill · editar (inpaint)",
    family: "flux",
    template: "flux-fill",
    pipeline: "edit",
    requires: ["image", "mask"],
    params: ["steps", "seed", "denoise"],
    nodeMap: {
      prompt: ["6", "inputs", "text"],
      seed: ["25", "inputs", "noise_seed"],
      steps: ["17", "inputs", "steps"],
      denoise: ["17", "inputs", "denoise"],
      image: ["1", "inputs", "image"],
    },
  },
  "instantid": {
    label: "InstantID · manter rosto",
    family: "sdxl",
    template: "instantid",
    pipeline: "identity",
    requires: ["face_ref"],
    params: ["steps", "cfg", "seed", "sampler", "scheduler", "width", "height"],
    nodeMap: {
      prompt: ["6", "inputs", "text"],
      negative: ["7", "inputs", "text"],
      seed: ["3", "inputs", "seed"],
      steps: ["3", "inputs", "steps"],
      cfg: ["3", "inputs", "cfg"],
      sampler: ["3", "inputs", "sampler_name"],
      scheduler: ["3", "inputs", "scheduler"],
      width: ["5", "inputs", "width"],
      height: ["5", "inputs", "height"],
      face_ref: ["1", "inputs", "image"],
      checkpoint: ["4", "inputs", "ckpt_name"],
    },
  },
};

/**
 * Models = capability bundles. Each declares a checkpoint filename and which
 * workflows it can run. `ready` is computed from what's installed.
 */
const MODELS = [
  // ---- Pipeline A: txt2img ----
  {
    id: "sdxl",
    label: "SDXL 1.0",
    family: "sdxl",
    pipeline: "txt2img",
    checkpoint: "sd_xl_base_1.0.safetensors",
    note: "Rápido e versátil. Disponível agora no worker.",
    workflows: ["sdxl-txt2img", "sdxl-img2img"],
  },
  {
    id: "flux-dev",
    label: "Flux Dev",
    family: "flux",
    pipeline: "txt2img",
    checkpoint: "flux1-dev.safetensors",
    note: "Realismo e compreensão do prompt muito superiores. Precisa de volume.",
    workflows: ["flux-txt2img", "flux-img2img"],
  },
  {
    id: "flux-schnell",
    label: "Flux Schnell",
    family: "flux",
    pipeline: "txt2img",
    checkpoint: "flux1-schnell.safetensors",
    note: "Versão rápida do Flux (poucos steps). Precisa de volume.",
    workflows: ["flux-txt2img"],
  },
  {
    id: "juggernaut-xl",
    label: "Juggernaut XL",
    family: "sdxl",
    pipeline: "txt2img",
    checkpoint: "juggernautXL.safetensors",
    note: "SDXL fine-tune fotorrealista. Precisa de volume.",
    workflows: ["sdxl-txt2img", "sdxl-img2img"],
  },
  {
    id: "realvis-xl",
    label: "RealVis XL",
    family: "sdxl",
    pipeline: "txt2img",
    checkpoint: "realvisxlV50.safetensors",
    note: "SDXL fine-tune realista. Precisa de volume.",
    workflows: ["sdxl-txt2img", "sdxl-img2img"],
  },
  {
    id: "pony-xl",
    label: "Pony Diffusion XL",
    family: "sdxl",
    pipeline: "txt2img",
    checkpoint: "ponyDiffusionXL.safetensors",
    note: "SDXL fine-tune estilizado. Precisa de volume.",
    workflows: ["sdxl-txt2img"],
  },
  // ---- Pipeline B: edit / inpaint ----
  {
    id: "flux-fill",
    label: "Flux Fill (editar)",
    family: "flux",
    pipeline: "edit",
    checkpoint: "flux1-fill-dev.safetensors",
    note: "Troca roupa/objetos por máscara, mantendo o resto. Precisa de volume.",
    workflows: ["flux-fill"],
  },
  // ---- Pipeline C: identity ----
  {
    id: "instantid-sdxl",
    label: "InstantID (manter rosto)",
    family: "sdxl",
    pipeline: "identity",
    checkpoint: "sd_xl_base_1.0.safetensors",
    note: "Gera mantendo o rosto da referência. Precisa de nós InstantID + volume.",
    workflows: ["instantid"],
  },
];

function workflowInstalled(workflowId) {
  const wf = WORKFLOWS[workflowId];
  return Boolean(wf && INSTALLED_WORKFLOWS.has(wf.template));
}

function checkpointInstalled(filename) {
  return INSTALLED_CHECKPOINTS.has(String(filename || ""));
}

/** A model is ready when at least one of its workflows AND its checkpoint exist. */
function modelReady(model) {
  if (!checkpointInstalled(model.checkpoint)) return false;
  return model.workflows.some((w) => workflowInstalled(w));
}

function getWorkflow(workflowId) {
  return WORKFLOWS[workflowId] || null;
}

function getModel(modelId) {
  return MODELS.find((m) => m.id === modelId) || null;
}

/** True only when the model's checkpoint AND the chosen workflow are installed. */
function canRun(modelId, workflowId) {
  const model = getModel(modelId);
  if (!model) return false;
  return checkpointInstalled(model.checkpoint) && workflowInstalled(workflowId);
}

/** Public catalog payload for the UI, grouped by pipeline. */
function getCatalog() {
  const models = MODELS.map((m) => ({
    id: m.id,
    label: m.label,
    family: m.family,
    pipeline: m.pipeline,
    note: m.note,
    ready: modelReady(m),
    workflows: m.workflows
      .map((wid) => {
        const wf = WORKFLOWS[wid];
        if (!wf) return null;
        return {
          id: wid,
          label: wf.label,
          pipeline: wf.pipeline,
          family: wf.family,
          requires: wf.requires || [],
          params: wf.params,
          ready: checkpointInstalled(m.checkpoint) && workflowInstalled(wid),
        };
      })
      .filter(Boolean),
  }));
  return {
    pipelines: Object.values(PIPELINES).sort((a, b) => a.order - b.order),
    models,
    param_schema: PARAM_SCHEMA,
  };
}

module.exports = {
  PIPELINES,
  PARAM_SCHEMA,
  WORKFLOWS,
  MODELS,
  INSTALLED_WORKFLOWS,
  INSTALLED_CHECKPOINTS,
  getCatalog,
  getWorkflow,
  getModel,
  modelReady,
  workflowInstalled,
  checkpointInstalled,
  canRun,
};
