/**
 * Preview imediato: só FileReader → data URL (sem canvas).
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
