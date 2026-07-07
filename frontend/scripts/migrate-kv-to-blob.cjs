/**
 * One-shot: copy all rp:col:* arrays from Upstash KV into per-doc Vercel Blob (rp-doc/).
 * Reads via KV_REST_API_READ_ONLY_TOKEN when write quota is exhausted.
 *
 * Usage (from frontend/):
 *   node scripts/migrate-kv-to-blob.cjs
 *   node scripts/migrate-kv-to-blob.cjs --dry-run
 */
require("dotenv").config({ path: ".env.local" });

const { Redis } = require("@upstash/redis");
const { put } = require("@vercel/blob");
const { blobPutOptions, isBlobConfigured } = require("../api/lib/blobEnv.cjs");

const COL_PREFIX = "rp:col:";
const BLOB_DOC_PREFIX = "rp-doc/";

const COLLECTIONS = [
  "users",
  "credit_transactions",
  "purchases",
  "creations",
  "pending_predictions",
  "platform_settings",
  "ip_events",
  "replicate_sync_events",
  "marketing_campaigns",
  "lab_generations",
  "account_presets",
  "deploy_credit_events",
];

function docPathname(col, id) {
  return `${BLOB_DOC_PREFIX}${col}/${encodeURIComponent(String(id))}.json`;
}

function normalizeDoc(doc) {
  if (!doc || typeof doc !== "object") return null;
  const id = doc.id || (doc._id != null ? String(doc._id) : null);
  if (!id) return null;
  if (!doc.id) return { ...doc, id };
  return doc;
}

function getRedis() {
  const token = process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!process.env.KV_REST_API_URL || !token) {
    throw new Error("KV_REST_API_URL + token required");
  }
  return new Redis({ url: process.env.KV_REST_API_URL, token });
}

async function saveDoc(col, doc) {
  const body = JSON.stringify(doc);
  await put(docPathname(col, doc.id), body, {
    ...blobPutOptions(),
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function migrateCollection(redis, col, dryRun) {
  const key = `${COL_PREFIX}${col}`;
  let rows;
  try {
    rows = await redis.get(key);
  } catch (e) {
    console.warn(`  skip ${col}: KV read failed — ${e.message}`);
    return { col, read: 0, written: 0, skipped: true };
  }
  if (!Array.isArray(rows) || !rows.length) {
    return { col, read: 0, written: 0, skipped: false };
  }
  let written = 0;
  for (const raw of rows) {
    const doc = normalizeDoc(raw);
    if (!doc) continue;
    if (!dryRun) {
      // eslint-disable-next-line no-await-in-loop
      await saveDoc(col, doc);
    }
    written += 1;
  }
  return { col, read: rows.length, written, skipped: false };
}

(async () => {
  const dryRun = process.argv.includes("--dry-run");
  if (!isBlobConfigured()) throw new Error("BLOB_READ_WRITE_TOKEN required");
  const redis = getRedis();
  console.log(dryRun ? "[dry-run] KV → Blob migration" : "KV → Blob migration");
  const summary = [];
  for (const col of COLLECTIONS) {
    // eslint-disable-next-line no-await-in-loop
    const r = await migrateCollection(redis, col, dryRun);
    summary.push(r);
    if (r.written || r.read) {
      console.log(`  ${col}: ${r.written}/${r.read} docs${dryRun ? " (dry)" : ""}`);
    }
  }
  const total = summary.reduce((n, r) => n + r.written, 0);
  console.log(`Done — ${total} documents${dryRun ? " would be" : ""} written to Blob.`);
  if (!dryRun) {
    console.log("Set RP_STORAGE_BACKEND=blob on Vercel (or rely on blob-first getDb) and redeploy.");
  }
})().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
