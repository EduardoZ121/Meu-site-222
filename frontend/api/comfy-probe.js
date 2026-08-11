/**
 * GET /api/comfy-probe?key=... — E2E lab test from Vercel (not client network).
 * Key must match LAB_PROBE_SECRET env var. Admin diagnostics only.
 */
module.exports = async function handler(req, res) {
  try {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET only" });

  const secret = String(process.env.LAB_PROBE_SECRET || "").trim();
  const key = String(req.query?.key || "").trim();
  if (!secret || key !== secret) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const comfy = require("./lib/providers/comfyUiProvider.cjs");
  const configured = comfy.isConfigured();
  const resolved = await comfy.resolveConnection().catch(() => null);
  const baseUrl = resolved?.baseUrl || comfy.config().baseUrl || null;

  const health = configured ? await comfy.checkHealth() : { ok: false, message: "COMFYUI_BASE_URL missing" };
  if (!health.ok) {
    return res.status(503).json({
      ok: false,
      phase: "health",
      configured,
      base_url: baseUrl,
      health,
      vercel_region: process.env.VERCEL_REGION || null,
    });
  }

  const lab = require("./lib/aiLab/labGenerate.cjs");
  const started = Date.now();
  let jobId;
  try {
    const out = await lab.submitLabGeneration({
      modelId: "sd15",
      workflowId: "sd15-txt2img",
      prompt: "red apple on wooden table, studio photo, probe test",
      params: { steps: 10, width: 512, height: 512, seed: 99, cfg: 7 },
    });
    jobId = out.job_id;
  } catch (e) {
    return res.status(502).json({
      ok: false,
      phase: "submit",
      configured,
      base_url: baseUrl,
      error: String(e.message || e).slice(0, 400),
      ms: Date.now() - started,
      vercel_region: process.env.VERCEL_REGION || null,
    });
  }

  for (let i = 0; i < 72; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const status = await lab.getLabJobStatus(jobId);
    if (status.status === "succeeded") {
      const rawUrls = Array.isArray(status.output) ? status.output : [];
      let publicUrl = null;
      if (rawUrls[0]) {
        try {
          const mirrored = await comfy.mirrorOutputUrls(rawUrls, { userId: "ai-lab-probe" });
          publicUrl = mirrored[0] || null;
        } catch {
          publicUrl = null;
        }
      }
      return res.status(200).json({
        ok: true,
        phase: "done",
        job_id: jobId,
        ms: Date.now() - started,
        image_url: publicUrl || rawUrls[0] || null,
        image_public: Boolean(publicUrl),
        url_count: rawUrls.length,
        vercel_region: process.env.VERCEL_REGION || null,
      });
    }
    if (status.status === "failed") {
      return res.status(502).json({
        ok: false,
        phase: "generate",
        job_id: jobId,
        error: status.error || "failed",
        ms: Date.now() - started,
        vercel_region: process.env.VERCEL_REGION || null,
      });
    }
  }

  return res.status(504).json({
    ok: false,
    phase: "timeout",
    job_id: jobId,
    ms: Date.now() - started,
    vercel_region: process.env.VERCEL_REGION || null,
  });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      phase: "crash",
      error: String(e?.message || e).slice(0, 400),
      vercel_region: process.env.VERCEL_REGION || null,
    });
  }
};
