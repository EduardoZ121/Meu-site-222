const { runWeeklyReport } = require("../lib/weeklyReport.cjs");

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
    const result = await runWeeklyReport();
    const status = result.ok || result.skipped ? 200 : 500;
    return res.status(status).json(result);
  } catch (e) {
    return res.status(500).json({ detail: e.message || "Weekly report failed" });
  }
};
