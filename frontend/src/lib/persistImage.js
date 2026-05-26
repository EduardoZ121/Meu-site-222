import { VERCEL_BLOB_DISABLED } from "./blobDisabled";
import { invalidateBlobUploadCache, isBlobUploadEnabled } from "./api";

const BLOB_OFF_MSG = "Armazenamento Vercel Blob está desligado neste projeto.";

/** @deprecated Blob desligado */
export async function persistImageToBlobStore() {
  throw new Error(BLOB_OFF_MSG);
}

/** @deprecated Blob desligado */
export async function persistVideoToBlobStore() {
  throw new Error(BLOB_OFF_MSG);
}

export async function isBlobPersistAvailable() {
  if (VERCEL_BLOB_DISABLED) return false;
  return isBlobUploadEnabled();
}

export { invalidateBlobUploadCache };
