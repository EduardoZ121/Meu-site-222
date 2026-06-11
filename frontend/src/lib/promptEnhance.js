import { api, formatApiError } from "./api";

/** Client-side prompt improve (bills via /prompt/improve). */
export async function improvePromptClient(prompt, { tool = "", lang = "en", imageMode = false } = {}) {
  const trimmed = String(prompt || "").trim();
  if (trimmed.length < 3) return trimmed;
  const { data } = await api.post("/prompt/improve", {
    prompt: trimmed,
    tool,
    lang,
    image_mode: imageMode,
  });
  return data?.prompt?.trim() || trimmed;
}

export async function improvePromptWithToast(prompt, opts, t) {
  try {
    return await improvePromptClient(prompt, opts);
  } catch (err) {
    throw new Error(formatApiError(err, t?.("studio_improve_fail") || "Prompt improve failed", { t }));
  }
}
