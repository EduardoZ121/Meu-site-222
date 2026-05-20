/** GET /api/health — confirma que as serverless functions estão activas. */
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  return res.status(200).json({
    ok: true,
    api: "remakepix",
    ts: Date.now(),
  });
};
