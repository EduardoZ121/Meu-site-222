const crypto = require("crypto");
const { getDb, storageEnabled } = require("./mongo.cjs");

function nowIso() {
  return new Date().toISOString();
}

const { isAdminEmail, UNLIMITED_CREDITS } = require("./usersDb.cjs");
const {
  subscriptionCredits,
  spendableStandardCredits,
} = require("./creatorSubscription.cjs");

async function recordSpendTransaction(userId, cost, description, extra = {}) {
  const db = await getDb();
  await db.collection("credit_transactions").insertOne({
    id: `tx_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
    user_id: userId,
    amount: -cost,
    type: "spend",
    description,
    wallet: extra.wallet || "standard",
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
    {
      projection: {
        _id: 0,
        credits: 1,
        subscription_credits: 1,
        subscription_status: 1,
        subscription_period_end: 1,
        is_unlimited: 1,
        email: 1,
      },
    },
  );
  if (isAdminEmail(existing?.email) && !forceBill) {
    return existing?.credits ?? UNLIMITED_CREDITS;
  }
  if (isAdminEmail(existing?.email) && forceBill) {
    await recordSpendTransaction(userId, cost, description, { admin_force_bill: true });
    return existing?.credits ?? UNLIMITED_CREDITS;
  }

  const total = spendableStandardCredits(existing);
  if (total < cost) {
    const err = new Error("Créditos insuficientes.");
    err.status = 402;
    err.detail = "Insufficient credits";
    throw err;
  }

  const subPool = subscriptionCredits(existing);
  const fromSub = Math.min(subPool, cost);
  const fromPurchased = cost - fromSub;

  if (fromSub > 0) {
    await db.collection("users").updateOne(
      { id: userId },
      { $inc: { subscription_credits: -fromSub } },
    );
    await recordSpendTransaction(userId, fromSub, description, { wallet: "subscription" });
  }
  if (fromPurchased > 0) {
    const res = await db.collection("users").findOneAndUpdate(
      { id: userId, credits: { $gte: fromPurchased }, is_unlimited: { $ne: true } },
      { $inc: { credits: -fromPurchased } },
      { returnDocument: "after", projection: { _id: 0, credits: 1, subscription_credits: 1 } },
    );
    if (!res) {
      const err = new Error("Créditos insuficientes.");
      err.status = 402;
      throw err;
    }
    await recordSpendTransaction(userId, fromPurchased, description, { wallet: "standard" });
  }

  const fresh = await db.collection("users").findOne(
    { id: userId },
    {
      projection: {
        _id: 0,
        credits: 1,
        subscription_credits: 1,
        subscription_status: 1,
        subscription_period_end: 1,
      },
    },
  );
  return spendableStandardCredits(fresh);
}

async function spendPremiumCredits(userId, amount, description, opts = {}) {
  if (!storageEnabled() || !userId) return null;
  const cost = Math.abs(Number(amount) || 0);
  if (cost <= 0) return null;
  const forceBill = Boolean(opts.forceBill);
  const db = await getDb();
  const existing = await db.collection("users").findOne(
    { id: userId },
    { projection: { premium_credits: 1, is_unlimited: 1, email: 1 } },
  );
  if (isAdminEmail(existing?.email) && !forceBill) {
    return existing?.premium_credits ?? UNLIMITED_CREDITS;
  }
  if (isAdminEmail(existing?.email) && forceBill) {
    await recordSpendTransaction(userId, cost, description, { admin_force_bill: true, wallet: "premium" });
    return existing?.premium_credits ?? UNLIMITED_CREDITS;
  }
  const res = await db.collection("users").findOneAndUpdate(
    { id: userId, premium_credits: { $gte: cost }, is_unlimited: { $ne: true } },
    { $inc: { premium_credits: -cost } },
    { returnDocument: "after", projection: { _id: 0, premium_credits: 1, is_unlimited: 1 } },
  );
  if (!res) {
    const u = await db.collection("users").findOne(
      { id: userId },
      { projection: { premium_credits: 1, is_unlimited: 1, email: 1 } },
    );
    if (isAdminEmail(u?.email)) return u?.premium_credits ?? UNLIMITED_CREDITS;
    const err = new Error("Créditos HQ insuficientes.");
    err.status = 402;
    err.detail = "Insufficient premium credits";
    throw err;
  }
  await recordSpendTransaction(userId, cost, description, { wallet: "premium" });
  return res.premium_credits ?? 0;
}

module.exports = { spendCredits, spendPremiumCredits, spendableStandardCredits };
