const crypto = require("crypto");

/** Extrai URLs de saída do Replicate (vários formatos). */
function extractUrls(output) {
  const flat = [];
  const walk = (val) => {
    if (val == null) return;
    if (typeof val === "string") {
      const s = val.trim();
      if (s.startsWith("http://") || s.startsWith("https://")) flat.push(s);
      return;
    }
    if (Array.isArray(val)) {
      val.forEach(walk);
      return;
    }
    if (typeof val === "object") {
      if (typeof val.url === "string") flat.push(val.url.trim());
      else if (typeof val.uri === "string") flat.push(val.uri.trim());
      else if (typeof val.href === "string") flat.push(val.href.trim());
      else if (val.output != null) walk(val.output);
      else Object.values(val).forEach(walk);
    }
  };
  walk(output);
  return [...new Set(flat)].filter((u) => u.length > 8 && !u.includes("[object"));
}

/** Normaliza result_urls vindos da BD (string JSON, objeto, etc.). */
function normalizeResultUrls(raw) {
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
    } else if (t.startsWith("http")) {
      return [t];
    } else {
      return [];
    }
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

function isBlobUrl(url) {
  return /\.public\.blob\.vercel-storage\.com\//i.test(String(url || ""));
}

function trustedProxyTarget(url) {
  const u = String(url || "").trim();
  if (!u.startsWith("https://")) return null;
  if (isBlobUrl(u)) return u;
  if (/replicate\.delivery/i.test(u)) return u;
  if (/^https:\/\/replicate\.com\//i.test(u)) return u;
  if (/^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\//i.test(u)) return u;
  return null;
}

const { isBlobConfigured } = require("./blobEnv.cjs");

/** Copia resultados para Vercel Blob (URLs permanentes na galeria). */
async function mirrorUrlsToBlob(urls) {
  if (!isBlobConfigured() || !Array.isArray(urls) || !urls.length) {
    return urls || [];
  }
  const { put } = require("@vercel/blob");
  const out = [];
  for (const url of urls) {
    if (isBlobUrl(url)) {
      out.push(url);
      continue;
    }
    if (url.startsWith("data:")) {
      try {
        const comma = url.indexOf(",");
        if (comma < 0) continue;
        const header = url.slice(0, comma);
        const b64 = url.slice(comma + 1);
        const buf = Buffer.from(b64, "base64");
        if (buf.length < 128) continue;
        const ct = header.match(/^data:([^;]+)/)?.[1] || "image/png";
        const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
        const name = `rp/creations/${Date.now()}-${crypto.randomBytes(5).toString("hex")}.${ext}`;
        const blob = await put(name, buf, { access: "public", contentType: ct });
        out.push(blob.url);
      } catch {
        out.push(url);
      }
      continue;
    }
    if (!url.startsWith("http")) continue;
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) {
        out.push(url);
        continue;
      }
      const ct = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
      if (!ct.startsWith("image/") && !ct.startsWith("video/")) {
        out.push(url);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 128) {
        out.push(url);
        continue;
      }
      const ext = ct.includes("png")
        ? "png"
        : ct.includes("webp")
          ? "webp"
          : ct.includes("video")
            ? "mp4"
            : "jpg";
      const name = `rp/creations/${Date.now()}-${crypto.randomBytes(5).toString("hex")}.${ext}`;
      const blob = await put(name, buf, { access: "public", contentType: ct });
      out.push(blob.url);
    } catch {
      out.push(url);
    }
  }
  return out.length ? out : urls;
}

async function fetchRemoteMedia(url) {
  return fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "RemakePixel/1.0", Accept: "image/*,video/*,*/*" },
  });
}

/** Tenta copiar para Blob e atualizar a criação na BD. */
async function repairCreationMedia(db, doc) {
  const urls = normalizeResultUrls(doc.result_urls);
  if (!urls.length || !doc?.id) return urls;
  const primary = urls[0];
  if (isBlobUrl(primary)) return urls;
  if (!isBlobConfigured()) return urls;

  const mirrored = await mirrorUrlsToBlob(urls);
  if (mirrored[0] && isBlobUrl(mirrored[0])) {
    try {
      await db.collection("creations").updateOne(
        { id: doc.id },
        { $set: { result_urls: mirrored } },
      );
    } catch (e) {
      console.warn("[creationMedia] repair update failed", e?.message);
    }
    return mirrored;
  }
  return urls;
}

/**
 * Obtém bytes da media de uma criação (com reparo automático para Blob).
 * @returns {{ buf: Buffer, contentType: string, urls: string[] } | null}
 */
async function loadCreationMedia(db, doc) {
  let urls = normalizeResultUrls(doc?.result_urls);
  if (!urls.length) return null;

  let url = urls[0];
  if (!isBlobUrl(url)) {
    urls = await repairCreationMedia(db, doc);
    url = urls[0];
  }

  if (!url) return null;

  if (isBlobUrl(url)) {
    const res = await fetchRemoteMedia(url);
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    const buf = Buffer.from(await res.arrayBuffer());
    return { buf, contentType: ct, urls };
  }

  let res = await fetchRemoteMedia(url);
  if (!res.ok && urls.length > 1) {
    for (let i = 1; i < urls.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      res = await fetchRemoteMedia(urls[i]);
      if (res.ok) {
        url = urls[i];
        break;
      }
    }
  }
  if (!res.ok) return null;

  const ct = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 64) return null;

  if (isBlobConfigured() && !isBlobUrl(url)) {
    const mirrored = await mirrorUrlsToBlob([url]);
    if (mirrored[0] && isBlobUrl(mirrored[0])) {
      try {
        await db.collection("creations").updateOne(
          { id: doc.id },
          { $set: { result_urls: mirrored } },
        );
      } catch {
        /* ignore */
      }
    }
  }

  return { buf, contentType: ct, urls };
}

function sanitizeCreation(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const result_urls = normalizeResultUrls(doc.result_urls);
  return { ...doc, result_urls, has_media: result_urls.length > 0 };
}

module.exports = {
  extractUrls,
  normalizeResultUrls,
  mirrorUrlsToBlob,
  sanitizeCreation,
  trustedProxyTarget,
  isBlobUrl,
  loadCreationMedia,
  repairCreationMedia,
};
