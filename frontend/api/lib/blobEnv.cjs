/** Token Vercel Blob — aceita nomes alternativos usados em deploys. */
function getBlobReadWriteToken() {
  return (
    String(process.env.BLOB_READ_WRITE_TOKEN || "").trim()
    || String(process.env.VERCEL_BLOB_RW_TOKEN || "").trim()
  );
}

function isBlobConfigured() {
  return Boolean(getBlobReadWriteToken());
}

module.exports = { getBlobReadWriteToken, isBlobConfigured };
