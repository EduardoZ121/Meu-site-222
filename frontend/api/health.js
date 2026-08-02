/** GET /api/health — confirma serverless + estado das integrações (sem expor segredos). */
const {
  storageEnabled,
  mongoEnabled,
  blobColEnabled,
  resolveStorageBackendLabel,
} = require("./lib/mongo.cjs");
const { isBlobConfigured, isBlobDisabled, getBlobReadWriteToken, getBlobStoreId } = require("./lib/blobEnv.cjs");
const { pingBlobColDb } = require("./lib/blobColDb.cjs");
const { isS3Configured, resolveBucketName } = require("./lib/s3Upload.cjs");

async function pingKvStorage() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return { ok: false, reason: "kv_not_configured" };
  }
  try {
    const { Redis } = require("@upstash/redis");
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    await redis.ping();
    return { ok: true, reason: "ok" };
  } catch (err) {
    return { ok: false, reason: String(err?.message || err).slice(0, 180) };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  const replicate = Boolean(String(process.env.REPLICATE_API_TOKEN || "").trim());
  const { openaiConfigured, openaiConfigStatus, getOpenAIKey } = require("./lib/openaiEnv.cjs");
  const openaiKey = getOpenAIKey();
  const openai = openaiConfigured();
  const openaiStatus = openaiConfigStatus();
  const stripe = Boolean(String(process.env.STRIPE_SECRET_KEY || "").trim());
  const resend = Boolean(String(process.env.RESEND_API_KEY || "").trim());
  const blobDisabled = isBlobDisabled();
  const blob = isBlobConfigured();
  const s3 = isS3Configured();
  const mongo = storageEnabled();
  const storageBackend = resolveStorageBackendLabel();
  const kvProbe = storageBackend === "kv" ? await pingKvStorage() : null;
  const blobProbe = storageBackend === "blob" ? await pingBlobColDb() : null;
  const storageReady = storageBackend === "mongo"
    ? mongoEnabled()
    : storageBackend === "blob"
      ? Boolean(blobProbe?.ok)
      : storageBackend === "kv"
        ? Boolean(kvProbe?.ok)
        : false;
  const maxDurationSec = Number(process.env.VERCEL_PRO_MAX_DURATION_SEC || 800) || 800;
  let buildId = process.env.APP_BUILD_ID || process.env.REACT_APP_BUILD_ID || "rp-prompt-nolimit-v13";
  try {
    buildId = require("./_buildId.cjs");
  } catch {
    /* prebuild not run — fallback above */
  }
  return res.status(200).json({
    ok: true,
    api: "remakepix",
    build: buildId,
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
      openai_status: openaiStatus.reason || (openai ? "ok" : "missing"),
      mongo,
      storage_backend: storageBackend,
      storage_ready: storageReady,
      kv_status: kvProbe?.reason || null,
      blob_storage_status: blobProbe?.reason || null,
      stripe,
      resend,
      s3,
      s3_bucket: Boolean(resolveBucketName()),
      blob,
      blob_disabled: blobDisabled,
      blob_store: Boolean(getBlobStoreId()),
      blob_rw_token: Boolean(getBlobReadWriteToken()),
    },
    ready: {
      generate: replicate && storageReady,
      prompt_assist: openai,
      billing: stripe && storageReady,
      email_notify: resend,
      gallery_persist: storageReady,
      large_upload: s3 || blob,
      long_running_jobs: maxDurationSec >= 300,
    },
  });
};
