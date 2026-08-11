/**
 * AI Lab — admin-only playground (catalog + UI).
 * Motor: Vast.ai RTX 4090 + ComfyUI (template Flux). Produção clientes = Replicate.
 */

const LAB_PROVIDER = "vast";
const LAB_PAUSED = false;
const LAB_PAUSE_MESSAGE =
  "Geração pausada. O pod Vast/ComfyUI não está acessível.";

/* ComfyUI + FLUX.1 template on Vast (provisioned via flux.sh). */
const INSTALLED_WORKFLOWS = new Set(["flux-txt2img", "flux-img2img", "sd15-txt2img"]);
const INSTALLED_CHECKPOINTS = new Set([
  "v1-5-pruned-emaonly-fp16.safetensors",
]);

const PIPELINES = {
  txt2img: { id: "txt2img", label: "Gerar (texto→imagem)", order: 1, hint: "Cria imagens a partir de um prompt." },
  edit: { id: "edit", label: "Editar (trocar roupa/objetos)", order: 2, hint: "Inpainting: muda partes mantendo o resto." },
  identity: { id: "identity", label: "Manter o rosto (identidade)", order: 3, hint: "Preserva a pessoa da imagem de referência." },
};

const PARAM_SCHEMA = [
  { id: "steps", label: "Steps", type: "number", min: 1, max: 60, step: 1, default: 28 },
  { id: "cfg", label: "CFG", type: "number", min: 1, max: 20, step: 0.5, default: 7 },
  { id: "seed", label: "Seed", type: "number", min: 0, max: 4294967295, step: 1, default: 0, hint: "0 = aleatório" },
  { id: "sampler", label: "Sampler", type: "select", default: "dpmpp_2m", options: ["euler", "euler_ancestral", "dpmpp_2m", "dpmpp_2m_sde", "dpmpp_sde", "ddim", "uni_pc"] },
  { id: "scheduler", label: "Scheduler", type: "select", default: "karras", options: ["normal", "karras", "sgm_uniform", "simple", "beta"] },
  { id: "denoise", label: "Denoise", type: "number", min: 0.1, max: 1, step: 0.05, default: 0.35, hint: ">0.5 perde o rosto/referência" },
  { id: "guidance", label: "Guidance", type: "number", min: 1, max: 10, step: 0.5, default: 3.5, hint: "Flux Dev: 3–4 segue melhor o prompt" },
  { id: "width", label: "Width", type: "number", min: 512, max: 1536, step: 64, default: 1024 },
  { id: "height", label: "Height", type: "number", min: 512, max: 1536, step: 64, default: 1024 },
  { id: "batch", label: "Batch size", type: "number", min: 1, max: 4, step: 1, default: 1 },
];

const WORKFLOWS = {
  "flux-txt2img": {
    label: "Flux · texto→imagem",
    family: "flux",
    template: "flux-txt2img",
    pipeline: "txt2img",
    requires: [],
    params: ["steps", "seed", "width", "height", "guidance"],
    defaults: { steps: 24, width: 1024, height: 1024, guidance: 3.5 },
    paramOverrides: {
      steps: { min: 12, max: 40, default: 24, hint: "Dev: 20–28 costuma bastar" },
      guidance: { min: 2, max: 6, default: 3.5, step: 0.5, hint: "3.5 = recomendado BFL" },
    },
    nodeMap: {
      prompt: ["6", "inputs", "text"],
      seed: ["25", "inputs", "noise_seed"],
      steps: ["17", "inputs", "steps"],
      width: ["5", "inputs", "width"],
      height: ["5", "inputs", "height"],
      guidance: ["26", "inputs", "guidance"],
    },
  },
  "flux-img2img": {
    label: "Flux · imagem→imagem",
    family: "flux",
    template: "flux-img2img",
    pipeline: "txt2img",
    requires: ["image"],
    params: ["steps", "seed", "denoise", "guidance"],
    defaults: { steps: 20, denoise: 0.55, guidance: 3.5 },
    paramOverrides: {
      denoise: { min: 0.2, max: 0.85, default: 0.55, hint: "0.5–0.65 equilíbrio prompt vs foto" },
      guidance: { min: 2, max: 6, default: 3.5, step: 0.5 },
    },
    nodeMap: {
      prompt: ["6", "inputs", "text"],
      seed: ["25", "inputs", "noise_seed"],
      steps: ["17", "inputs", "steps"],
      denoise: ["17", "inputs", "denoise"],
      guidance: ["26", "inputs", "guidance"],
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
  "sd15-txt2img": {
    label: "SD 1.5 · texto→imagem (teste pipeline)",
    family: "sd15",
    template: "sd15-txt2img",
    pipeline: "txt2img",
    requires: [],
    params: ["steps", "cfg", "seed", "width", "height"],
    defaults: { steps: 20, cfg: 7, width: 512, height: 512 },
    paramOverrides: {
      width: { min: 256, max: 512, default: 512, step: 64, hint: "SD 1.5: máx 512px" },
      height: { min: 256, max: 512, default: 512, step: 64, hint: "SD 1.5: máx 512px" },
      steps: { min: 8, max: 35, default: 20 },
    },
    nodeMap: {
      prompt: ["6", "inputs", "text"],
      negative: ["7", "inputs", "text"],
      seed: ["3", "inputs", "seed"],
      steps: ["3", "inputs", "steps"],
      cfg: ["3", "inputs", "cfg"],
      width: ["5", "inputs", "width"],
      height: ["5", "inputs", "height"],
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

const MODELS = [
  {
    id: "sd15",
    label: "SD 1.5 (só teste de ligação)",
    family: "sd15",
    pipeline: "txt2img",
    checkpoint: "v1-5-pruned-emaonly-fp16.safetensors",
    note: "Apenas valida site→GPU. Máx 512×512 — acima disso a imagem fica distorcida. Qualidade = Flux Dev.",
    workflows: ["sd15-txt2img"],
  },
  {
    id: "flux-dev",
    label: "Flux Dev",
    family: "flux",
    pipeline: "txt2img",
    checkpoint: "flux1-dev.safetensors",
    note: "Flux Dev no pod (1024×1024). Qualidade real para testes no Lab.",
    workflows: ["flux-txt2img", "flux-img2img"],
  },
  {
    id: "flux-fill",
    label: "Flux Fill (editar)",
    family: "flux",
    pipeline: "edit",
    checkpoint: "flux1-fill-dev.safetensors",
    note: "Inpaint com máscara — instalar modelo no pod.",
    workflows: ["flux-fill"],
  },
  {
    id: "instantid-sdxl",
    label: "InstantID (manter rosto)",
    family: "sdxl",
    pipeline: "identity",
    checkpoint: "sd_xl_base_1.0.safetensors",
    note: "Precisa de nós InstantID no pod.",
    workflows: ["instantid"],
  },
];

function comfyConfigured() {
  try {
    return require("../providers/comfyUiProvider.cjs").isConfigured();
  } catch {
    return false;
  }
}

function workflowInstalled(workflowId) {
  if (LAB_PAUSED || !comfyConfigured()) return false;
  const wf = WORKFLOWS[workflowId];
  return Boolean(wf && INSTALLED_WORKFLOWS.has(wf.template));
}

function checkpointInstalled(filename, liveAssets) {
  const name = String(filename || "");
  if (liveAssets?.checkpoints?.includes(name) || liveAssets?.unets?.includes(name)) return true;
  return INSTALLED_CHECKPOINTS.has(name);
}

function resolveWorkflowParamDefs(workflowId) {
  const wf = WORKFLOWS[workflowId];
  if (!wf) return [];
  const overrides = wf.paramOverrides || {};
  return (wf.params || [])
    .map((id) => {
      const base = PARAM_SCHEMA.find((p) => p.id === id);
      if (!base) return null;
      const o = overrides[id] || {};
      const def = wf.defaults?.[id] ?? o.default ?? base.default;
      return { ...base, ...o, default: def };
    })
    .filter(Boolean);
}

function modelReady(model, liveAssets) {
  if (LAB_PAUSED || !comfyConfigured()) return false;
  if (!checkpointInstalled(model.checkpoint, liveAssets)) return false;
  return model.workflows.some((w) => workflowInstalled(w));
}

function getWorkflow(workflowId) {
  return WORKFLOWS[workflowId] || null;
}

function getModel(modelId) {
  return MODELS.find((m) => m.id === modelId) || null;
}

function canRun(modelId, workflowId, liveAssets) {
  if (LAB_PAUSED) return false;
  const model = getModel(modelId);
  if (!model) return false;
  return checkpointInstalled(model.checkpoint, liveAssets) && workflowInstalled(workflowId);
}

function getCatalog(liveAssets = null) {
  const models = MODELS.map((m) => ({
    id: m.id,
    label: m.label,
    family: m.family,
    pipeline: m.pipeline,
    note: m.note,
    ready: modelReady(m, liveAssets),
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
          param_defs: resolveWorkflowParamDefs(wid),
          defaults: wf.defaults || {},
          ready: modelReady(m, liveAssets) && workflowInstalled(wid),
        };
      })
      .filter(Boolean),
  }));
  return {
    lab_provider: LAB_PROVIDER,
    lab_paused: LAB_PAUSED,
    lab_message: LAB_PAUSE_MESSAGE,
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
  LAB_PROVIDER,
  LAB_PAUSED,
  LAB_PAUSE_MESSAGE,
  INSTALLED_WORKFLOWS,
  INSTALLED_CHECKPOINTS,
  getCatalog,
  getWorkflow,
  getModel,
  modelReady,
  workflowInstalled,
  checkpointInstalled,
  resolveWorkflowParamDefs,
  canRun,
};
