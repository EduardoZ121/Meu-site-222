const { requireSessionIdentity } = require("../lib/marketplaceAuth.cjs");
const { ensureMarketplaceIndexes, getOrCreateProfile, updateProfile } = require("../lib/marketplaceDb.cjs");

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
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    await ensureMarketplaceIndexes();
    const identity = requireSessionIdentity(req);

    if (req.method === "GET") {
      const profile = await getOrCreateProfile(identity);
      return json(res, 200, { ok: true, profile });
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      const profile = await updateProfile(identity, {
        name: body.name,
        phone: body.phone,
        account_type: body.account_type,
        verified_profile: Boolean(body.verified_profile),
        verified_phone: Boolean(body.verified_phone),
        verified_document: Boolean(body.verified_document),
      });
      return json(res, 200, { ok: true, profile });
    }

    return json(res, 405, { detail: "Método não permitido." });
  } catch (err) {
    return json(res, err.status || 500, { detail: err.message || "Erro inesperado." });
  }
};
