/**
 * Vercel Blob — ativo com BLOB_READ_WRITE_TOKEN ou BLOB_STORE_ID (OIDC na Vercel).
 * Só desliga se DISABLE_VERCEL_BLOB=1.
 */
function isBlobExplicitlyDisabled() {
  const v = String(process.env.DISABLE_VERCEL_BLOB ?? "").trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return false;
}

function getBlobStoreId() {
  return String(process.env.BLOB_STORE_ID || "").trim();
}

function getBlobReadWriteToken() {
  if (isBlobExplicitlyDisabled()) return "";
  return (
    String(process.env.BLOB_READ_WRITE_TOKEN || "").trim()
    || String(process.env.VERCEL_BLOB_RW_TOKEN || "").trim()
  );
}

function isBlobConfigured() {
  if (isBlobExplicitlyDisabled()) return false;
  return Boolean(getBlobReadWriteToken()) || Boolean(getBlobStoreId());
}

function isBlobDisabled() {
  return isBlobExplicitlyDisabled() || !isBlobConfigured();
}

/** Opções para `put()` — token explícito ou OIDC automático na Vercel. */
function blobPutOptions(extra = {}) {
  const opts = { access: "public", ...extra };
  const token = getBlobReadWriteToken();
  if (token) opts.token = token;
  return opts;
}

const BLOB_STORAGE_DISABLED = isBlobExplicitlyDisabled();

module.exports = {
  getBlobReadWriteToken,
  getBlobStoreId,
  isBlobConfigured,
  isBlobDisabled,
  blobPutOptions,
  BLOB_STORAGE_DISABLED,
};
