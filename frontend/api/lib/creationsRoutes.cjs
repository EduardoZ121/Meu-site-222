const { getDb, storageEnabled, ensureIndexes } = require("./mongo.cjs");
const { sanitizeCreation, trustedProxyTarget, loadCreationMedia } = require("./creationMedia.cjs");

function sessionFromReq(req, verifySessionToken) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return { error: { status: 401, detail: "Não autenticado." } };
  const token = m[1].trim();
  if (token.startsWith("local:")) {
    return { error: { status: 503, detail: "Biblioteca requer conta no servidor." } };
  }
  const user = verifySessionToken(token);
  if (!user) return { error: { status: 401, detail: "Sessão inválida ou expirada." } };
  return { user };
}

function setBinaryCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function handleCreationsRoute(path, req, res, { verifySessionToken, json }) {
  if (!storageEnabled()) {
    if (
      path === "explore"
      || path === "generations/history"
      || path === "credits/transactions"
      || path.startsWith("generations/")
      || path.startsWith("me/")
    ) {
      if (req.method === "GET" && path === "explore") {
        json(res, 200, { creations: [] });
        return true;
      }
      if (req.method === "GET" && path === "generations/history") {
        json(res, 200, { creations: [] });
        return true;
      }
      if (req.method === "DELETE" && /^generations\/[^/]+$/.test(path)) {
        json(res, 503, { detail: "Biblioteca requer conta no servidor (Mongo/KV)." });
        return true;
      }
      if (req.method === "POST" && /^generations\/[^/]+\/favorite$/.test(path)) {
        json(res, 503, { detail: "Biblioteca requer conta no servidor." });
        return true;
      }
      if (req.method === "GET" && path === "credits/transactions") {
        json(res, 200, { transactions: [] });
        return true;
      }
      if (req.method === "GET" && path === "me/referrals/stats") {
        json(res, 200, { code: "", referred_count: 0, credits_earned: 0, reward_per_referral: 30 });
        return true;
      }
    }
    return false;
  }

  await ensureIndexes();
  const db = await getDb();

  if (req.method === "GET" && path === "explore") {
    const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    const limit = Math.min(48, Math.max(1, Number(url.searchParams.get("limit") || 24)));
    const docs = await db
      .collection("creations")
      .find({ is_public: true }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    json(res, 200, { creations: docs.map(sanitizeCreation) });
    return true;
  }

  if (req.method === "GET" && path === "generations/history") {
    const sess = sessionFromReq(req, verifySessionToken);
    if (sess.error) {
      json(res, sess.error.status, { detail: sess.error.detail });
      return true;
    }
    const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    const limit = Math.min(80, Math.max(1, Number(url.searchParams.get("limit") || 30)));
    const onlyFavorites = url.searchParams.get("only_favorites") === "true";
    const q = { user_id: sess.user.id };
    if (onlyFavorites) q.is_favorite = true;
    const docs = await db
      .collection("creations")
      .find(q, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    json(res, 200, { creations: docs.map(sanitizeCreation) });
    return true;
  }

  const mediaMatch = path.match(/^generations\/([^/]+)\/media$/);
  if (req.method === "GET" && mediaMatch) {
    const sess = sessionFromReq(req, verifySessionToken);
    if (sess.error) {
      json(res, sess.error.status, { detail: sess.error.detail });
      return true;
    }
    const id = decodeURIComponent(mediaMatch[1]);
    const doc = await db.collection("creations").findOne(
      { id, user_id: sess.user.id },
      { projection: { _id: 0 } },
    );
    if (!doc) {
      json(res, 404, { detail: "Criação não encontrada." });
      return true;
    }
    try {
      const media = await loadCreationMedia(db, doc);
      if (!media?.buf?.length) {
        json(res, 404, { detail: "Ficheiro indisponível ou link expirado." });
        return true;
      }
      setBinaryCors(res);
      res.setHeader("Content-Type", media.contentType);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.statusCode = 200;
      res.end(media.buf);
      return true;
    } catch (err) {
      console.error("[creations] media failed", id, err?.message);
      json(res, 502, { detail: "Não foi possível carregar a imagem." });
      return true;
    }
  }

  if (req.method === "GET" && path === "generations/proxy-media") {
    const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    const target = trustedProxyTarget(url.searchParams.get("u") || "");
    if (!target) {
      json(res, 400, { detail: "URL de media inválida." });
      return true;
    }
    try {
      const upstream = await fetch(target, { redirect: "follow" });
      if (!upstream.ok) {
        json(res, 502, { detail: "Não foi possível obter a imagem." });
        return true;
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      const ct = upstream.headers.get("content-type") || "image/jpeg";
      setBinaryCors(res);
      res.setHeader("Content-Type", ct);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.statusCode = 200;
      res.end(buf);
      return true;
    } catch {
      json(res, 502, { detail: "Falha ao obter media." });
      return true;
    }
  }

  if (req.method === "GET" && path === "credits/transactions") {
    const sess = sessionFromReq(req, verifySessionToken);
    if (sess.error) {
      json(res, sess.error.status, { detail: sess.error.detail });
      return true;
    }
    const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    const limit = Math.min(80, Math.max(1, Number(url.searchParams.get("limit") || 50)));
    const docs = await db
      .collection("credit_transactions")
      .find({ user_id: sess.user.id }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    json(res, 200, { transactions: docs });
    return true;
  }

  if (req.method === "GET" && path === "me/referrals/stats") {
    const sess = sessionFromReq(req, verifySessionToken);
    if (sess.error) {
      json(res, sess.error.status, { detail: sess.error.detail });
      return true;
    }
    const user = await db.collection("users").findOne({ id: sess.user.id }, { projection: { _id: 0 } });
    if (!user) {
      json(res, 404, { detail: "Utilizador não encontrado." });
      return true;
    }
    const referred_count = await db.collection("users").countDocuments({ referred_by: user.id });
    const agg = await db
      .collection("credit_transactions")
      .aggregate([
        { $match: { user_id: user.id, type: "referral" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray();
    const credits_earned = agg[0]?.total || 0;
    json(res, 200, {
      code: user.referral_code || "",
      referred_count,
      credits_earned,
      reward_per_referral: 30,
    });
    return true;
  }

  const favMatch = path.match(/^generations\/([^/]+)\/favorite$/);
  if (req.method === "POST" && favMatch) {
    const sess = sessionFromReq(req, verifySessionToken);
    if (sess.error) {
      json(res, sess.error.status, { detail: sess.error.detail });
      return true;
    }
    const id = favMatch[1];
    const doc = await db.collection("creations").findOne(
      { id, user_id: sess.user.id },
      { projection: { _id: 0 } },
    );
    if (!doc) {
      json(res, 404, { detail: "Criação não encontrada." });
      return true;
    }
    const is_favorite = !doc.is_favorite;
    await db.collection("creations").updateOne({ id }, { $set: { is_favorite } });
    json(res, 200, { is_favorite });
    return true;
  }

  const delMatch = path.match(/^generations\/([^/]+)$/);
  if (req.method === "DELETE" && delMatch) {
    const sess = sessionFromReq(req, verifySessionToken);
    if (sess.error) {
      json(res, sess.error.status, { detail: sess.error.detail });
      return true;
    }
    const id = decodeURIComponent(delMatch[1]);
    if (id === "proxy-media" || id === "history") {
      json(res, 404, { detail: "Criação não encontrada." });
      return true;
    }
    try {
      const result = await db.collection("creations").deleteOne({ id, user_id: sess.user.id });
      if (!result?.deletedCount) {
        json(res, 404, { detail: "Criação não encontrada." });
        return true;
      }
      json(res, 200, { ok: true });
      return true;
    } catch (err) {
      console.error("[creations] deleteOne failed", err);
      json(res, 500, { detail: "Não foi possível apagar. Tenta atualizar a página." });
      return true;
    }
  }

  const pubMatch = path.match(/^me\/toggle-public\/([^/]+)$/);
  if (req.method === "POST" && pubMatch) {
    const sess = sessionFromReq(req, verifySessionToken);
    if (sess.error) {
      json(res, sess.error.status, { detail: sess.error.detail });
      return true;
    }
    const id = pubMatch[1];
    const doc = await db.collection("creations").findOne(
      { id, user_id: sess.user.id },
      { projection: { _id: 0 } },
    );
    if (!doc) {
      json(res, 404, { detail: "Criação não encontrada." });
      return true;
    }
    const is_public = !doc.is_public;
    await db.collection("creations").updateOne({ id }, { $set: { is_public } });
    json(res, 200, { is_public });
    return true;
  }

  return false;
}

module.exports = { handleCreationsRoute };
