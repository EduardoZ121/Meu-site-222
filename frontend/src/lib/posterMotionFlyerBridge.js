import { API } from "./api";

const STORAGE_KEY = "rp_poster_to_mfly";

/** Guarda o póster para pré-carregar no Motion Flyer (sessionStorage). */
export function queuePosterForMotionFlyer({ imageUrl, creationId = "", aspectRatio = "" } = {}) {
  const url = String(imageUrl || "").trim();
  if (!url) return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        imageUrl: url,
        creationId: String(creationId || "").trim(),
        aspectRatio: String(aspectRatio || "").trim(),
        queuedAt: Date.now(),
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/** Lê e limpa o póster em fila (só na página Motion Flyer). */
export function consumePosterForMotionFlyer() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    const data = JSON.parse(raw);
    if (!data?.imageUrl) return null;
    if (Date.now() - Number(data.queuedAt || 0) > 30 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

async function fetchBlobFromUrl(src) {
  const res = await fetch(src, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) throw new Error("not-image");
  return blob;
}

/** Descarrega a imagem do póster como File para upload no Motion Flyer. */
export async function fetchPosterImageFile({ imageUrl, creationId } = {}) {
  const url = String(imageUrl || "").trim();
  if (!url) return null;

  const candidates = [
    url,
    creationId ? `${API}/generations/${encodeURIComponent(creationId)}/media?index=0` : null,
  ].filter(Boolean);

  let lastErr;
  for (const src of candidates) {
    try {
      const blob = await fetchBlobFromUrl(src);
      const ext = blob.type.includes("png") ? "png" : "jpg";
      return new File([blob], `poster-motion-flyer.${ext}`, { type: blob.type });
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  return null;
}

export function isPosterCreation(creation) {
  return String(creation?.type || "").trim().toLowerCase() === "poster";
}
