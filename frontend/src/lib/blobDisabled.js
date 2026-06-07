/** Vercel Blob desligado — uploads só por POST comprimido (limite ~4,5 MB do serverless). */
export const VERCEL_BLOB_DISABLED = process.env.REACT_APP_DISABLE_VERCEL_BLOB !== "0";
