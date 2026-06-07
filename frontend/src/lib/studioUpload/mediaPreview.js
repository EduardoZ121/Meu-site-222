/**
 * Pré-visualização estável — object URLs com chave de ficheiro (evita revoke/corrupção).
 */

export function filePreviewKey(file) {
  if (!file) return "";
  return `${file.name || ""}|${file.size}|${file.lastModified || 0}`;
}

export function revokePreviewUrl(url) {
  try {
    if (url && String(url).startsWith("blob:")) URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}

/**
 * @param {File|Blob|null} file
 * @param {{ current: string|null, key?: string }} store
 */
export function setPreviewFromFile(file, store) {
  const nextKey = filePreviewKey(file);
  if (!file) {
    revokePreviewUrl(store.current);
    store.current = null;
    if (store.key !== undefined) store.key = "";
    return null;
  }
  if (store.key === nextKey && store.current) {
    return store.current;
  }
  revokePreviewUrl(store.current);
  const url = URL.createObjectURL(file);
  store.current = url;
  if (store.key !== undefined) store.key = nextKey;
  return url;
}
