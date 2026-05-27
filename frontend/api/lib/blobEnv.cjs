/**
 * Vercel Blob — ativo quando existe BLOB_READ_WRITE_TOKEN.
 * Só desliga se DISABLE_VERCEL_BLOB=1 (ou true).
 * Valor vazio na Vercel NÃO desliga (evita confusão no dashboard).
 */
function isBlobExplicitlyDisabled() {
  const v = String(process.env.DISABLE_VERCEL_BLOB ?? "").trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return false;
}

function getBlobReadWriteToken() {
  if (isBlobExplicitlyDisabled()) return "";
  return (
    String(process.env.BLOB_READ_WRITE_TOKEN || "").trim()
    || String(process.env.VERCEL_BLOB_RW_TOKEN || "").trim()
  );
}

function isBlobConfigured() {
  return Boolean(getBlobReadWriteToken());
}

function isBlobDisabled() {
  return isBlobExplicitlyDisabled() || !isBlobConfigured();
}

const BLOB_STORAGE_DISABLED = isBlobExplicitlyDisabled();

module.exports = {
  getBlobReadWriteToken,
  isBlobConfigured,
  isBlobDisabled,
  BLOB_STORAGE_DISABLED,
};
