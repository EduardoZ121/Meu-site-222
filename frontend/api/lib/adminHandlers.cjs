const { getDb, storageEnabled, kvEnabled } = require("./mongo.cjs");
const { computeAdminStats, computeIpGroups, computeFinance } = require("./statsCompute.cjs");
const { ADMIN_EMAILS, addCredits, publicUser, setUserAccountByEmail } = require("./usersDb.cjs");
const { isSubscriptionActive } = require("./creatorSubscription.cjs");
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

  const subDocs = await db.collection("users").find(
    { subscription_status: { $in: ["active", "trialing"] } },
    { projection: { subscription_status: 1, subscription_period_end: 1, email: 1 } },
  ).toArray();

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
    subscribers_active: subDocs.filter(isSubscriptionActive).length,
  };
}

async function adminUsers(limit = 50, search = null, subscriptionFilter = null) {
  if (!storageEnabled()) throw mongoRequired();
  const db = await getDb();
  const q = {};
  if (search) {
    q.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }
  const fetchLimit = subscriptionFilter && subscriptionFilter !== "all"
    ? Math.min(Math.max(limit, 50), 500)
    : Math.min(limit, 200);
  const docs = await db.collection("users")
    .find(q, { projection: { _id: 0, password_hash: 0 } })
    .sort({ created_at: -1 })
    .limit(fetchLimit)
    .toArray();
  let users = docs.map((d) => publicUser(d)).filter(Boolean);
  if (subscriptionFilter === "active") {
    users = users.filter((u) => u.subscription?.active);
  } else if (subscriptionFilter === "inactive") {
    users = users.filter((u) => !u.subscription?.active);
  }
  if (subscriptionFilter && subscriptionFilter !== "all") {
    users = users.slice(0, Math.min(limit, 200));
  }
  return { users };
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
  const uid = String(userId || "").trim();
  if (!uid) {
    const err = new Error("Utilizador em falta.");
    err.status = 400;
    throw err;
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount === 0) {
    const err = new Error("Montante inválido (use positivo ou negativo).");
    err.status = 400;
    throw err;
  }
  const db = await getDb();
  const before = await db.collection("users").findOne({ id: uid }, { projection: { _id: 0, email: 1, lang: 1 } });
  const balance = await addCredits(uid, numericAmount, "admin", reason || "admin adjustment");
  if (balance == null) {
    const err = new Error("Utilizador não encontrado.");
    err.status = 404;
    throw err;
  }
  let emailSent = false;
  if (numericAmount > 0 && before?.email) {
    const { sendCreditsGrantedEmail } = require("./creditsNotifyEmail.cjs");
    try {
      const mailed = await sendCreditsGrantedEmail({
        to: before.email,
        lang: before.lang || "pt",
        amount: numericAmount,
        balance,
        reason: reason || "Créditos oferecidos pela equipa Remake Pixel",
      });
      emailSent = Boolean(mailed?.ok);
    } catch (err) {
      console.error("[admin] credits grant email failed", uid, err?.message);
    }
  }
  return { new_balance: balance, email_sent: emailSent };
}

const { buildFinanceDashboard } = require("./adminFinanceDashboard.cjs");

async function getFinanceSettings(db) {
  const doc = await db.collection("platform_settings").findOne({ _id: "finance" });
  return doc || {};
}

async function adminFinance() {
  if (!storageEnabled()) throw mongoRequired();
  const db = await getDb();
  const settings = await getFinanceSettings(db);
  const balance = Number(settings.replicate_balance_tracked_usd ?? settings.replicate_balance_usd);
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
  const { getReplicateSyncStatus } = require("./replicateAutoReserve.cjs");
  const replicate_sync = await getReplicateSyncStatus(db);
  return {
    ...finance,
    recent_purchases: recent,
    settings: {
      replicate_balance_usd: settings.replicate_balance_usd ?? null,
      replicate_balance_tracked_usd: settings.replicate_balance_tracked_usd ?? null,
    },
    replicate_sync,
    dashboard: buildFinanceDashboard(),
  };
}

async function adminGetEngine() {
  const { getAiEngineSettings } = require("./aiEngineSettings.cjs");
  return getAiEngineSettings();
}

async function adminPatchEngine(body, adminEmail) {
  const { setAiEngine, getAiEngineSettings, VALID_ENGINES } = require("./aiEngineSettings.cjs");
  const engine = String(body.engine || "").trim().toLowerCase();
  if (!VALID_ENGINES.has(engine)) {
    const err = new Error("engine inválido (replicate ou runpod).");
    err.status = 400;
    throw err;
  }
  if (engine === "runpod") {
    const { runpod } = require("./providers/index.cjs");
    if (!runpod.isConfigured()) {
      const err = new Error("RunPod não configurado. Define RUNPOD_API_KEY e RUNPOD_ENDPOINT_ID na Vercel.");
      err.status = 400;
      throw err;
    }
    try {
      await runpod.prepareForGeneration();
    } catch {
      /* endpoint may already be active */
    }
  }
  await setAiEngine(engine, { updatedBy: adminEmail || null });
  return getAiEngineSettings();
}

async function adminEngineHealth() {
  const { runpod } = require("./providers/index.cjs");
  const { getAiEngine } = require("./aiEngineSettings.cjs");
  const [engine, runpodHealth] = await Promise.all([
    getAiEngine(),
    runpod.checkHealth(),
  ]);
  return {
    engine,
    runpod: runpodHealth,
    replicate: { configured: require("./providers/replicateProvider.cjs").isConfigured() },
  };
}

async function adminRunpodPause() {
  const { runpod } = require("./providers/index.cjs");
  if (!runpod.isConfigured()) {
    const err = new Error("RunPod não configurado.");
    err.status = 400;
    throw err;
  }
  await runpod.pauseEndpoint();
  return adminEngineHealth();
}

async function adminRunpodResume() {
  const { runpod } = require("./providers/index.cjs");
  if (!runpod.isConfigured()) {
    const err = new Error("RunPod não configurado.");
    err.status = 400;
    throw err;
  }
  await runpod.prepareForGeneration();
  return adminEngineHealth();
}

async function adminRunpodPurgeQueue() {
  const { runpod } = require("./providers/index.cjs");
  if (!runpod.isConfigured()) {
    const err = new Error("RunPod não configurado.");
    err.status = 400;
    throw err;
  }
  const purged = await runpod.purgeQueue();
  const health = await adminEngineHealth();
  return { ...health, purged };
}

/* ===================== AI Lab (admin playground) ===================== */

async function adminLabCatalog() {
  const { getCatalog } = require("./aiLab/catalog.cjs");
  const comfy = require("./providers/comfyUiProvider.cjs");
  const health = await comfy.checkHealth().catch(() => null);
  let liveAssets = null;
  if (health?.ok) {
    liveAssets = await comfy.listInstalledModels().catch(() => null);
  }
  return {
    ...getCatalog(liveAssets),
    comfy_configured: comfy.isConfigured(),
    comfy_health: health,
    pod_models: liveAssets,
  };
}

async function adminLabRepair() {
  const comfy = require("./providers/comfyUiProvider.cjs");
  if (!comfy.isConfigured()) {
    const err = new Error("ComfyUI não configurado (COMFYUI_BASE_URL).");
    err.status = 400;
    throw err;
  }
  const health = await comfy.checkHealth();
  return { ok: health.ok === true, provider: "vast", comfy: health };
}

async function adminLabGenerate(body) {
  const { submitLabGeneration } = require("./aiLab/labGenerate.cjs");
  const out = await submitLabGeneration({
    modelId: body.model_id,
    workflowId: body.workflow_id,
    prompt: body.prompt,
    negativePrompt: body.negative_prompt,
    params: body.params || {},
    imageDataUrl: body.image || null,
  });
  return { ...out, started_at: Date.now() };
}

async function adminLabPoll(body) {
  const { getLabJobStatus } = require("./aiLab/labGenerate.cjs");
  const jobId = String(body.job_id || "").trim();
  if (!jobId) {
    const err = new Error("job_id em falta.");
    err.status = 400;
    throw err;
  }
  const info = await getLabJobStatus(jobId);
  if (info.status === "processing" || info.status === "starting") {
    return {
      status: "processing",
      raw_status: info.raw_status || null,
      queue_position: info.queue_position ?? null,
      wait_time: info.wait_time ?? null,
      status_text: info.status_text || null,
    };
  }

  const meta = body.meta || {};
  const startedAt = Number(meta.started_at) || null;
  const durationMs = info.execution_time_ms ?? (startedAt ? Date.now() - startedAt : null);

  if (info.status === "failed") {
    const { saveGeneration } = require("./aiLab/labStore.cjs");
    const saved = await saveGeneration({
      job_id: jobId,
      model_id: meta.model_id,
      model_label: meta.model_label,
      workflow_id: meta.workflow_id,
      workflow_label: meta.workflow_label,
      prompt: meta.prompt,
      negative_prompt: meta.negative_prompt,
      params: meta.params || {},
      status: "failed",
      error: info.error || "Geração falhou.",
      duration_ms: durationMs,
    });
    return { status: "failed", error: info.error || "Geração falhou.", saved };
  }

  // succeeded — mirror outputs to permanent storage, then store in lab history.
  const { extractUrls } = require("./creationMedia.cjs");
  let urls = extractUrls(info.output);
  if (!urls.length) {
    const errMsg = "ComfyUI terminou sem imagem (modelo em falta ou erro no workflow).";
    const { saveGeneration } = require("./aiLab/labStore.cjs");
    const saved = await saveGeneration({
      job_id: jobId,
      model_id: meta.model_id,
      model_label: meta.model_label,
      workflow_id: meta.workflow_id,
      workflow_label: meta.workflow_label,
      prompt: meta.prompt,
      negative_prompt: meta.negative_prompt,
      params: meta.params || {},
      status: "failed",
      error: errMsg,
      duration_ms: durationMs,
    });
    return { status: "failed", error: errMsg, saved };
  }
  try {
    const comfy = require("./providers/comfyUiProvider.cjs");
    urls = await comfy.mirrorOutputUrls(urls, { userId: "ai-lab" });
  } catch (mirrorErr) {
    console.warn("[adminLabPoll] mirror failed:", mirrorErr?.message);
  }
  if (!urls.length) {
    const errMsg = "Imagem gerada no pod mas falhou ao publicar (storage).";
    const { saveGeneration } = require("./aiLab/labStore.cjs");
    const saved = await saveGeneration({
      job_id: jobId,
      model_id: meta.model_id,
      model_label: meta.model_label,
      workflow_id: meta.workflow_id,
      workflow_label: meta.workflow_label,
      prompt: meta.prompt,
      negative_prompt: meta.negative_prompt,
      params: meta.params || {},
      status: "failed",
      error: errMsg,
      duration_ms: durationMs,
    });
    return { status: "failed", error: errMsg, saved };
  }
  const { saveGeneration } = require("./aiLab/labStore.cjs");
  const saved = await saveGeneration({
    job_id: jobId,
    model_id: meta.model_id,
    model_label: meta.model_label,
    workflow_id: meta.workflow_id,
    workflow_label: meta.workflow_label,
    prompt: meta.prompt,
    negative_prompt: meta.negative_prompt,
    params: meta.params || {},
    result_urls: urls,
    status: "succeeded",
    duration_ms: durationMs,
  });
  return { status: "succeeded", result_urls: urls, duration_ms: durationMs, saved };
}

async function adminLabHistory() {
  const { listGenerations } = require("./aiLab/labStore.cjs");
  return { generations: await listGenerations(80) };
}

async function adminLabFavorite(body) {
  const { setFavorite } = require("./aiLab/labStore.cjs");
  return setFavorite(String(body.id || ""), Boolean(body.favorite));
}

async function adminLabDelete(id) {
  const { deleteGeneration } = require("./aiLab/labStore.cjs");
  return deleteGeneration(id);
}

async function adminLabStats() {
  const { computeStats } = require("./aiLab/labStore.cjs");
  return computeStats();
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
    {
      $set: {
        replicate_balance_usd: bal,
        replicate_balance_tracked_usd: bal,
        updated_at: new Date().toISOString(),
      },
    },
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
  let adminUser;
  try {
    adminUser = await requireAdminFromToken(verifySessionToken, req);
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
      const subscription = url.searchParams.get("subscription") || "all";
      return json(res, 200, await adminUsers(limit, search, subscription));
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
    if (req.method === "GET" && path === "admin/engine") {
      return json(res, 200, await adminGetEngine());
    }
    if (req.method === "GET" && path === "admin/engine/health") {
      return json(res, 200, await adminEngineHealth());
    }
    if (req.method === "GET" && path === "admin/marketing/campaigns") {
      const { listCampaignsForAdmin } = require("./adminMarketingCampaigns.cjs");
      return json(res, 200, await listCampaignsForAdmin());
    }
    if (req.method === "GET" && path === "admin/lab/catalog") {
      return json(res, 200, await adminLabCatalog());
    }
    if (req.method === "GET" && path === "admin/lab/history") {
      return json(res, 200, await adminLabHistory());
    }
    if (req.method === "GET" && path === "admin/lab/stats") {
      return json(res, 200, await adminLabStats());
    }

    const body = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method)
      ? await readJsonRequestBody(req)
      : {};

    const mktCampaignMatch = path.match(/^admin\/marketing\/campaigns\/([^/]+)$/);
    if (req.method === "PATCH" && mktCampaignMatch) {
      const { updateCampaign } = require("./adminMarketingCampaigns.cjs");
      const out = await updateCampaign(mktCampaignMatch[1], body);
      return json(res, 200, out);
    }
    if (req.method === "DELETE" && mktCampaignMatch) {
      const { deleteCampaign } = require("./adminMarketingCampaigns.cjs");
      return json(res, 200, await deleteCampaign(mktCampaignMatch[1]));
    }

    if (req.method === "POST" && path === "admin/marketing/campaigns") {
      const { createCampaign } = require("./adminMarketingCampaigns.cjs");
      return json(res, 200, await createCampaign(body));
    }
    if (req.method === "POST" && path === "admin/marketing/preview") {
      const { previewCampaignDraft } = require("./adminMarketingCampaigns.cjs");
      return json(res, 200, previewCampaignDraft(body));
    }
    if (req.method === "POST" && path === "admin/marketing/send") {
      const { sendMarketingCampaign } = require("./adminMarketingCampaigns.cjs");
      const campaignId = String(body.campaign_id || "").trim();
      const email = String(body.email || "").trim();
      if (!campaignId) return json(res, 400, { detail: "Campanha em falta." });
      const out = await sendMarketingCampaign(campaignId, { email });
      return json(res, 200, out);
    }
    if (req.method === "POST" && path === "admin/marketing/send-batch") {
      const { sendMarketingBatch } = require("./adminMarketingCampaigns.cjs");
      const campaignId = String(body.campaign_id || "").trim();
      if (!campaignId) return json(res, 400, { detail: "Campanha em falta." });
      const out = await sendMarketingBatch(campaignId, {
        cursor: body.cursor,
        batchSize: body.batch_size,
      });
      return json(res, 200, out);
    }

    if (req.method === "POST" && path === "admin/ai-text/playground") {
      const { runAiTextPlayground } = require("./aiTextPlayground.cjs");
      return json(res, 200, await runAiTextPlayground(body));
    }

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
        credits: Number.isFinite(credits) ? credits : 0,
        lang,
        note: body.reason || "admin account setup",
      });
      return json(res, 200, {
        ok: true,
        pending: true,
        email,
        credits: Number.isFinite(credits) ? credits : 0,
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
    if (req.method === "PATCH" && path === "admin/engine") {
      return json(res, 200, await adminPatchEngine(body, adminUser?.email));
    }
    if (req.method === "POST" && path === "admin/engine/runpod/pause") {
      return json(res, 200, await adminRunpodPause());
    }
    if (req.method === "POST" && path === "admin/engine/runpod/resume") {
      return json(res, 200, await adminRunpodResume());
    }
    if (req.method === "POST" && path === "admin/engine/runpod/purge-queue") {
      return json(res, 200, await adminRunpodPurgeQueue());
    }

    if (req.method === "POST" && path === "admin/lab/generate") {
      return json(res, 200, await adminLabGenerate(body));
    }
    if (req.method === "POST" && path === "admin/lab/poll") {
      return json(res, 200, await adminLabPoll(body));
    }
    if (req.method === "POST" && path === "admin/lab/favorite") {
      return json(res, 200, await adminLabFavorite(body));
    }
    if (req.method === "POST" && path === "admin/lab/repair") {
      return json(res, 200, await adminLabRepair());
    }
    const labDeleteMatch = path.match(/^admin\/lab\/history\/([^/]+)$/);
    if (req.method === "DELETE" && labDeleteMatch) {
      return json(res, 200, await adminLabDelete(labDeleteMatch[1]));
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
