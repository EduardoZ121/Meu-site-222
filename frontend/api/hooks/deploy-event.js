const { runDeployEventCredits, verifyDeployWebhook } = require("../lib/deployEventCredits.cjs");

/**
 * POST /api/hooks/deploy-event
 * Call after Vercel production deploy (Deployment Succeeded webhook).
 * Requires DEPLOY_WEBHOOK_SECRET + DEPLOY_EVENT_CREDITS_ENABLED=1
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    verifyDeployWebhook(req);
  } catch (e) {
    return res.status(e.status || 401).json({ detail: e.message });
  }

  let body = {};
  try {
    if (req.body && typeof req.body === "object") body = req.body;
    else if (typeof req.body === "string" && req.body) body = JSON.parse(req.body);
  } catch {
    body = {};
  }

  const deploymentId =
    body.id || body.deploymentId || body.payload?.deployment?.id || null;

  try {
    const result = await runDeployEventCredits({ deploymentId });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ detail: e.message || "Deploy event failed" });
  }
};
