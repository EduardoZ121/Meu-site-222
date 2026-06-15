const crypto = require("crypto");
const { getDb, ensureIndexes, storageEnabled } = require("./mongo.cjs");
const { requestMeta } = require("./requestMeta.cjs");
const { purchaseEconomics } = require("./financeModel.cjs");
const { consumeAccountPreset, findAccountPreset } = require("./accountPresets.cjs");
const { isStudioPremiumActive } = require("./studioPremium.cjs");

const ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS || "eduardozola1998@gmail.com,eduardozola121998@gmail.com,eduardozola11998@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

const STARTER_CREDITS = 0;
const UNLIMITED_CREDITS = 999999999;
const ABUSE_CREDITS_THRESHOLD = 500_000;

function nowIso() {
  return new Date().toISOString();
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.has(String(email || "").trim().toLowerCase());
}

function abuseCredits(credits) {
  return Number(credits) >= ABUSE_CREDITS_THRESHOLD;
}

/** Só emails admin têm créditos ilimitados; restantes começam/ ficam com saldo finito. */
function resolveAccountAccess(doc) {
  const email = String(doc?.email || "").trim().toLowerCase();
  if (isAdminEmail(email)) {
    return { role: "admin", is_unlimited: true, credits: UNLIMITED_CREDITS };
  }
  let credits = Number(doc?.credits);
  if (!Number.isFinite(credits) || credits < 0) credits = 0;
  if (doc?.is_unlimited || abuseCredits(credits)) credits = 0;
  return { role: "user", is_unlimited: false, credits };
}

function accountNeedsRepair(doc) {
  if (!doc) return false;
  const access = resolveAccountAccess(doc);
  return doc.role !== access.role
    || Boolean(doc.is_unlimited) !== access.is_unlimited
    || Number(doc.credits) !== access.credits;
}

function genReferralCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
}

function publicUser(doc) {
  if (!doc) return null;
  const email = String(doc.email || "").trim().toLowerCase();
  const access = resolveAccountAccess(doc);
  const isAdmin = access.is_unlimited;
  return {
    id: doc.id,
    email: doc.email,
    name: doc.name,
    avatar_url: doc.avatar_url || null,
    role: access.role,
    lang: doc.lang || "en",
    credits: access.credits,
    is_unlimited: access.is_unlimited,
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
    studio_premium_until: doc.studio_premium_until || null,
    studio_premium: isStudioPremiumActive(doc) || isAdmin,
    email_notify_generations: Boolean(doc.email_notify_generations),
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
  const isAdmin = isAdminEmail(email);
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
      ? UNLIMITED_CREDITS
      : (Number.isFinite(preset?.credits) ? preset.credits : STARTER_CREDITS);
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
    if (bonus > 0) {
      await db.collection("credit_transactions").insertOne({
        id: `tx_${Date.now().toString(36)}`,
        user_id: userId,
        amount: bonus,
        type: preset ? "admin" : "free",
        description: preset ? "Conta pré-configurada (admin)" : "Signup bonus (Google)",
        created_at: nowIso(),
      });
    }
    if (preset) await consumeAccountPreset(db, email);
    await logIpEvent(db, userId, meta, "signup");
    return publicUser(doc);
  }

  const access = resolveAccountAccess(existing);
  const $set = {
    ...base,
    name: base.name,
    avatar_url: base.avatar_url,
    role: access.role,
    is_unlimited: access.is_unlimited,
    credits: access.credits,
    ...(isAdmin ? { nsfw_allowed: true } : {}),
  };
  await db.collection("users").updateOne({ id: userId }, { $set });
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

async function repairUserAccountIfNeeded(userId) {
  if (!storageEnabled() || !userId) return null;
  const db = await getDb();
  const doc = await db.collection("users").findOne({ id: userId }, { projection: { _id: 0, password_hash: 0 } });
  if (!doc || !accountNeedsRepair(doc)) return publicUser(doc);
  const access = resolveAccountAccess(doc);
  await db.collection("users").updateOne(
    { id: userId },
    { $set: { role: access.role, is_unlimited: access.is_unlimited, credits: access.credits } },
  );
  const updated = await db.collection("users").findOne({ id: userId }, { projection: { _id: 0, password_hash: 0 } });
  return publicUser(updated);
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

async function findPurchaseBySessionId(sessionId) {
  if (!storageEnabled() || !sessionId) return null;
  const db = await getDb();
  return db.collection("purchases").findOne(
    { stripe_session_id: sessionId },
    { projection: { _id: 0 } },
  );
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
  if (!storageEnabled() || !sessionId) return false;
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
    return true;
  } catch (e) {
    if (e?.code === 11000) return false;
    throw e;
  }
}

/** Credita uma sessão Stripe paga uma única vez (idempotente por stripe_session_id). */
async function fulfillStripeCheckoutSession({
  userId,
  sessionId,
  packageId,
  credits,
  amount,
  currency,
  pricingRegion,
}) {
  if (!storageEnabled() || !userId || !sessionId || !credits) return null;
  const existing = await findPurchaseBySessionId(sessionId);
  if (existing) {
    if (existing.user_id && existing.user_id !== userId) {
      const err = new Error("Esta compra já foi associada a outra conta.");
      err.status = 403;
      throw err;
    }
    const u = await getUserById(userId);
    return { new_balance: u?.credits ?? null, already_claimed: true, credits };
  }
  const inserted = await recordPurchase({
    userId,
    sessionId,
    packageId,
    credits,
    amount,
    currency,
    pricingRegion,
  });
  if (!inserted) {
    const again = await findPurchaseBySessionId(sessionId);
    if (again?.user_id && again.user_id !== userId) {
      const err = new Error("Esta compra já foi associada a outra conta.");
      err.status = 403;
      throw err;
    }
    const u = await getUserById(userId);
    return { new_balance: u?.credits ?? null, already_claimed: true, credits };
  }
  const balance = await addCredits(
    userId,
    credits,
    "purchase",
    `Stripe purchase (${packageId || "package"})`,
    { stripe_session_id: sessionId },
  );
  try {
    const { scheduleCreditPurchaseSync } = require("./replicateAutoReserve.cjs");
    scheduleCreditPurchaseSync({
      sessionId,
      userId,
      credits,
      amount,
      currency,
      packageId,
      pricingRegion,
    });
  } catch {
    /* non-blocking */
  }
  return { new_balance: balance, already_claimed: false, credits };
}

async function recordCreation(userId, creation) {
  if (!storageEnabled() || !userId || !creation?.id) return;
  const db = await getDb();
  const urls = Array.isArray(creation.result_urls)
    ? creation.result_urls.filter((u) => typeof u === "string" && u.trim())
    : [];
  const setFields = {};
  if (urls.length) setFields.result_urls = urls;
  if (creation.prompt) setFields.prompt = creation.prompt;
  if (creation.model_used) setFields.model_used = creation.model_used;
  if (creation.aspect_ratio) setFields.aspect_ratio = creation.aspect_ratio;
  if (creation.type) setFields.type = creation.type;
  if (creation.credits_spent != null) setFields.credits_spent = creation.credits_spent;
  if (creation.created_at) setFields.created_at = creation.created_at;

  const update = {
    $setOnInsert: {
      id: creation.id,
      user_id: userId,
      is_favorite: creation.is_favorite ?? false,
      is_public: creation.is_public ?? false,
      created_at: creation.created_at || nowIso(),
      server_billing: creation.server_billing ?? true,
    },
  };
  if (Object.keys(setFields).length) update.$set = setFields;

  await db.collection("creations").updateOne(
    { id: creation.id, user_id: userId },
    update,
    { upsert: true },
  );
}

module.exports = {
  ADMIN_EMAILS,
  STARTER_CREDITS,
  UNLIMITED_CREDITS,
  isAdminEmail,
  resolveAccountAccess,
  genReferralCode,
  storageEnabled,
  publicUser,
  upsertGoogleUser,
  touchUser,
  repairUserAccountIfNeeded,
  getUserById,
  getUserByEmail,
  setUserAccountByEmail,
  addCredits,
  recordPurchase,
  findPurchaseBySessionId,
  fulfillStripeCheckoutSession,
  recordCreation,
};
