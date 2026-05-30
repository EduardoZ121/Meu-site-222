/** GET /api/health — confirma serverless + estado das integrações (sem expor segredos). */
const { storageEnabled } = require("./lib/mongo.cjs");
const { isBlobConfigured, isBlobDisabled, getBlobReadWriteToken, getBlobStoreId } = require("./lib/blobEnv.cjs");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  const replicate = Boolean(String(process.env.REPLICATE_API_TOKEN || "").trim());
  const openai = Boolean(String(process.env.OPENAI_API_KEY || "").trim());
  const stripe = Boolean(String(process.env.STRIPE_SECRET_KEY || "").trim());
  const blobDisabled = isBlobDisabled();
  const blob = isBlobConfigured();
  const mongo = storageEnabled();
  return res.status(200).json({
    ok: true,
    api: "remakepix",
    build: process.env.REACT_APP_BUILD_ID || "artistic-removed-20260530",
    ts: Date.now(),
    integrations: {
      replicate,
      openai,
      mongo,
      stripe,
      blob,
      blob_disabled: blobDisabled,
      blob_store: Boolean(getBlobStoreId()),
      blob_rw_token: Boolean(getBlobReadWriteToken()),
    },
    ready: {
      generate: replicate && mongo,
      prompt_assist: openai,
      billing: stripe && mongo,
      gallery_persist: mongo,
      large_upload: blob,
    },
  });
};
