/** GET /api/health — confirma serverless + estado das integrações (sem expor segredos). */
const { storageEnabled } = require("./lib/mongo.cjs");
const { isBlobConfigured, isBlobDisabled, getBlobReadWriteToken, getBlobStoreId } = require("./lib/blobEnv.cjs");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  const replicate = Boolean(String(process.env.REPLICATE_API_TOKEN || "").trim());
  const { openaiConfigured, getOpenAIKey } = require("./lib/openaiEnv.cjs");
  const openaiKey = getOpenAIKey();
  const openai = openaiConfigured();
  const stripe = Boolean(String(process.env.STRIPE_SECRET_KEY || "").trim());
  const blobDisabled = isBlobDisabled();
  const blob = isBlobConfigured();
  const mongo = storageEnabled();
  const maxDurationSec = Number(process.env.VERCEL_PRO_MAX_DURATION_SEC || 800) || 800;
  return res.status(200).json({
    ok: true,
    api: "remakepix",
    build: process.env.REACT_APP_BUILD_ID || "upload-generate-v11",
    ts: Date.now(),
    platform: {
      vercel_env: process.env.VERCEL_ENV || null,
      vercel_region: process.env.VERCEL_REGION || null,
      max_duration_sec: maxDurationSec,
      fluid_compute: true,
      crons: ["finalize-pending", "weekly-report"],
      background_tasks: true,
    },
    integrations: {
      replicate,
      openai,
      openai_env: openaiKey.source,
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
      long_running_jobs: maxDurationSec >= 300,
    },
  });
};
