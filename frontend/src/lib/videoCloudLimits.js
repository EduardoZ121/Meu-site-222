/**
 * Limites alinhados com Vercel serverless (~4.5 MB de body por função).
 * Vídeos maiores têm de ir para Blob/S3; o POST de geração só leva URLs + campos.
 */

/** Máximo seguro para multipart directo ao `/api/generate/*` (com margem para outros campos). */
export const VIDEO_VERCEL_SAFE_BYTES = 3.2 * 1024 * 1024;

/** Máximo que o utilizador pode escolher no browser (upload para nuvem). */
export const MAX_VIDEO_USER_BYTES = 50 * 1024 * 1024;
