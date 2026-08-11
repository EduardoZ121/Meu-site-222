import { getImageModel } from "./imageModelCatalog";

/** Provider label from existing replicateId namespace — never invents conflicting brands. */
const PROVIDER_BY_NS = {
  xai: "xAI",
  google: "Google",
  bytedance: "ByteDance",
  "black-forest-labs": "Black Forest Labs",
  "ideogram-ai": "Ideogram",
  "recraft-ai": "Recraft",
};

export function imageModelProvider(modelOrId) {
  const m = typeof modelOrId === "string" ? getImageModel(modelOrId) : modelOrId;
  const ns = String(m?.replicateId || "").split("/")[0];
  return PROVIDER_BY_NS[ns] || ns || "";
}

/** i18n blurb key when present; falls back to tag keys already in catalog. */
export function imageModelBlurbKey(modelOrId) {
  const m = typeof modelOrId === "string" ? getImageModel(modelOrId) : modelOrId;
  if (!m?.id) return null;
  return `model_blurb_${m.id}`;
}
