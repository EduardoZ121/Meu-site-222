import { api } from "./api";
import { isBrowserOnlineFlag } from "./uploadReachability";

function joinApiPath(path) {
  const base = String(process.env.REACT_APP_BACKEND_URL || "").trim().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return `/api${p}`;
  if (typeof window !== "undefined" && window.location?.protocol === "https:" && base.startsWith("http:")) {
    return `/api${p}`;
  }
  return `${base}/api${p}`;
}

let s3AvailableCache = null;

/** S3 + CloudFront configurado no servidor. */
export async function isS3VideoUploadAvailable() {
  if (s3AvailableCache !== null) return s3AvailableCache;
  if (typeof fetch === "undefined") {
    s3AvailableCache = false;
    return false;
  }
  try {
    const r = await fetch(joinApiPath("/upload/s3/status"), {
      method: "GET",
      credentials: "same-origin",
    });
    if (!r.ok) return false;
    const j = await r.json();
    s3AvailableCache = Boolean(j.s3);
    return s3AvailableCache;
  } catch {
    return false;
  }
}

export function invalidateS3VideoUploadCache() {
  s3AvailableCache = null;
}

function putToPresignedUrl(file, presign, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presign.uploadUrl, true);
    const ct = presign.headers?.["Content-Type"] || file.type || "video/mp4";
    xhr.setRequestHeader("Content-Type", ct);
    xhr.timeout = 600_000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(presign.publicUrl);
        return;
      }
      reject(new Error(`Upload S3 falhou (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => {
      reject(new Error(
        isBrowserOnlineFlag()
          ? "Falhou o envio do vídeo. Tenta outra vez ou recarrega (Ctrl+F5)."
          : "Sem ligação à rede. Verifica Wi‑Fi ou dados móveis.",
      ));
    };
    xhr.ontimeout = () => reject(new Error("Upload do vídeo expirou — tenta um ficheiro mais curto."));
    xhr.send(file);
  });
}

/**
 * Upload directo browser → S3 (URL pré-assinada) → URL pública CloudFront.
 */
export async function uploadVideoViaS3(file, { onProgress } = {}) {
  const { data: presign } = await api.post("/upload/s3/presign-video", {
    filename: file.name || "video.mp4",
    contentType: file.type || "video/mp4",
    contentLength: file.size,
  });
  if (!presign?.uploadUrl || !presign?.publicUrl) {
    throw new Error("Resposta inválida do servidor de upload.");
  }
  return putToPresignedUrl(file, presign, onProgress);
}

/** Fotos grandes → S3/CloudFront (evita limite 4 MB da Vercel). */
export async function uploadImageViaS3(file, { onProgress } = {}) {
  const { data: presign } = await api.post("/upload/s3/presign-image", {
    filename: file.name || "photo.jpg",
    contentType: file.type || "image/jpeg",
    contentLength: file.size,
  });
  if (!presign?.uploadUrl || !presign?.publicUrl) {
    throw new Error("Resposta inválida do servidor de upload.");
  }
  return putToPresignedUrl(file, presign, onProgress);
}
