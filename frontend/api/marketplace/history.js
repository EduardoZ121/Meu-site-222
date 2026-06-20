const { requireSessionIdentity } = require("../lib/marketplaceAuth.cjs");
const { ensureMarketplaceIndexes, addHistory, listHistory } = require("../lib/marketplaceDb.cjs");

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(Object.assign(new Error("JSON inválido."), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    await ensureMarketplaceIndexes();
    const identity = requireSessionIdentity(req);

    if (req.method === "GET") {
      const items = await listHistory(identity);
      return json(res, 200, { ok: true, items });
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      await addHistory(identity, body.listing_id);
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { detail: "Método não permitido." });
  } catch (err) {
    return json(res, err.status || 500, { detail: err.message || "Erro inesperado." });
  }
};
