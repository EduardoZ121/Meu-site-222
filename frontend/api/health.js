/** GET /api/health — confirma serverless + estado das integrações (sem expor segredos). */
const { storageEnabled } = require("./lib/mongo.cjs");
const { isBlobConfigured, isBlobDisabled } = require("./lib/blobEnv.cjs");
let isS3Configured = () => false;
try {
  ({ isS3Configured } = require("./lib/s3Upload.cjs"));
} catch {
  isS3Configured = () => false;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  const replicate = Boolean(String(process.env.REPLICATE_API_TOKEN || "").trim());
  const openai = Boolean(String(process.env.OPENAI_API_KEY || "").trim());
  const stripe = Boolean(String(process.env.STRIPE_SECRET_KEY || "").trim());
  const blobDisabled = isBlobDisabled();
  const blob = isBlobConfigured();
  const s3 = isS3Configured();
  const mongo = storageEnabled();
  return res.status(200).json({
    ok: true,
    api: "remakepix",
    build: "s3-vercel-aws-v1",
    ts: Date.now(),
    integrations: {
      replicate,
      openai,
      mongo,
      stripe,
      blob,
      blob_disabled: blobDisabled,
      s3,
      s3_env_present: {
        bucket: Boolean(String(process.env.AWS_S3_BUCKET || "").trim()),
        resource_arn: Boolean(String(process.env.AWS_RESOURCE_ARN || "").trim()),
        role_arn: Boolean(String(process.env.AWS_ROLE_ARN || "").trim()),
        access_key: Boolean(String(process.env.AWS_ACCESS_KEY_ID || "").trim()),
      },
    },
    ready: {
      generate: replicate && mongo,
      prompt_assist: openai,
      billing: stripe && mongo,
      gallery_persist: mongo,
      large_upload: s3,
    },
  });
};
