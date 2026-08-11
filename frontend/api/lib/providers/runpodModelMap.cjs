/**
 * RunPod per-session model map.
 *
 * Maps each site session (generation `type`) to the ComfyUI workflow it should
 * use when the admin RunPod engine is active. This is what lets RunPod behave
 * like "another website with different models inside", swappable per session,
 * without ever touching the Replicate path used by normal users.
 *
 * Design goals:
 *  - Adding a new model = drop a workflow JSON + one line here (no refactor).
 *  - Safe fallback: if a target workflow is not installed on the worker yet,
 *    we transparently fall back to the SDXL workflows that already exist, so
 *    nothing breaks while we provision new models (Flux, PuLID, Kontext, ...).
 *  - `identity:true` marks sessions that MUST preserve the reference face
 *    (Personalizar, Editar). Those need an identity-capable worker; until then
 *    they fall back to SDXL img2img (which won't lock the face — that's the
 *    known limitation we are working to replace).
 */

/**
 * Workflow templates physically installed on the current RunPod worker.
 * Keep this in sync with the JSON files in ./comfyWorkflows and the models
 * baked into the worker image. Extend as the worker gains capabilities.
 */
const INSTALLED_WORKFLOWS = new Set(["flux-txt2img", "flux-img2img"]);

/** Fallbacks guaranteed on the current worker (Flux Dev image). */
const FALLBACK_TXT2IMG = "flux-txt2img";
const FALLBACK_IMG2IMG = "flux-img2img";

/**
 * Target model per session.
 *  - txt2img: workflow when there is NO reference image.
 *  - img2img: workflow when a reference image IS provided.
 *  - identity: true => session relies on preserving the reference person's face.
 */
const SESSION_MODEL_MAP = {
  // Identity-critical sessions (ideally face-locking; needs Kontext/PuLID worker).
  // Until that worker exists, Flux img2img uses the reference for scene/pose.
  easy: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: true },
  identity: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: true },
  padrao: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: true },
  edit: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: true },
  clothes: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: true },
  inpaint: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: true },

  // Quality sessions where a fixed face is not required.
  image: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: false },
  pro: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: false },
  artistic: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: false },
  poster: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: false },
  carousel: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: false },
  brand_campaign: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: false },
  manga: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: false },
  manga_panel: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: false },
  manga_page: { txt2img: "flux-txt2img", img2img: "flux-img2img", identity: false },
};

const DEFAULT_ENTRY = {
  txt2img: FALLBACK_TXT2IMG,
  img2img: FALLBACK_IMG2IMG,
  identity: false,
};

function entryForType(type) {
  const key = String(type || "").toLowerCase();
  return SESSION_MODEL_MAP[key] || DEFAULT_ENTRY;
}

/**
 * Resolve which ComfyUI workflow to run for a given session + input.
 * @param {{ type?: string, hasImage?: boolean }} args
 * @returns {{
 *   template: string,      // workflow that will actually run (installed)
 *   wanted: string,        // target workflow for this session (may not be installed yet)
 *   identity: boolean,     // session needs face preservation
 *   installed: boolean,    // whether the wanted workflow is available on the worker
 *   fellBack: boolean      // true when we substituted the SDXL fallback
 * }}
 */
function resolveWorkflow({ type, hasImage } = {}) {
  const entry = entryForType(type);
  const wanted = hasImage ? entry.img2img : entry.txt2img;
  const installed = INSTALLED_WORKFLOWS.has(wanted);
  const template = installed
    ? wanted
    : (hasImage ? FALLBACK_IMG2IMG : FALLBACK_TXT2IMG);
  return {
    template,
    wanted,
    identity: Boolean(entry.identity),
    installed,
    fellBack: template !== wanted,
  };
}

function isWorkflowInstalled(name) {
  return INSTALLED_WORKFLOWS.has(String(name || ""));
}

module.exports = {
  INSTALLED_WORKFLOWS,
  SESSION_MODEL_MAP,
  resolveWorkflow,
  isWorkflowInstalled,
};
