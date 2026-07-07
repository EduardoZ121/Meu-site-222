/**
 * AI Lab — persistence for playground generations (history + favorites + stats).
 *
 * Stored in its own `lab_generations` collection so it NEVER touches the
 * user-facing `creations`, credits, or any production data. Admin-only.
 */
const crypto = require("crypto");
const { getDb, storageEnabled } = require("../mongo.cjs");

const COLLECTION = "lab_generations";

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `lab_${crypto.randomBytes(8).toString("hex")}`;
}

async function saveGeneration(doc) {
  if (!storageEnabled()) return null;
  const db = await getDb();
  const row = {
    id: doc.id || newId(),
    job_id: doc.job_id || null,
    model_id: doc.model_id || null,
    model_label: doc.model_label || null,
    workflow_id: doc.workflow_id || null,
    workflow_label: doc.workflow_label || null,
    prompt: doc.prompt || "",
    negative_prompt: doc.negative_prompt || "",
    params: doc.params || {},
    result_urls: Array.isArray(doc.result_urls) ? doc.result_urls : [],
    status: doc.status || "succeeded",
    error: doc.error || null,
    duration_ms: doc.duration_ms ?? null,
    favorite: false,
    created_at: nowIso(),
  };
  await db.collection(COLLECTION).insertOne(row);
  return row;
}

async function listGenerations(limit = 60) {
  if (!storageEnabled()) return [];
  const db = await getDb();
  return db
    .collection(COLLECTION)
    .find({}, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .limit(Math.min(200, Math.max(1, limit)))
    .toArray();
}

async function setFavorite(id, favorite) {
  if (!storageEnabled()) return { ok: false };
  const db = await getDb();
  await db.collection(COLLECTION).updateOne({ id }, { $set: { favorite: Boolean(favorite) } });
  return { ok: true, id, favorite: Boolean(favorite) };
}

async function deleteGeneration(id) {
  if (!storageEnabled()) return { ok: false };
  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({ id });
  return { ok: true, id };
}

/** Aggregate performance stats from stored generations. */
async function computeStats() {
  const rows = await listGenerations(200);
  const ok = rows.filter((r) => r.status === "succeeded" && r.duration_ms != null);
  const total = rows.length;
  const byModel = {};
  for (const r of ok) {
    const key = r.model_label || r.model_id || "—";
    if (!byModel[key]) byModel[key] = { model: key, count: 0, total_ms: 0 };
    byModel[key].count += 1;
    byModel[key].total_ms += r.duration_ms;
  }
  const models = Object.values(byModel).map((m) => ({
    model: m.model,
    count: m.count,
    avg_ms: Math.round(m.total_ms / m.count),
  }));
  const avgMs = ok.length ? Math.round(ok.reduce((s, r) => s + r.duration_ms, 0) / ok.length) : null;
  const sorted = models.slice().sort((a, b) => a.avg_ms - b.avg_ms);
  return {
    total_generations: total,
    succeeded: ok.length,
    failed: rows.filter((r) => r.status === "failed").length,
    favorites: rows.filter((r) => r.favorite).length,
    avg_ms: avgMs,
    fastest_model: sorted[0] || null,
    slowest_model: sorted[sorted.length - 1] || null,
    per_model: models,
  };
}

module.exports = {
  COLLECTION,
  saveGeneration,
  listGenerations,
  setFavorite,
  deleteGeneration,
  computeStats,
};
