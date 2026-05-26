const crypto = require("crypto");
const { getDb, storageEnabled } = require("./mongo.cjs");

function nowIso() {
  return new Date().toISOString();
}

async function spendCredits(userId, amount, description) {
  if (!storageEnabled() || !userId) return null;
  const cost = Math.abs(Number(amount) || 0);
  if (cost <= 0) return null;
  const db = await getDb();
  const existing = await db.collection("users").findOne({ id: userId }, { projection: { credits: 1, is_unlimited: 1 } });
  if (existing?.is_unlimited) return existing.credits ?? 999999999;
  const res = await db.collection("users").findOneAndUpdate(
    { id: userId, credits: { $gte: cost }, is_unlimited: { $ne: true } },
    { $inc: { credits: -cost } },
    { returnDocument: "after", projection: { _id: 0, credits: 1, is_unlimited: 1 } },
  );
  if (!res) {
    const u = await db.collection("users").findOne({ id: userId }, { projection: { credits: 1, is_unlimited: 1 } });
    if (u?.is_unlimited) return u.credits ?? 999999999;
    const err = new Error("Créditos insuficientes.");
    err.status = 402;
    err.detail = "Insufficient credits";
    throw err;
  }
  await db.collection("credit_transactions").insertOne({
    id: `tx_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
    user_id: userId,
    amount: -cost,
    type: "spend",
    description,
    created_at: nowIso(),
  });
  return res.credits;
}

module.exports = { spendCredits };
