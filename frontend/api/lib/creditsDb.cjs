const crypto = require("crypto");
const { getDb, storageEnabled } = require("./mongo.cjs");

function nowIso() {
  return new Date().toISOString();
}

const { isAdminEmail, UNLIMITED_CREDITS } = require("./usersDb.cjs");

async function recordSpendTransaction(userId, cost, description, extra = {}) {
  const db = await getDb();
  await db.collection("credit_transactions").insertOne({
    id: `tx_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
    user_id: userId,
    amount: -cost,
    type: "spend",
    description,
    ...extra,
    created_at: nowIso(),
  });
  try {
    const { trackReplicateSpend } = require("./replicateAutoReserve.cjs");
    await trackReplicateSpend(cost);
  } catch {
    /* non-blocking */
  }
}

async function spendCredits(userId, amount, description, opts = {}) {
  if (!storageEnabled() || !userId) return null;
  const cost = Math.abs(Number(amount) || 0);
  if (cost <= 0) return null;
  const forceBill = Boolean(opts.forceBill);
  const db = await getDb();
  const existing = await db.collection("users").findOne(
    { id: userId },
    { projection: { credits: 1, is_unlimited: 1, email: 1 } },
  );
  if (isAdminEmail(existing?.email) && !forceBill) {
    return existing?.credits ?? UNLIMITED_CREDITS;
  }
  if (isAdminEmail(existing?.email) && forceBill) {
    await recordSpendTransaction(userId, cost, description, { admin_force_bill: true });
    return existing?.credits ?? UNLIMITED_CREDITS;
  }
  const res = await db.collection("users").findOneAndUpdate(
    { id: userId, credits: { $gte: cost }, is_unlimited: { $ne: true } },
    { $inc: { credits: -cost } },
    { returnDocument: "after", projection: { _id: 0, credits: 1, is_unlimited: 1 } },
  );
  if (!res) {
    const u = await db.collection("users").findOne(
      { id: userId },
      { projection: { credits: 1, is_unlimited: 1, email: 1 } },
    );
    if (isAdminEmail(u?.email)) return u?.credits ?? UNLIMITED_CREDITS;
    const err = new Error("Créditos insuficientes.");
    err.status = 402;
    err.detail = "Insufficient credits";
    throw err;
  }
  await recordSpendTransaction(userId, cost, description);
  return res.credits;
}

module.exports = { spendCredits };
