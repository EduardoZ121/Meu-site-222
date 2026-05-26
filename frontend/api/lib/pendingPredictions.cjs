const crypto = require("crypto");
const { getDb, storageEnabled, ensureIndexes } = require("./mongo.cjs");
const { addCredits, recordCreation } = require("./usersDb.cjs");
const { formatGenerationError } = require("./generationErrors.cjs");
const { extractUrls, mirrorUrlsToBlob } = require("./creationMedia.cjs");

function nowIso() {
  return new Date().toISOString();
}

function newPendingId() {
  return `rp_${crypto.randomUUID()}`;
}

async function createPending(doc) {
  if (!storageEnabled()) return null;
  await ensureIndexes();
  const db = await getDb();
  const row = {
    id: doc.id || newPendingId(),
    user_id: doc.user_id,
    replicate_prediction_id: doc.replicate_prediction_id,
    type: doc.type || "image",
    prompt: doc.prompt || "",
    model_used: doc.model_used || "Motor IA",
    aspect_ratio: doc.aspect_ratio || "1:1",
    credits_spent: doc.credits_spent || 0,
    status: "starting",
    result_urls: [],
    error: null,
    balance_after_spend: doc.balance_after_spend ?? null,
    lang: doc.lang || "en",
    polled_count: 0,
    created_at: nowIso(),
    completed_at: null,
  };
  await db.collection("pending_predictions").insertOne(row);
  return row;
}

async function getPending(id) {
  if (!storageEnabled() || !id) return null;
  const db = await getDb();
  return db.collection("pending_predictions").findOne({ id }, { projection: { _id: 0 } });
}

async function updatePending(id, patch) {
  if (!storageEnabled()) return;
  const db = await getDb();
  await db.collection("pending_predictions").updateOne({ id }, { $set: patch });
}

function elapsedSeconds(pending) {
  try {
    const started = new Date(pending.created_at).getTime();
    return Math.floor((Date.now() - started) / 1000);
  } catch {
    return 0;
  }
}

function creationFromPending(pending, urls) {
  const typeMap = {
    video: "video",
    artistic: "artistic",
    manga: "manga",
    poster: "poster",
    carousel: "carousel",
  };
  const resolved = typeMap[pending.type] || "image";
  return {
    id: pending.id,
    type: resolved,
    prompt: pending.prompt || "Remake Pixel generation",
    model_used: pending.model_used,
    aspect_ratio: pending.aspect_ratio,
    result_urls: urls,
    credits_spent: pending.credits_spent,
    is_favorite: false,
    is_public: false,
    created_at: nowIso(),
    server_billing: true,
  };
}

/**
 * Finalize poll: refund on failure, save creation on success.
 * @param {object} pending
 * @param {{ status: string, output?: unknown, error?: string }} replicateInfo
 * @param {(id: string) => Promise<object>} getReplicatePrediction — optional, unused if info complete
 */
async function finalizePending(pending, replicateInfo) {
  const userId = pending.user_id;
  const cost = pending.credits_spent;
  const lang = pending.lang || "en";
  const now = nowIso();

  if (replicateInfo.status === "succeeded") {
    let urls = extractUrls(replicateInfo.output);
    urls = await mirrorUrlsToBlob(urls);
    if (!urls.length) {
      const newBalance = await addCredits(userId, cost, "refund", "Refund: empty output");
      await updatePending(pending.id, {
        status: "refunded",
        error: "empty output",
        completed_at: now,
      });
      return {
        status: "failed",
        error: formatGenerationError("empty output", lang),
        new_balance: newBalance,
        prediction_id: pending.id,
        refunded: true,
      };
    }
    const creation = creationFromPending(pending, urls);
    await recordCreation(userId, creation);
    await updatePending(pending.id, {
      status: "completed",
      result_urls: urls,
      completed_at: now,
    });
    const db = await getDb();
    const user = await db.collection("users").findOne({ id: userId }, { projection: { credits: 1 } });
    return {
      status: "succeeded",
      creation,
      new_balance: user?.credits ?? pending.balance_after_spend,
      prediction_id: pending.id,
      server_billing: true,
    };
  }

  const rawErr = replicateInfo.error || "Generation failed";
  const friendly = formatGenerationError(rawErr, lang);
  const newBalance = await addCredits(userId, cost, "refund", `Refund: ${String(rawErr).slice(0, 120)}`);
  await updatePending(pending.id, {
    status: "refunded",
    error: String(rawErr).slice(0, 300),
    completed_at: now,
  });
  return {
    status: "failed",
    error: friendly,
    new_balance: newBalance,
    prediction_id: pending.id,
    refunded: true,
  };
}

async function pollPending(pending, getReplicatePrediction) {
  const lang = pending.lang || "en";

  if (pending.status === "completed") {
    const db = await getDb();
    const user = await db.collection("users").findOne({ id: pending.user_id }, { projection: { credits: 1 } });
    return {
      status: "succeeded",
      creation: creationFromPending(pending, pending.result_urls || []),
      new_balance: user?.credits,
      prediction_id: pending.id,
      server_billing: true,
    };
  }

  if (pending.status === "refunded") {
    const db = await getDb();
    const user = await db.collection("users").findOne({ id: pending.user_id }, { projection: { credits: 1 } });
    return {
      status: "failed",
      error: formatGenerationError(pending.error || "Generation failed", lang),
      new_balance: user?.credits,
      prediction_id: pending.id,
      refunded: true,
    };
  }

  let info;
  try {
    info = await getReplicatePrediction(pending.replicate_prediction_id);
  } catch (e) {
    const elapsed = elapsedSeconds(pending);
    if (elapsed > 240) {
      return finalizePending(pending, {
        status: "failed",
        error: `Timeout after ${elapsed}s polling Replicate`,
      });
    }
    return {
      status: "processing",
      elapsed_seconds: elapsed,
      prediction_id: pending.id,
    };
  }

  const status = info.status;
  await updatePending(pending.id, {
    status,
    polled_count: (pending.polled_count || 0) + 1,
  });

  if (status === "succeeded" || status === "failed" || status === "canceled") {
    return finalizePending(pending, {
      status: status === "canceled" ? "failed" : status,
      output: info.output,
      error: info.error || (status === "canceled" ? "Canceled" : "Generation failed"),
    });
  }

  return {
    status: "processing",
    elapsed_seconds: elapsedSeconds(pending),
    prediction_id: pending.id,
  };
}

module.exports = {
  newPendingId,
  createPending,
  getPending,
  finalizePending,
  pollPending,
};
