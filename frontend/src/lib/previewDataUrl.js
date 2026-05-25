/**
 * Preview de ficheiros — object URLs estáveis (evita imagem “corrompida” por revoke prematuro).
 */

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const r = new FileReader();
    r.onerror = () => reject(r.error || new Error("FileReader"));
    r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
    r.readAsDataURL(file);
  });
}

export function revokeFilePreviewUrl(url) {
  try {
    if (url && String(url).startsWith("blob:")) URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}

/**
 * Cria object URL para preview; revoga a anterior. Devolve a nova URL ou null.
 * @param {File|Blob|null} file
 * @param {{ current: string|null }} urlRef
 */
export function attachFileObjectPreview(file, urlRef) {
  const prev = urlRef?.current;
  if (!file) {
    revokeFilePreviewUrl(prev);
    if (urlRef) urlRef.current = null;
    return null;
  }
  const next = URL.createObjectURL(file);
  if (urlRef) urlRef.current = next;
  if (prev && prev !== next) revokeFilePreviewUrl(prev);
  return next;
}
