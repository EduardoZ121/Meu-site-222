const { MongoClient } = require("mongodb");
const { kvEnabled, createKvDb } = require("./kvDb.cjs");
const { blobColEnabled, createBlobColDb } = require("./blobColDb.cjs");

let client = null;
let dbPromise = null;

function mongoEnabled() {
  return Boolean(process.env.MONGO_URL && String(process.env.MONGO_URL).trim());
}

function kvDisabled() {
  return String(process.env.RP_DISABLE_KV || "").trim() === "1";
}

function storageBackendPref() {
  return String(process.env.RP_STORAGE_BACKEND || "").trim().toLowerCase();
}

function blobStoragePreferred() {
  if (!blobColEnabled()) return false;
  const pref = storageBackendPref();
  if (pref === "blob") return true;
  if (pref === "kv") return false;
  return kvDisabled();
}

function storageEnabled() {
  return mongoEnabled() || blobStoragePreferred() || (kvEnabled() && !kvDisabled());
}

function dbName() {
  return process.env.DB_NAME || "remake_pixel";
}

async function getMongoDb() {
  if (!mongoEnabled()) return null;
  if (!dbPromise) {
    client = new MongoClient(process.env.MONGO_URL, { maxPoolSize: 4 });
    dbPromise = client.connect().then(() => client.db(dbName()));
  }
  return dbPromise;
}

async function getDb() {
  if (mongoEnabled()) return getMongoDb();
  const pref = storageBackendPref();
  // Explicit kv only when requested — default prefers blob (KV whole-col sync exhausts Upstash quotas).
  if (pref === "kv" && kvEnabled() && !kvDisabled()) return createKvDb();
  if (blobColEnabled()) return createBlobColDb();
  if (kvEnabled() && !kvDisabled()) return createKvDb();
  return null;
}

function resolveStorageBackendLabel() {
  if (mongoEnabled()) return "mongo";
  if (blobStoragePreferred()) return "blob";
  if (kvEnabled() && !kvDisabled()) return "kv";
  if (blobColEnabled()) return "blob";
  return "none";
}

async function ensureIndexes() {
  if (!mongoEnabled()) return;
  const db = await getMongoDb();
  if (!db) return;
  await db.collection("users").createIndex("email", { unique: true });
  await db.collection("users").createIndex("id", { unique: true });
  await db.collection("users").createIndex("signup_ip");
  await db.collection("users").createIndex("last_ip");
  await db.collection("credit_transactions").createIndex([["user_id", 1], ["created_at", -1]]);
  await db.collection("purchases").createIndex("stripe_session_id", { unique: true });
  await db.collection("creations").createIndex([["user_id", 1], ["created_at", -1]]);
  await db.collection("ip_events").createIndex([["ip", 1], ["created_at", -1]]);
  await db.collection("pending_predictions").createIndex("id", { unique: true });
  await db.collection("pending_predictions").createIndex([["user_id", 1], ["created_at", -1]]);
  await db.collection("replicate_sync_events").createIndex("stripe_session_id", { unique: true, sparse: true });
}

module.exports = {
  mongoEnabled,
  storageEnabled,
  kvEnabled,
  blobColEnabled,
  blobStoragePreferred,
  resolveStorageBackendLabel,
  getDb,
  ensureIndexes,
};
