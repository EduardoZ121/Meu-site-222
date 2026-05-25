/** Limites únicos de upload — UI, compressão e API devem alinhar aqui. */

export const MAX_IMAGE_PICKER_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIRECT_BYTES = 3_500_000;
export const MAX_IMAGE_S3_BYTES = 12 * 1024 * 1024;

export const MAX_VIDEO_USER_BYTES = 50 * 1024 * 1024;
export const VIDEO_VERCEL_SAFE_BYTES = 3_200_000;

/** Timeout de offload para nuvem conforme tamanho do ficheiro. */
export function pickBlobOffloadTimeoutMs(totalBytes = 0, hasLargeVideo = false) {
  if (hasLargeVideo) {
    const mb = totalBytes / (1024 * 1024);
    return Math.min(600_000, 90_000 + Math.ceil(mb) * 25_000);
  }
  const mb = totalBytes / (1024 * 1024);
  return Math.min(180_000, 40_000 + Math.ceil(mb) * 12_000);
}

export function formDataTotalBlobBytes(fd) {
  if (!fd?.entries) return 0;
  let n = 0;
  for (const [, v] of fd.entries()) {
    if (v instanceof Blob) n += v.size;
  }
  return n;
}
