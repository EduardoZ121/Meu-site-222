const { getDb, storageEnabled, kvEnabled } = require("./mongo.cjs");
const { computeAdminStats, computeIpGroups, computeFinance } = require("./statsCompute.cjs");
const { ADMIN_EMAILS, addCredits, publicUser, setUserAccountByEmail } = require("./usersDb.cjs");
const { upsertAccountPreset } = require("./accountPresets.cjs");
const { runDeployEventCredits } = require("./deployEventCredits.cjs");
const { aggregateFinance } = require("./financeModel.cjs");
// aggregateFinance used when MONGO_URL is set; KV uses computeFinance from statsCompute

function isAdminUser(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return ADMIN_EMAILS.has(String(user.email || "").toLowerCase());
}

function adminForbidden() {
  const err = new Error("Acesso admin negado.");
  err.status = 403;
  return err;
}

function mongoRequired() {
  const err = new Error("Base de dados não configurada (MONGO_URL ou Upstash KV).");
  err.status = 503;
  return err;
}

async function requireAdminFromToken(verifySessionToken, req) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) throw Object.assign(new Error("Não autenticado."), { status: 401 });
  const token = m[1].trim();
  if (token.startsWith("local:")) throw adminForbidden();
  const user = verifySessionToken(token);
  if (!user) throw Object.assign(new Error("Sessão inválida."), { status: 401 });
  if (!isAdminUser(user)) throw adminForbidden();
  return user;
}

async function adminStats() {
  if (!storageEnabled()) throw mongoRequired();
  const db = await getDb();
  if (kvEnabled()) return computeAdminStats(db);
  const users = await db.collection("users").countDocuments({});
  const creations = await db.collection("creations").countDocuments({});
  const purchases = await db.collection("purchases").countDocuments({ status: "completed" });

  const revEur = await db.collection("purchases").aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, total: { $sum: { $ifNull: ["$amount_eur", 0] } } } },
  ]).toArray();
  const revUsd = await db.collection("purchases").aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, total: { $sum: { $ifNull: ["$amount_usd", 0] } } } },
  ]).toArray();

  const cred = await db.collection("users").aggregate([
    { $group: { _id: null, total: { $sum: { $ifNull: ["$credits", 0] } } } },
  ]).toArray();

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const signups_today = await db.collection("users").countDocuments({
    created_at: { $gte: dayStart.toISOString() },
  });

  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const signups_week = await db.collection("users").countDocuments({ created_at: { $gte: weekStart } });

  const multiIp = await db.collection("users").aggregate([
    { $match: { signup_ip: { $exists: true, $nin: [null, ""] } } },
    { $group: { _id: "$signup_ip", count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } },
    { $count: "n" },
  ]).toArray();

  return {
    users,
    creations,
    purchases,
    revenue_eur: revEur[0]?.total || 0,
    revenue_usd: revUsd[0]?.total || 0,
    credits_in_circulation: cred[0]?.total || 0,
    signups_today,
    signups_week,
    risky_ips: multiIp[0]?.n || 0,
  };
}

async function adminUsers(limit = 50, search = null) {
  if (!storageEnabled()) throw mongoRequired();
  const db = await getDb();
  const q = {};
  if (search) {
    q.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }
  const docs = await db.collection("users")
    .find(q, { projection: { _id: 0, password_hash: 0 } })
    .sort({ created_at: -1 })
    .limit(Math.min(limit, 200))
    .toArray();
  return { users: docs };
}

async function adminTransactions(limit = 100) {
  if (!storageEnabled()) throw mongoRequired();
  const db = await getDb();
  const docs = await db.collection("credit_transactions")
    .find({}, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .limit(Math.min(limit, 300))
    .toArray();
  return { transactions: docs };
}

async function adminPurchases(limit = 50) {
  if (!storageEnabled()) throw mongoRequired();
  const db = await getDb();
  const docs = await db.collection("purchases")
    .find({}, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .limit(Math.min(limit, 200))
    .toArray();
  return { purchases: docs };
}

async function adminIpGroups(minAccounts = 2) {
  if (!storageEnabled()) throw mongoRequired();
  const db = await getDb();
  if (kvEnabled()) return computeIpGroups(db, minAccounts);
  const groups = await db.collection("users").aggregate([
    {
      $match: {
        $or: [
          { signup_ip: { $exists: true, $nin: [null, ""] } },
          { last_ip: { $exists: true, $nin: [null, ""] } },
        ],
      },
    },
    {
      $project: {
        ip: { $ifNull: ["$signup_ip", "$last_ip"] },
        id: 1,
        email: 1,
        name: 1,
        credits: 1,
        banned: 1,
        created_at: 1,
        signup_ip: 1,
        last_ip: 1,
      },
    },
    { $match: { ip: { $nin: [null, ""] } } },
    {
      $group: {
        _id: "$ip",
        count: { $sum: 1 },
        users: {
          $push: {
            id: "$id",
            email: "$email",
            name: "$name",
            credits: "$credits",
            banned: "$banned",
            created_at: "$created_at",
          },
        },
      },
    },
    { $match: { count: { $gte: minAccounts } } },
    { $sort: { count: -1 } },
    { $limit: 150 },
  ]).toArray();

  return {
    groups: groups.map((g) => ({
      ip: g._id,
      count: g.count,
      risk: g.count >= 2 ? "high" : "low",
      users: g.users,
    })),
  };
}

async function adminAdjustCredits(userId, amount, reason) {
  if (!storageEnabled()) throw mongoRequired();
  const balance = await addCredits(userId, amount, "admin", reason || "admin adjustment");
  if (balance == null) {
    const err = new Error("Utilizador não encontrado.");
    err.status = 404;
    throw err;
  }
  return { new_balance: balance };
}

async function getFinanceSettings(db) {
  const doc = await db.collection("platform_settings").findOne({ _id: "finance" });
  return doc || {};
}

async function adminFinance() {
  if (!storageEnabled()) throw mongoRequired();
  const db = await getDb();
  const settings = await getFinanceSettings(db);
  const balance = Number(settings.replicate_balance_usd);
  const finance = kvEnabled()
    ? await computeFinance(db, {
      replicate_balance_usd: Number.isFinite(balance) ? balance : undefined,
    })
    : await aggregateFinance(db, {
      replicate_balance_usd: Number.isFinite(balance) ? balance : undefined,
    });
  const recent = await db.collection("purchases")
    .find({ status: "completed" }, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .limit(25)
    .toArray();
  return { ...finance, recent_purchases: recent, settings: { replicate_balance_usd: settings.replicate_balance_usd ?? null } };
}

async function adminPatchFinance(body) {
  if (!storageEnabled()) throw mongoRequired();
  const db = await getDb();
  const bal = Number(body.replicate_balance_usd);
  if (!Number.isFinite(bal) || bal < 0) {
    const err = new Error("replicate_balance_usd inválido.");
    err.status = 400;
    throw err;
  }
  await db.collection("platform_settings").updateOne(
    { _id: "finance" },
    { $set: { replicate_balance_usd: bal, updated_at: new Date().toISOString() } },
    { upsert: true },
  );
  return adminFinance();
}

async function adminPatchUser(userId, patch) {
  if (!storageEnabled()) throw mongoRequired();
  const db = await getDb();
  const update = {};
  if (patch.banned != null) update.banned = Boolean(patch.banned);
  if (patch.role != null) update.role = patch.role;
  if (patch.nsfw_allowed != null) update.nsfw_allowed = Boolean(patch.nsfw_allowed);
  if (patch.lang != null) update.lang = String(patch.lang).slice(0, 2);
  if (patch.credits != null && Number.isFinite(Number(patch.credits))) {
    update.credits = Math.max(0, Math.floor(Number(patch.credits)));
  }
  if (!Object.keys(update).length) return { ok: true };
  const res = await db.collection("users").updateOne({ id: userId }, { $set: update });
  if (!res.matchedCount) {
    const err = new Error("Utilizador não encontrado.");
    err.status = 404;
    throw err;
  }
  const doc = await db.collection("users").findOne({ id: userId }, { projection: { _id: 0, password_hash: 0 } });
  return { user: publicUser(doc) };
}

async function handleAdminRoute(path, req, res, { verifySessionToken, json, readJsonRequestBody }) {
  try {
    await requireAdminFromToken(verifySessionToken, req);
  } catch (e) {
    return json(res, e.status || 500, { detail: e.message });
  }

  try {
    if (req.method === "GET" && path === "admin/stats") {
      return json(res, 200, await adminStats());
    }
    if (req.method === "GET" && path === "admin/users") {
      const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
      const limit = Number(url.searchParams.get("limit") || 50);
      const search = url.searchParams.get("search") || null;
      return json(res, 200, await adminUsers(limit, search));
    }
    if (req.method === "GET" && path === "admin/transactions") {
      const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
      const limit = Number(url.searchParams.get("limit") || 100);
      return json(res, 200, await adminTransactions(limit));
    }
    if (req.method === "GET" && path === "admin/purchases") {
      const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
      const limit = Number(url.searchParams.get("limit") || 50);
      return json(res, 200, await adminPurchases(limit));
    }
    if (req.method === "GET" && path === "admin/ip-groups") {
      return json(res, 200, await adminIpGroups(2));
    }
    if (req.method === "GET" && path === "admin/finance") {
      return json(res, 200, await adminFinance());
    }

    const body = ["POST", "PATCH", "PUT"].includes(req.method)
      ? await readJsonRequestBody(req)
      : {};

    if (req.method === "POST" && path === "admin/credits/adjust") {
      const out = await adminAdjustCredits(body.user_id, Number(body.amount), body.reason);
      return json(res, 200, out);
    }
    if (req.method === "POST" && path === "admin/account/setup") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!email) return json(res, 400, { detail: "Email em falta." });
      const credits = body.credits != null ? Number(body.credits) : null;
      const lang = body.lang ? String(body.lang).slice(0, 2) : "en";
      const applied = await setUserAccountByEmail(email, { credits, lang });
      if (applied?.user) {
        return json(res, 200, { ok: true, user: applied.user, applied: "existing_user" });
      }
      const db = await getDb();
      await upsertAccountPreset(db, email, {
        credits: Number.isFinite(credits) ? credits : 800,
        lang,
        note: body.reason || "admin account setup",
      });
      return json(res, 200, {
        ok: true,
        pending: true,
        email,
        credits: Number.isFinite(credits) ? credits : 800,
        lang,
        message: "Conta ainda não existe — créditos e idioma aplicam-se no primeiro login Google com este email.",
      });
    }
    if (req.method === "POST" && path === "admin/deploy-event-credits") {
      const prev = process.env.DEPLOY_EVENT_CREDITS_ENABLED;
      if (!prev) process.env.DEPLOY_EVENT_CREDITS_ENABLED = "1";
      const out = await runDeployEventCredits({
        deploymentId: body.deployment_id || `admin_${Date.now()}`,
      });
      if (!prev) delete process.env.DEPLOY_EVENT_CREDITS_ENABLED;
      return json(res, 200, out);
    }
    if (req.method === "PATCH" && path === "admin/finance") {
      return json(res, 200, await adminPatchFinance(body));
    }

    const patchMatch = path.match(/^admin\/users\/([^/]+)$/);
    if (req.method === "PATCH" && patchMatch) {
      const out = await adminPatchUser(patchMatch[1], body);
      return json(res, 200, out);
    }

    return json(res, 404, { detail: "Endpoint admin não encontrado." });
  } catch (e) {
    return json(res, e.status || 500, { detail: e.message || "Erro admin." });
  }
}

module.exports = { handleAdminRoute, isAdminUser, adminStats, adminIpGroups, adminFinance };
