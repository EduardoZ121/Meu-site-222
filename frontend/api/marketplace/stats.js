const { ensureMarketplaceIndexes, computeZoneAverages } = require("../lib/marketplaceDb.cjs");

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") return json(res, 405, { detail: "Método não permitido." });
  try {
    await ensureMarketplaceIndexes();
    const zones = await computeZoneAverages();
    return json(res, 200, { ok: true, zones });
  } catch (err) {
    return json(res, err.status || 500, { detail: err.message || "Erro inesperado." });
  }
};
