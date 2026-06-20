const { getSessionIdentity, requireSessionIdentity } = require("../lib/marketplaceAuth.cjs");
const { ensureMarketplaceIndexes, listListings, createListing } = require("../lib/marketplaceDb.cjs");

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) reject(Object.assign(new Error("Payload grande."), { status: 413 }));
    });
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

    if (req.method === "GET") {
      const filters = {
        category: req.query?.category,
        operation: req.query?.operation,
        province: req.query?.province,
        municipality: req.query?.municipality,
        neighborhood: req.query?.neighborhood,
        owner_type: req.query?.owner_type,
      };
      const rows = await listListings(filters);
      const identity = getSessionIdentity(req);
      return json(res, 200, {
        ok: true,
        listings: rows,
        auth: Boolean(identity),
      });
    }

    if (req.method === "POST") {
      const identity = requireSessionIdentity(req);
      const body = await readBody(req);
      const listing = await createListing(identity, body);
      return json(res, 201, { ok: true, listing });
    }

    return json(res, 405, { detail: "Método não permitido." });
  } catch (err) {
    return json(res, err.status || 500, { detail: err.message || "Erro inesperado." });
  }
};
