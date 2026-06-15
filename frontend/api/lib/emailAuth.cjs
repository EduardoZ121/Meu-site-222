const crypto = require("crypto");
const { getDb, ensureIndexes, storageEnabled } = require("./mongo.cjs");
const { requestMeta } = require("./requestMeta.cjs");
const { consumeAccountPreset, findAccountPreset } = require("./accountPresets.cjs");
const { hashPassword, verifyPassword, MIN_PASSWORD_LEN } = require("./authPassword.cjs");
const {
  STARTER_CREDITS,
  UNLIMITED_CREDITS,
  isAdminEmail,
  publicUser,
  repairUserAccountIfNeeded,
  genReferralCode,
} = require("./usersDb.cjs");

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function newUserId() {
  return `usr_${crypto.randomBytes(8).toString("hex")}`;
}

function mongoRequired() {
  const err = new Error("Registo por email requer base de dados (entra com Google ou contacta suporte).");
  err.status = 503;
  throw err;
}

async function findUserDocByEmail(email) {
  if (!storageEnabled()) return null;
  const db = await getDb();
  return db.collection("users").findOne({ email: normalizeEmail(email) });
}

/** GET /auth/check-email — existe conta? qual provider? */
async function checkEmailRegistration(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { exists: false, provider: null, can_register: false };
  }
  if (!storageEnabled()) {
    return { exists: false, provider: null, can_register: true, offline: true };
  }
  const doc = await findUserDocByEmail(normalized);
  if (!doc) {
    return { exists: false, provider: null, can_register: true };
  }
  const isGoogle = String(doc.id || "").startsWith("google_") || doc.provider === "google";
  const hasPassword = Boolean(doc.password_hash);
  if (isGoogle && !hasPassword) {
    return { exists: true, provider: "google", can_register: false };
  }
  if (hasPassword) {
    return { exists: true, provider: "email", can_register: false };
  }
  return { exists: true, provider: isGoogle ? "google" : "email", can_register: false };
}

async function registerEmailUser(payload, req) {
  if (!storageEnabled()) mongoRequired();
  await ensureIndexes();
  const db = await getDb();
  const meta = requestMeta(req);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const name = String(payload.name || "").trim() || email.split("@")[0];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error("Email inválido.");
    err.status = 400;
    throw err;
  }
  if (password.length < MIN_PASSWORD_LEN) {
    const err = new Error(`Palavra-passe demasiado curta (mín. ${MIN_PASSWORD_LEN} caracteres).`);
    err.status = 400;
    throw err;
  }

  const existing = await findUserDocByEmail(email);
  if (existing) {
    const isGoogle = String(existing.id || "").startsWith("google_") || existing.provider === "google";
    const err = new Error(
      isGoogle && !existing.password_hash
        ? "Este email já está registado com Google. Entra com Google."
        : "Este email já está registado. Entra em vez de criar outra conta.",
    );
    err.status = 409;
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const isAdmin = isAdminEmail(email);
  const preset = await findAccountPreset(db, email);
  const startCredits = isAdmin
    ? UNLIMITED_CREDITS
    : (Number.isFinite(preset?.credits) ? preset.credits : STARTER_CREDITS);
  const userId = newUserId();
  const referralCode = genReferralCode();

  let referredBy = null;
  const refCode = String(payload.referral_code || "").trim().toUpperCase();
  if (refCode) {
    const ref = await db.collection("users").findOne({ referral_code: refCode });
    if (ref && ref.id !== userId) referredBy = ref.id;
  }

  const doc = {
    id: userId,
    email,
    name,
    avatar_url: null,
    password_hash: hashPassword(password),
    role: isAdmin ? "admin" : "user",
    is_unlimited: isAdmin,
    lang: preset?.lang || "pt",
    credits: startCredits,
    referral_code: referralCode,
    referred_by: referredBy,
    banned: false,
    shadowbanned: false,
    nsfw_allowed: isAdmin,
    email_verified: false,
    provider: "email",
    created_at: nowIso(),
    signup_ip: meta.ip || null,
    signup_country: meta.country || null,
    last_ip: meta.ip || null,
    last_country: meta.country || null,
    last_activity: nowIso(),
    pricing_region: payload.pricing_region || "intl",
  };

  await db.collection("users").insertOne(doc);
  if (!isAdmin && startCredits > 0) {
    await db.collection("credit_transactions").insertOne({
      id: `tx_${Date.now().toString(36)}`,
      user_id: userId,
      amount: startCredits,
      type: preset ? "admin" : "free",
      description: preset ? "Conta pré-configurada (admin)" : "Bónus de registo",
      created_at: nowIso(),
    });
  }
  if (preset) await consumeAccountPreset(db, email);

  await db.collection("ip_events").insertOne({
    id: `ipe_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
    user_id: userId,
    ip: meta.ip || null,
    country: meta.country || null,
    action: "signup",
    created_at: meta.at || nowIso(),
  });

  return publicUser(doc);
}

async function loginEmailUser(payload, req) {
  if (!storageEnabled()) mongoRequired();
  const db = await getDb();
  const meta = requestMeta(req);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");

  if (!email || password.length < MIN_PASSWORD_LEN) {
    const err = new Error("Email ou palavra-passe inválidos.");
    err.status = 401;
    throw err;
  }

  const doc = await findUserDocByEmail(email);
  if (!doc) {
    const err = new Error("Conta não encontrada. Cria conta primeiro.");
    err.status = 401;
    err.code = "NOT_FOUND";
    throw err;
  }
  if (doc.banned) {
    const err = new Error("Conta suspensa.");
    err.status = 403;
    throw err;
  }
  if (!doc.password_hash) {
    const isGoogle = String(doc.id || "").startsWith("google_") || doc.provider === "google";
    const err = new Error(
      isGoogle
        ? "Este email usa Google. Entra com o botão Google."
        : "Esta conta não tem palavra-passe. Usa Google ou recupera a palavra-passe.",
    );
    err.status = 401;
    err.code = "USE_GOOGLE";
    throw err;
  }
  if (!verifyPassword(password, doc.password_hash)) {
    const err = new Error("Email ou palavra-passe incorretos.");
    err.status = 401;
    throw err;
  }

  await db.collection("users").updateOne(
    { id: doc.id },
    {
      $set: {
        last_activity: nowIso(),
        ...(meta.ip ? { last_ip: meta.ip, last_country: meta.country || null } : {}),
      },
    },
  );

  if (meta.ip) {
    await db.collection("ip_events").insertOne({
      id: `ipe_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
      user_id: doc.id,
      ip: meta.ip,
      country: meta.country || null,
      action: "login",
      created_at: meta.at || nowIso(),
    });
  }

  await repairUserAccountIfNeeded(doc.id);
  const updated = await db.collection("users").findOne({ id: doc.id }, { projection: { _id: 0 } });
  return publicUser(updated);
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true };
  const from = String(process.env.REPORT_FROM_EMAIL || "Remake Pixel <noreply@remakepix.com>").trim();
  const subject = "Recuperar palavra-passe — Remake Pixel";
  const html = [
    "<p>Recebeste este email porque pediste recuperação de palavra-passe no Remake Pixel.</p>",
    `<p><a href="${resetUrl}">Definir nova palavra-passe</a></p>`,
    "<p>O link expira em 1 hora. Se não pediste isto, ignora este email.</p>",
  ].join("");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, text: `Recuperar palavra-passe: ${resetUrl}` }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, error: data.message || data.error || `Resend ${r.status}` };
  return { ok: true, id: data.id };
}

/** POST /auth/forgot-password — token + email Resend (se configurado). */
async function requestPasswordReset(payload, req) {
  const email = normalizeEmail(payload.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error("Email inválido.");
    err.status = 400;
    throw err;
  }
  if (!storageEnabled()) mongoRequired();

  const db = await getDb();
  const doc = await findUserDocByEmail(email);
  if (!doc) {
    return { ok: true, message: "generic" };
  }
  if (!doc.password_hash) {
    const isGoogle = String(doc.id || "").startsWith("google_") || doc.provider === "google";
    if (isGoogle) {
      const err = new Error("Este email usa Google. Entra com o botão Google.");
      err.status = 400;
      err.code = "USE_GOOGLE";
      throw err;
    }
    return { ok: true, message: "generic" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await db.collection("password_resets").deleteMany({ user_id: doc.id });
  await db.collection("password_resets").insertOne({
    token,
    user_id: doc.id,
    email,
    expires_at: expiresAt,
    created_at: nowIso(),
  });

  const origin = String(payload.origin || req?.headers?.origin || "https://www.remakepix.com").replace(/\/$/, "");
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
  const mailed = await sendPasswordResetEmail({ to: email, resetUrl });

  return {
    ok: true,
    message: mailed.ok ? "email_sent" : "generic",
    email_sent: !!mailed.ok,
  };
}

/** POST /auth/reset-password */
async function resetPasswordWithToken(payload) {
  const token = String(payload.token || "").trim();
  const password = String(payload.password || "");
  if (!token) {
    const err = new Error("Link de recuperação inválido ou expirado.");
    err.status = 400;
    throw err;
  }
  if (password.length < MIN_PASSWORD_LEN) {
    const err = new Error(`Palavra-passe demasiado curta (mín. ${MIN_PASSWORD_LEN} caracteres).`);
    err.status = 400;
    throw err;
  }
  if (!storageEnabled()) mongoRequired();

  const db = await getDb();
  const row = await db.collection("password_resets").findOne({ token });
  if (!row || !row.user_id) {
    const err = new Error("Link de recuperação inválido ou expirado.");
    err.status = 400;
    throw err;
  }
  if (row.expires_at && Date.now() > new Date(row.expires_at).getTime()) {
    await db.collection("password_resets").deleteOne({ token });
    const err = new Error("Link de recuperação expirado. Pede um novo.");
    err.status = 400;
    throw err;
  }

  await db.collection("users").updateOne(
    { id: row.user_id },
    { $set: { password_hash: hashPassword(password), updated_at: nowIso() } },
  );
  await db.collection("password_resets").deleteMany({ user_id: row.user_id });
  return { ok: true };
}

module.exports = {
  checkEmailRegistration,
  registerEmailUser,
  loginEmailUser,
  requestPasswordReset,
  resetPasswordWithToken,
};
