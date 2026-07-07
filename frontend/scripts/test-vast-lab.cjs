/**
 * Real E2E test: ComfyUI on Vast → submit Flux txt2img → poll until image or fail.
 * Usage: COMFYUI_BASE_URL=https://ID-8188.proxy.vast.ai node scripts/test-vast-lab.cjs
 */
const COMFY = String(process.env.COMFYUI_BASE_URL || "https://43063782-8188.proxy.vast.ai").replace(/\/$/, "");
const BEARER = String(process.env.COMFYUI_BEARER_TOKEN || process.env.VAST_OPEN_BUTTON_TOKEN || "").trim();

async function comfy(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (BEARER && !headers.Authorization) headers.Authorization = `Bearer ${BEARER}`;
  const res = await fetch(`${COMFY}${path}`, {
    ...opts,
    headers,
    signal: AbortSignal.timeout(120_000),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 300); }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("COMFYUI_BASE_URL", COMFY);
  const stats = await comfy("/system_stats");
  console.log("health OK", stats?.system?.comfyui_version || "comfy up");

  const g = require("../api/lib/aiLab/labGenerate.cjs");
  process.env.COMFYUI_BASE_URL = COMFY;
  if (BEARER) process.env.COMFYUI_BEARER_TOKEN = BEARER;
  const out = await g.submitLabGeneration({
    modelId: "flux-dev",
    workflowId: "flux-txt2img",
    prompt: "red apple on wooden table, studio photo",
    params: { steps: 12, width: 512, height: 512, seed: 42 },
  });
  console.log("submitted job_id", out.job_id);

  const start = Date.now();
  for (let i = 0; i < 80; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await g.getLabJobStatus(out.job_id);
    const sec = Math.round((Date.now() - start) / 1000);
    process.stdout.write(`\r${sec}s ${s.status} ${s.raw_status || ""} ${s.error || ""}`.slice(0, 100));
    if (s.status === "succeeded") {
      const urls = Array.isArray(s.output) ? s.output : [];
      console.log("\nSUCCESS", urls[0] || s.output);
      process.exit(0);
    }
    if (s.status === "failed") {
      console.log("\nFAILED", s.error);
      process.exit(1);
    }
  }
  console.log("\nTIMEOUT after poll");
  process.exit(1);
}

main().catch((e) => {
  console.error("ERROR", e.message);
  process.exit(1);
});
