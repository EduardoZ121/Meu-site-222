const { MongoClient } = require("mongodb");
const { kvEnabled, createKvDb } = require("./kvDb.cjs");

let client = null;
let dbPromise = null;

function mongoEnabled() {
  return Boolean(process.env.MONGO_URL && String(process.env.MONGO_URL).trim());
}

function storageEnabled() {
  return mongoEnabled() || kvEnabled();
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
  if (kvEnabled()) return createKvDb();
  return null;
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
  getDb,
  ensureIndexes,
};
