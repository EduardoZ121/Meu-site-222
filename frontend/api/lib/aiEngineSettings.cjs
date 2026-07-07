/**
 * Admin AI engine preference (replicate | runpod).
 * Stored in platform_settings alongside finance config.
 */
const { getDb, storageEnabled } = require("./mongo.cjs");

const SETTINGS_ID = "ai_engine";
const VALID_ENGINES = new Set(["replicate", "runpod"]);
const DEFAULT_ENGINE = "replicate";
const CACHE_MS = 5000;

let cache = { engine: DEFAULT_ENGINE, at: 0 };

function normalizeEngine(value) {
  const v = String(value || "").trim().toLowerCase();
  return VALID_ENGINES.has(v) ? v : DEFAULT_ENGINE;
}

async function readSettingsDoc(db) {
  const col = db.collection("platform_settings");
  // Backend Blob guarda por `id`; Mongo legado pode ter `_id`.
  const doc = await col.findOne({ id: SETTINGS_ID })
    || await col.findOne({ _id: SETTINGS_ID });
  return doc || {};
}

async function getAiEngine() {
  const now = Date.now();
  if (now - cache.at < CACHE_MS) return cache.engine;
  if (!storageEnabled()) {
    cache = { engine: DEFAULT_ENGINE, at: now };
    return DEFAULT_ENGINE;
  }
  try {
    const db = await getDb();
    const doc = await readSettingsDoc(db);
    const engine = normalizeEngine(doc.engine);
    cache = { engine, at: now };
    return engine;
  } catch {
    return DEFAULT_ENGINE;
  }
}

function invalidateAiEngineCache() {
  cache = { engine: DEFAULT_ENGINE, at: 0 };
}

async function setAiEngine(engine, { updatedBy = null } = {}) {
  const normalized = normalizeEngine(engine);
  if (!storageEnabled()) {
    const err = new Error("Base de dados não configurada.");
    err.status = 503;
    throw err;
  }
  const db = await getDb();
  const now = new Date().toISOString();
  await db.collection("platform_settings").updateOne(
    { id: SETTINGS_ID },
    {
      $set: {
        id: SETTINGS_ID,
        engine: normalized,
        updated_at: now,
        updated_by: updatedBy || null,
      },
      $setOnInsert: { id: SETTINGS_ID },
    },
    { upsert: true },
  );
  cache = { engine: normalized, at: Date.now() };
  return { engine: normalized, updated_at: now };
}

async function getAiEngineSettings() {
  const engine = await getAiEngine();
  const { providerStatusSummary } = require("./providers/index.cjs");
  const providers = providerStatusSummary();
  return {
    engine,
    default_engine: DEFAULT_ENGINE,
    valid_engines: [...VALID_ENGINES],
    providers,
    runpod_env: {
      api_key_set: Boolean(String(process.env.RUNPOD_API_KEY || "").trim()),
      endpoint_id: String(process.env.RUNPOD_ENDPOINT_ID || "").trim() || null,
    },
  };
}

module.exports = {
  VALID_ENGINES,
  DEFAULT_ENGINE,
  getAiEngine,
  setAiEngine,
  getAiEngineSettings,
  invalidateAiEngineCache,
};
