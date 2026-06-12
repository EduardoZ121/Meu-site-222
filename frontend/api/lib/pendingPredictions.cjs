const crypto = require("crypto");
const { getDb, storageEnabled, ensureIndexes } = require("./mongo.cjs");
const { addCredits, recordCreation } = require("./usersDb.cjs");
const { formatGenerationError } = require("./generationErrors.cjs");
const { extractUrls, mirrorUrlsToBlob } = require("./creationMedia.cjs");
const { sendVideoReadyEmail } = require("./videoNotifyEmail.cjs");

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
    notify_email: doc.notify_email || null,
    notify_email_sent_at: null,
    notify_email_attempts: 0,
    notify_email_error: null,
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

async function deliverVideoNotifyEmail(pending, creation, urls) {
  if (pending?.type !== "video" || !pending?.notify_email) {
    return { skipped: true, reason: "no_notify" };
  }
  if (pending.notify_email_sent_at) {
    return { skipped: true, reason: "already_sent" };
  }

  const db = await getDb();
  const claim = await db.collection("pending_predictions").findOneAndUpdate(
    {
      id: pending.id,
      notify_email: { $type: "string", $ne: "" },
      notify_email_sent_at: null,
    },
    {
      $set: { notify_email_sent_at: nowIso(), notify_email_error: null },
    },
    { returnDocument: "before" },
  );
  if (!claim) {
    return { skipped: true, reason: "already_sent" };
  }

  const videoUrl = Array.isArray(urls) && urls.length ? urls[0] : null;
  const galleryUrl = creation?.id
    ? `https://www.remakepix.com/app/gallery?focus=${encodeURIComponent(creation.id)}`
    : "https://www.remakepix.com/app/gallery";
  const result = await sendVideoReadyEmail({
    to: pending.notify_email,
    lang: pending.lang || "pt",
    videoUrl,
    galleryUrl,
    creationId: creation?.id,
  });

  if (!result.ok) {
    const attempts = Number(claim.notify_email_attempts || 0) + 1;
    await updatePending(pending.id, {
      notify_email_sent_at: attempts >= 3 ? nowIso() : null,
      notify_email_attempts: attempts,
      notify_email_error: String(result.error || result.reason || "send_failed").slice(0, 200),
    });
  }

  return result;
}

function isOpenAIPosterJob(pending) {
  const rid = String(pending?.replicate_prediction_id || "");
  return rid.startsWith("openai-poster");
}

/** Vercel Pro: até 800s por função; vídeo Replicate pode levar 30 min. */
function maxPollSeconds(pending) {
  if (pending?.type === "video") return 1800;
  if (isOpenAIPosterJob(pending)) return 780;
  return 600;
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
      const db = await getDb();
      const claimed = await db.collection("pending_predictions").findOneAndUpdate(
        { id: pending.id, status: { $nin: ["completed", "refunded"] } },
        { $set: { status: "refunded", error: "empty output", completed_at: now } },
        { returnDocument: "after" },
      );
      if (!claimed) {
        return pollPending(pending, async () => replicateInfo);
      }
      const newBalance = await addCredits(userId, cost, "refund", "Refund: empty output");
      return {
        status: "failed",
        error: formatGenerationError("empty output", lang),
        new_balance: newBalance,
        prediction_id: pending.id,
        refunded: true,
      };
    }

    const db = await getDb();
    const claimed = await db.collection("pending_predictions").findOneAndUpdate(
      { id: pending.id, status: { $nin: ["completed", "refunded"] } },
      {
        $set: {
          status: "completed",
          result_urls: urls,
          completed_at: now,
        },
      },
      { returnDocument: "before" },
    );

    if (!claimed) {
      const existing = await getPending(pending.id);
      if (existing?.status === "completed") {
        const creation = creationFromPending(existing, existing.result_urls || urls);
        await deliverVideoNotifyEmail(existing, creation, existing.result_urls || urls);
        const user = await db.collection("users").findOne({ id: userId }, { projection: { credits: 1 } });
        return {
          status: "succeeded",
          creation,
          new_balance: user?.credits ?? pending.balance_after_spend,
          prediction_id: pending.id,
          server_billing: true,
        };
      }
      return pollPending(pending, async () => replicateInfo);
    }

    const creation = creationFromPending(claimed, urls);
    await recordCreation(userId, creation);
    await deliverVideoNotifyEmail({ ...claimed, result_urls: urls }, creation, urls);

    const user = await db.collection("users").findOne({ id: userId }, { projection: { credits: 1 } });
    return {
      status: "succeeded",
      creation,
      new_balance: user?.credits ?? pending.balance_after_spend,
      prediction_id: pending.id,
      server_billing: true,
    };
  }

  const db = await getDb();
  const claimed = await db.collection("pending_predictions").findOneAndUpdate(
    { id: pending.id, status: { $nin: ["completed", "refunded"] } },
    {
      $set: {
        status: "refunded",
        error: String(replicateInfo.error || "Generation failed").slice(0, 300),
        completed_at: now,
      },
    },
    { returnDocument: "before" },
  );

  if (!claimed) {
    return pollPending(pending, async () => replicateInfo);
  }

  const rawErr = replicateInfo.error || "Generation failed";
  const friendly = formatGenerationError(rawErr, lang);
  const newBalance = await addCredits(userId, cost, "refund", `Refund: ${String(rawErr).slice(0, 120)}`);
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
    const creation = creationFromPending(pending, pending.result_urls || []);
    if (pending.notify_email && !pending.notify_email_sent_at && pending.result_urls?.length) {
      await deliverVideoNotifyEmail(pending, creation, pending.result_urls);
    }
    const db = await getDb();
    const user = await db.collection("users").findOne({ id: pending.user_id }, { projection: { credits: 1 } });
    return {
      status: "succeeded",
      creation,
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

  if (isOpenAIPosterJob(pending)) {
    const elapsed = elapsedSeconds(pending);
    if (elapsed > maxPollSeconds(pending)) {
      return finalizePending(pending, {
        status: "failed",
        error: `Timeout after ${elapsed}s waiting for OpenAI poster`,
      });
    }
    await updatePending(pending.id, { polled_count: (pending.polled_count || 0) + 1 });
    return {
      status: "processing",
      elapsed_seconds: elapsed,
      prediction_id: pending.id,
    };
  }

  let info;
  try {
    info = await getReplicatePrediction(pending.replicate_prediction_id);
  } catch (e) {
    const elapsed = elapsedSeconds(pending);
    if (elapsed > maxPollSeconds(pending)) {
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

async function getReplicatePredictionById(id) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN missing");
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Replicate ${res.status}`);
  }
  return res.json();
}

/** Força poll no servidor (galeria mesmo com o browser fechado). */
async function refreshUserPendingJobs(userId, limit = 8) {
  const rows = await listActivePendingForUser(userId, limit);
  for (const pending of rows) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await pollPending(pending, getReplicatePredictionById);
    } catch {
      /* próximo */
    }
  }
  return listActivePendingForUser(userId, 12);
}

async function listActivePendingForUser(userId, limit = 12) {
  if (!storageEnabled() || !userId) return [];
  await ensureIndexes();
  const db = await getDb();
  const docs = await db
    .collection("pending_predictions")
    .find(
      {
        user_id: userId,
        status: { $nin: ["completed", "refunded"] },
      },
      { projection: { _id: 0 } },
    )
    .sort({ created_at: -1 })
    .limit(Math.min(24, Math.max(1, limit)))
    .toArray();
  return docs;
}

/**
 * Cron / background: finalize in-flight jobs without relying on the user's browser.
 */
async function processActivePendingBatch(getReplicatePrediction, { limit = 8 } = {}) {
  if (!storageEnabled()) return { processed: 0, finalized: 0 };
  await ensureIndexes();
  const db = await getDb();
  const docs = await db
    .collection("pending_predictions")
    .find(
      { status: { $nin: ["completed", "refunded"] } },
      { projection: { _id: 0 } },
    )
    .sort({ created_at: 1 })
    .limit(Math.min(20, Math.max(1, limit)))
    .toArray();

  let finalized = 0;
  for (const pending of docs) {
    // eslint-disable-next-line no-await-in-loop
    const result = await pollPending(pending, getReplicatePrediction);
    if (result.status === "succeeded" || result.status === "failed") finalized += 1;
  }

  const retryDocs = await db
    .collection("pending_predictions")
    .find(
      {
        status: "completed",
        type: "video",
        notify_email: { $type: "string", $ne: "" },
        notify_email_sent_at: null,
        notify_email_attempts: { $lt: 3 },
        result_urls: { $exists: true, $ne: [] },
      },
      { projection: { _id: 0 } },
    )
    .sort({ completed_at: 1 })
    .limit(3)
    .toArray();

  for (const pending of retryDocs) {
    const creation = creationFromPending(pending, pending.result_urls || []);
    // eslint-disable-next-line no-await-in-loop
    await deliverVideoNotifyEmail(pending, creation, pending.result_urls);
  }

  return { processed: docs.length, finalized, email_retries: retryDocs.length };
}

async function completePendingWithUrls(pending, urls) {
  const mirrored = await mirrorUrlsToBlob(urls);
  const now = nowIso();
  const db = await getDb();
  const claimed = await db.collection("pending_predictions").findOneAndUpdate(
    { id: pending.id, status: { $nin: ["completed", "refunded"] } },
    {
      $set: {
        status: "completed",
        result_urls: mirrored,
        completed_at: now,
        replicate_prediction_id: pending.replicate_prediction_id || "sync",
      },
    },
    { returnDocument: "before" },
  );
  if (!claimed) {
    const existing = await getPending(pending.id);
    return {
      creation: creationFromPending(existing || pending, existing?.result_urls || mirrored),
      urls: existing?.result_urls || mirrored,
    };
  }
  const creation = creationFromPending(claimed, mirrored);
  await recordCreation(pending.user_id, creation);
  return { creation, urls: mirrored };
}

module.exports = {
  newPendingId,
  createPending,
  getPending,
  updatePending,
  finalizePending,
  pollPending,
  completePendingWithUrls,
  listActivePendingForUser,
  refreshUserPendingJobs,
  processActivePendingBatch,
  maxPollSeconds,
  isOpenAIPosterJob,
};
