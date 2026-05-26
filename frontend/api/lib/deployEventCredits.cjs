const crypto = require("crypto");
const { getDb, ensureIndexes, storageEnabled } = require("./mongo.cjs");

function nowIso() {
  return new Date().toISOString();
}

function envFlag(name) {
  return String(process.env[name] || "").trim() === "1";
}

function envNum(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * After deploy / event: ensure users have at least N credits (or set to N).
 * Off by default — enable with DEPLOY_EVENT_CREDITS_ENABLED=1 on Vercel.
 */
async function runDeployEventCredits(opts = {}) {
  if (!envFlag("DEPLOY_EVENT_CREDITS_ENABLED")) {
    return {
      ok: true,
      skipped: true,
      reason: "DEPLOY_EVENT_CREDITS_ENABLED is not set to 1",
    };
  }

  if (!storageEnabled()) {
    return { ok: false, skipped: true, reason: "MongoDB not configured (MONGO_URL)" };
  }

  await ensureIndexes();
  const db = await getDb();
  const amount = envNum("DEPLOY_EVENT_CREDITS_AMOUNT", 50);
  const mode = String(process.env.DEPLOY_EVENT_MODE || "min").toLowerCase();
  const includePaying = envFlag("DEPLOY_EVENT_INCLUDE_PAYING");

  let paidUserIds = [];
  if (!includePaying) {
    paidUserIds = await db.collection("purchases").distinct("user_id", { status: "completed" });
  }

  const filter = {
    is_unlimited: { $ne: true },
    role: { $ne: "admin" },
    banned: { $ne: true },
  };
  if (paidUserIds.length) {
    filter.id = { $nin: paidUserIds };
  }

  if (mode === "set") {
    filter.credits = { $exists: true };
  } else {
    filter.$or = [{ credits: { $lt: amount } }, { credits: { $exists: false } }];
  }

  const update = mode === "set" ? { $set: { credits: amount } } : { $set: { credits: amount } };

  const result = await db.collection("users").updateMany(filter, update);

  const eventId = opts.deploymentId || `dep_${Date.now().toString(36)}`;
  await db.collection("site_settings").updateOne(
    { _id: "deploy_event" },
    {
      $set: {
        last_run_at: nowIso(),
        last_deployment_id: eventId,
        last_mode: mode,
        last_amount: amount,
        last_modified: result.modifiedCount,
        last_matched: result.matchedCount,
      },
    },
    { upsert: true },
  );

  await db.collection("credit_transactions").insertOne({
    id: `tx_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
    user_id: "__system__",
    amount: 0,
    type: "deploy_event",
    description: `Deploy event credits (${mode}=${amount}) · ${result.modifiedCount} users updated`,
    metadata: {
      deployment_id: eventId,
      mode,
      amount,
      include_paying: includePaying,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    },
    created_at: nowIso(),
  });

  return {
    ok: true,
    skipped: false,
    deployment_id: eventId,
    mode,
    credits_amount: amount,
    include_paying: includePaying,
    matched: result.matchedCount,
    modified: result.modifiedCount,
  };
}

function verifyDeployWebhook(req) {
  const secret = String(process.env.DEPLOY_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    const err = new Error("DEPLOY_WEBHOOK_SECRET not configured");
    err.status = 503;
    throw err;
  }
  const auth = req.headers.authorization || "";
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  const header = req.headers["x-deploy-secret"] || "";
  const q = req.query?.secret || "";
  if (bearer === secret || header === secret || q === secret) return true;
  const err = new Error("Unauthorized deploy webhook");
  err.status = 401;
  throw err;
}

module.exports = { runDeployEventCredits, verifyDeployWebhook };
