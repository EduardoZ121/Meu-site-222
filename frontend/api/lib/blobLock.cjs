/**
 * Lock atómico distribuído via Vercel Blob.
 *
 * `put(path, ..., { allowOverwrite: false })` é atómico: se o blob já existir, lança.
 * Isto dá exatamente 1 vencedor mesmo com N invocações concorrentes (webhook + cron +
 * polling a correr ao mesmo tempo em instâncias serverless diferentes) — ao contrário do
 * `findOneAndUpdate` sobre o shim Mongo/Blob, que NÃO é atómico e deixava vários workers
 * enviarem o mesmo email.
 */
const { put, del, list } = require("@vercel/blob");
const { blobPutOptions, isBlobConfigured } = require("./blobEnv.cjs");

const NOOP_RELEASE = async () => {};

function lockPath(key) {
  const safe = String(key).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180);
  return `rp-lock/${safe}.json`;
}

/**
 * Tenta adquirir um lock atómico.
 * @param {string} key            identificador único (ex.: `email-notify-<id>`)
 * @param {object} [opts]
 * @param {number} [opts.staleMs] idade acima da qual um lock preso é considerado morto e recuperado
 * @returns {Promise<{acquired: boolean, release: () => Promise<void>, unsupported?: boolean}>}
 */
async function acquireBlobLock(key, opts = {}) {
  const staleMs = Number.isFinite(opts.staleMs) ? opts.staleMs : 5 * 60 * 1000;

  // Sem Blob configurado não há como fazer lock distribuído — degrada em segurança
  // (deixa passar; a idempotency key do Resend continua a proteger retries sequenciais).
  if (!isBlobConfigured()) {
    return { acquired: true, unsupported: true, release: NOOP_RELEASE };
  }

  const path = lockPath(key);

  const tryPut = async () => {
    await put(path, JSON.stringify({ t: Date.now() }), {
      ...blobPutOptions(),
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
  };

  try {
    await tryPut();
    return { acquired: true, release: () => releaseBlobLock(path) };
  } catch {
    // Já existe -> alguém detém o lock. Recupera se estiver preso (stale).
    try {
      const { blobs } = await list({ prefix: path, limit: 1, ...blobPutOptions() });
      const existing = blobs && blobs[0];
      const uploadedAt = existing && existing.uploadedAt ? new Date(existing.uploadedAt).getTime() : 0;
      if (uploadedAt && Date.now() - uploadedAt > staleMs) {
        await del(path, blobPutOptions());
        await tryPut();
        return { acquired: true, release: () => releaseBlobLock(path) };
      }
    } catch {
      /* ignora — trata como não adquirido */
    }
    return { acquired: false, release: NOOP_RELEASE };
  }
}

async function releaseBlobLock(path) {
  try {
    await del(path, blobPutOptions());
  } catch {
    /* ignora — o lock caduca por staleness na próxima tentativa */
  }
}

module.exports = { acquireBlobLock };
