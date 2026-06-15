/** Ativo por omissão; desliga só com REACT_APP_DISABLE_VERCEL_BLOB=1 (alinhado ao servidor). */
export const VERCEL_BLOB_DISABLED = process.env.REACT_APP_DISABLE_VERCEL_BLOB === "1";
