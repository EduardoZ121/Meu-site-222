/** Persistência em Blob desligada — galeria usa URLs do Replicate/Mongo. */
export function invalidateBlobUploadCache() {
  /* no-op */
}

export async function persistImageToBlobStore() {
  throw new Error("Armazenamento em nuvem desligado.");
}

export async function persistVideoToBlobStore() {
  throw new Error("Armazenamento em nuvem desligado.");
}

export async function isBlobPersistAvailable() {
  return false;
}
