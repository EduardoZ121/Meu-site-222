import { API } from "./api";

/** Normaliza result_urls (string JSON, objeto, etc.). */
export function normalizeResultUrls(raw) {
  if (raw == null) return [];
  let v = raw;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        v = JSON.parse(t);
      } catch {
        return t.startsWith("http") ? [t] : [];
      }
    } else if (t.startsWith("http") || t.startsWith("data:image/")) {
      return [t];
    }
    return [];
  }
  if (!Array.isArray(v)) v = [v];
  return v
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return (item.url || item.uri || item.href || "").trim() || null;
      }
      return null;
    })
    .filter(
      (u) =>
        u
        && u.length > 8
        && !u.includes("[object")
        && (u.startsWith("http") || u.startsWith("data:image/") || u.startsWith("data:video/")),
    );
}

export function primaryResultUrl(creation) {
  return normalizeResultUrls(creation?.result_urls)[0] || "";
}

export function isVideoCreation(creation, url) {
  if (creation?.type === "video") return true;
  const u = url || primaryResultUrl(creation);
  return /\.(mp4|webm|mov)(\?|$)/i.test(u);
}

/** Proxy same-origin (só quando o CDN bloqueia hotlink). */
export function proxiedMediaUrl(url) {
  if (!url || url.startsWith("data:")) return url;
  if (/replicate\.delivery|replicate\.com\/api/i.test(url)) {
    return `${API}/generations/proxy-media?u=${encodeURIComponent(url)}`;
  }
  return url;
}

/** URL para <img>/<video> — directo primeiro; proxy só se necessário. */
export function displayMediaUrl(url, useProxy = false) {
  if (!url) return "";
  if (useProxy) return proxiedMediaUrl(url);
  return url;
}

export async function downloadCreationFile(url, filename = "remake-pixel.jpg") {
  if (!url) throw new Error("Sem ficheiro para descarregar.");
  const tryUrls = [url, proxiedMediaUrl(url)].filter((u, i, a) => a.indexOf(u) === i);
  let lastErr;
  for (const src of tryUrls) {
    try {
      const res = await fetch(src, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
      return;
    } catch (e) {
      lastErr = e;
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
  if (lastErr) throw lastErr;
}
