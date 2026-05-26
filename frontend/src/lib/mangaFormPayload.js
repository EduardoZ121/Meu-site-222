/** Payload leve para API — nunca incluir data URLs (estoura 4 MB no Vercel). */

export function stripAssetForApi(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const next = { ...obj };
  if (typeof next.thumb === "string" && next.thumb.startsWith("data:")) next.thumb = null;
  if (next.sheets && typeof next.sheets === "object") {
    next.sheets = Object.fromEntries(
      Object.entries(next.sheets).map(([k, v]) => [
        k,
        typeof v === "string" && v.startsWith("data:") ? null : v,
      ]),
    );
  }
  return next;
}

export function panelForApi(panel) {
  if (!panel) return null;
  const { resultUrl, ...rest } = panel;
  return {
    ...rest,
    resultUrl: resultUrl?.startsWith?.("http") ? resultUrl : null,
  };
}

export function projectMetaForApi(project) {
  return {
    pageLayout: project?.pageLayout,
    characters: (project?.characters || []).map((c) => stripAssetForApi(c)),
    scenarios: (project?.scenarios || []).map((s) => stripAssetForApi(s)),
  };
}
