const crypto = require("crypto");
const { getDb, ensureIndexes, storageEnabled } = require("./mongo.cjs");
const { requestMeta } = require("./requestMeta.cjs");
const { purchaseEconomics } = require("./financeModel.cjs");
const { consumeAccountPreset, findAccountPreset } = require("./accountPresets.cjs");

const ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS || "eduardozola1998@gmail.com,eduardozola121998@gmail.com,eduardozola11998@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

function nowIso() {
  return new Date().toISOString();
}

function genReferralCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
}

function publicUser(doc) {
  if (!doc) return null;
  const email = String(doc.email || "").trim().toLowerCase();
  const isAdmin = doc.role === "admin" || ADMIN_EMAILS.has(email);
  return {
    id: doc.id,
    email: doc.email,
    name: doc.name,
    avatar_url: doc.avatar_url || null,
    role: doc.role || "user",
    lang: doc.lang || "en",
    credits: doc.credits ?? 0,
    is_unlimited: Boolean(doc.is_unlimited),
    referral_code: doc.referral_code || "",
    email_verified: Boolean(doc.email_verified),
    created_at: doc.created_at,
    banned: Boolean(doc.banned),
    signup_ip: doc.signup_ip || null,
    last_ip: doc.last_ip || null,
    signup_country: doc.signup_country || null,
    last_country: doc.last_country || null,
    pricing_region: doc.pricing_region || "intl",
    last_activity: doc.last_activity || null,
    nsfw_allowed: Boolean(doc.nsfw_allowed || isAdmin),
  };
}

async function logIpEvent(db, userId, meta, action) {
  if (!meta.ip) return;
  await db.collection("ip_events").insertOne({
    id: `ipe_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
    user_id: userId,
    ip: meta.ip,
    country: meta.country || null,
    action,
    created_at: meta.at || nowIso(),
  });
}

/**
 * Upsert Google OAuth user; returns merged public user from DB when Mongo is on.
 */
async function upsertGoogleUser(googleProfile, req, opts = {}) {
  if (!storageEnabled()) return null;
  await ensureIndexes();
  const db = await getDb();
  const meta = requestMeta(req);
  const email = String(googleProfile.email || "").trim().toLowerCase();
  const userId = `google_${googleProfile.sub}`;
  const isAdmin = ADMIN_EMAILS.has(email);
  const existing = await db.collection("users").findOne({ id: userId });

  const base = {
    id: userId,
    email,
    name: googleProfile.name || email.split("@")[0],
    avatar_url: googleProfile.picture || null,
    google_sub: googleProfile.sub,
    email_verified: Boolean(googleProfile.email_verified),
    role: isAdmin ? "admin" : "user",
    is_unlimited: isAdmin,
    last_activity: nowIso(),
    last_ip: meta.ip || existing?.last_ip || null,
    last_country: meta.country || existing?.last_country || null,
    pricing_region: opts.pricing_region || existing?.pricing_region || "intl",
  };

  if (!existing) {
    const preset = await findAccountPreset(db, email);
    const startCredits = isAdmin
      ? 999999999
      : (Number.isFinite(preset?.credits) ? preset.credits : 50);
    const startLang = preset?.lang || "en";
    const doc = {
      ...base,
      lang: startLang,
      credits: startCredits,
      referral_code: genReferralCode(),
      referred_by: null,
      banned: false,
      shadowbanned: false,
      nsfw_allowed: isAdmin,
      created_at: nowIso(),
      signup_ip: meta.ip || null,
      signup_country: meta.country || null,
      provider: "google",
    };
    await db.collection("users").insertOne(doc);
    const bonus = isAdmin ? 0 : startCredits;
    await db.collection("credit_transactions").insertOne({
      id: `tx_${Date.now().toString(36)}`,
      user_id: userId,
      amount: bonus,
      type: preset ? "admin" : "free",
      description: preset ? "Conta pré-configurada (admin)" : "Signup bonus (Google)",
      created_at: nowIso(),
    });
    if (preset) await consumeAccountPreset(db, email);
    await logIpEvent(db, userId, meta, "signup");
    return publicUser(doc);
  }

  await db.collection("users").updateOne(
    { id: userId },
    {
      $set: {
        ...base,
        name: base.name,
        avatar_url: base.avatar_url,
        role: isAdmin ? "admin" : existing.role,
        is_unlimited: isAdmin || existing.is_unlimited,
        ...(isAdmin ? { nsfw_allowed: true } : {}),
      },
    },
  );
  await logIpEvent(db, userId, meta, "login");
  const updated = await db.collection("users").findOne({ id: userId });
  return publicUser(updated);
}

async function touchUser(userId, req, extra = {}) {
  if (!storageEnabled() || !userId) return;
  const db = await getDb();
  const meta = requestMeta(req);
  const $set = { last_activity: nowIso(), ...extra };
  if (meta.ip) {
    $set.last_ip = meta.ip;
    $set.last_country = meta.country || null;
  }
  await db.collection("users").updateOne({ id: userId }, { $set });
  if (meta.ip) await logIpEvent(db, userId, meta, extra.action || "activity");
}

async function getUserById(userId) {
  if (!storageEnabled()) return null;
  const db = await getDb();
  const doc = await db.collection("users").findOne({ id: userId }, { projection: { _id: 0, password_hash: 0 } });
  return publicUser(doc);
}

async function getUserByEmail(email) {
  if (!storageEnabled()) return null;
  const db = await getDb();
  const normalized = String(email || "").trim().toLowerCase();
  const doc = await db.collection("users").findOne({ email: normalized }, { projection: { _id: 0, password_hash: 0 } });
  return publicUser(doc);
}

async function setUserAccountByEmail(email, { credits, lang }) {
  if (!storageEnabled()) return null;
  const db = await getDb();
  const normalized = String(email || "").trim().toLowerCase();
  const doc = await db.collection("users").findOne({ email: normalized });
  if (!doc) return { pending: true };
  const $set = {};
  if (lang) $set.lang = String(lang).slice(0, 2);
  if (Number.isFinite(credits) && credits >= 0) {
    $set.credits = Math.floor(credits);
    if ($set.credits > 0) $set.is_unlimited = false;
  }
  if (!Object.keys($set).length) return { user: publicUser(doc) };
  const before = { credits: doc.credits, lang: doc.lang };
  await db.collection("users").updateOne({ id: doc.id }, { $set });
  if (Number.isFinite(credits)) {
    await db.collection("credit_transactions").insertOne({
      id: `tx_admin_${Date.now().toString(36)}`,
      user_id: doc.id,
      amount: $set.credits - (before.credits ?? 0),
      type: "admin",
      description: `Admin set balance to ${$set.credits}`,
      metadata: { email: normalized, before: before.credits, after: $set.credits },
      created_at: nowIso(),
    });
  }
  const updated = await db.collection("users").findOne({ id: doc.id });
  return { user: publicUser(updated), before };
}

async function addCredits(userId, amount, type, description, metadata = {}) {
  if (!storageEnabled()) return null;
  const db = await getDb();
  const res = await db.collection("users").findOneAndUpdate(
    { id: userId },
    { $inc: { credits: amount } },
    { returnDocument: "after", projection: { _id: 0 } },
  );
  if (!res) return null;
  await db.collection("credit_transactions").insertOne({
    id: `tx_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
    user_id: userId,
    amount,
    type,
    description,
    metadata,
    created_at: nowIso(),
  });
  return res.credits;
}

async function recordPurchase({
  userId,
  sessionId,
  packageId,
  credits,
  amount,
  currency,
  pricingRegion,
  status = "completed",
}) {
  if (!storageEnabled() || !sessionId) return;
  const db = await getDb();
  const amountField = currency === "usd" ? "amount_usd" : "amount_eur";
  const econ = purchaseEconomics({ amount, currency, credits });
  const doc = {
    id: `pur_${Date.now().toString(36)}`,
    user_id: userId,
    package: packageId,
    credits,
    currency,
    pricing_region: pricingRegion || "intl",
    [amountField]: amount,
    stripe_session_id: sessionId,
    status,
    replicate_reserve_usd: econ.replicate_reserve_usd,
    stripe_fee: econ.stripe_fee,
    margin_usd: econ.margin_usd,
    revenue_usd: econ.revenue_usd,
    created_at: nowIso(),
  };
  try {
    await db.collection("purchases").insertOne(doc);
  } catch (e) {
    if (e?.code !== 11000) throw e;
  }
}

async function recordCreation(userId, creation) {
  if (!storageEnabled() || !userId) return;
  const db = await getDb();
  await db.collection("creations").insertOne({
    ...creation,
    user_id: userId,
    created_at: creation.created_at || nowIso(),
  });
}

module.exports = {
  ADMIN_EMAILS,
  storageEnabled,
  publicUser,
  upsertGoogleUser,
  touchUser,
  getUserById,
  getUserByEmail,
  setUserAccountByEmail,
  addCredits,
  recordPurchase,
  recordCreation,
};
