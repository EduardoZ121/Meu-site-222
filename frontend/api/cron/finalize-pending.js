const { processActivePendingBatch } = require("../lib/pendingPredictions.cjs");

async function getReplicatePrediction(id) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN missing");
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Replicate ${res.status}`);
  }
  return res.json();
}

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || "";
    const q = req.query?.secret || req.headers["x-cron-secret"];
    const bearer = auth.replace(/^Bearer\s+/i, "").trim();
    if (bearer !== secret && q !== secret) {
      return res.status(401).json({ detail: "Unauthorized cron" });
    }
  }

  try {
    const result = await processActivePendingBatch(getReplicatePrediction, { limit: 10 });
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    return res.status(500).json({ detail: e.message || "finalize-pending failed" });
  }
};
