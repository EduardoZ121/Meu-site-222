/**
 * Vercel Blob — DESLIGADO por defeito no RemakePix.
 * Uploads do estúdio: comprimir no browser + POST directo ao /api.
 * Para reativar: DISABLE_VERCEL_BLOB=0 + BLOB_READ_WRITE_TOKEN na Vercel.
 */
const BLOB_STORAGE_DISABLED = String(process.env.DISABLE_VERCEL_BLOB ?? "1") !== "0";

function getBlobReadWriteToken() {
  if (BLOB_STORAGE_DISABLED) return "";
  return (
    String(process.env.BLOB_READ_WRITE_TOKEN || "").trim()
    || String(process.env.VERCEL_BLOB_RW_TOKEN || "").trim()
  );
}

function isBlobConfigured() {
  if (BLOB_STORAGE_DISABLED) return false;
  return Boolean(getBlobReadWriteToken());
}

function isBlobDisabled() {
  return BLOB_STORAGE_DISABLED;
}

module.exports = {
  getBlobReadWriteToken,
  isBlobConfigured,
  isBlobDisabled,
  BLOB_STORAGE_DISABLED,
};
