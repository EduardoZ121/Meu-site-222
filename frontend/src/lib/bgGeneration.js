/**
 * Drop-in replacement for the blocking `await pollPrediction(...)` flow.
 *
 * Old usage:
 *   trackPendingPrediction(id, meta);
 *   const data = await pollPrediction(id, { ... });
 *   setResult(data.creation);  ← removed
 *
 * New usage:
 *   await dispatchBackgroundJob(submitData, { type, creditsSpent, label, t });
 *   // Returns immediately. User sees toast. Notification panel + bell +
 *   // gallery are updated automatically by the global watcher when ready.
 */

import { toast } from "sonner";
import { trackPendingPrediction } from "./api";

export const MAX_CONCURRENT_BG_JOBS = 3;
const RP_PREDICTION_PREFIX = "rp_prediction_";

export function activeBackgroundJobsCount() {
  if (typeof window === "undefined") return 0;
  try {
    let n = 0;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(RP_PREDICTION_PREFIX)) n += 1;
    }
    return n;
  } catch {
    return 0;
  }
}

export function ensureBackgroundSlot() {
  if (activeBackgroundJobsCount() >= MAX_CONCURRENT_BG_JOBS) {
    toast.error(
      `Já tens ${MAX_CONCURRENT_BG_JOBS} gerações em curso. Espera por uma terminar.`,
      { duration: 6000 },
    );
    const err = new Error("BG_JOB_LIMIT");
    err.code = "BG_LIMIT";
    throw err;
  }
}

/**
 * @param {object} submitData - Server response containing prediction_id.
 * @param {object} opts
 * @param {string} [opts.type]
 * @param {number} [opts.creditsSpent]
 * @param {string} [opts.label] - Display name (e.g. "Estúdio artístico")
 */
export function dispatchBackgroundJob(submitData, opts = {}) {
  const predictionId = submitData?.prediction_id;
  if (!predictionId) {
    throw new Error("Resposta inválida do servidor (sem prediction_id).");
  }
  const creditsSpent = opts.creditsSpent ?? submitData.credits_spent ?? 0;
  const type = opts.type || submitData.type || "image";

  trackPendingPrediction(predictionId, { credits_spent: creditsSpent, type });

  if (submitData.new_balance != null && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rp:credits-sync", { detail: { credits: submitData.new_balance } }),
    );
  }

  const active = activeBackgroundJobsCount();
  const label = opts.label || (type === "video" ? "Vídeo" : "Geração");

  toast.success(
    `${label} em curso. Vais ser avisado quando terminar — podes sair ou recarregar a página.`,
    {
      id: `bg-${predictionId}`,
      duration: 7000,
      description: `Trabalhos em segundo plano: ${active}/${MAX_CONCURRENT_BG_JOBS}.`,
    },
  );

  return { predictionId, isBackground: true };
}
