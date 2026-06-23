/**
 * Fetch public website snapshot for brand analysis (no JS execution).
 */
const MAX_HTML_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 12000;

function decodeEntities(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function metaContent(html, key, attr = "name") {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return decodeEntities(m[1].trim());
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2 ? decodeEntities(m2[1].trim()) : "";
}

function stripHtml(html) {
  return decodeEntities(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function normalizeUrl(raw) {
  let u = String(raw || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

async function fetchWebsiteSnapshot(websiteUrl) {
  const url = normalizeUrl(websiteUrl);
  if (!url) {
    const err = new Error("URL do site inválida.");
    err.status = 400;
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "RemakePixBrandBot/1.0 (+https://www.remakepix.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const err = new Error(`Não foi possível abrir o site (HTTP ${res.status}).`);
    err.status = 400;
    throw err;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const html = buf.slice(0, MAX_HTML_BYTES).toString("utf8");

  const title = decodeEntities((html.match(/<title[^>]*>([^<]{1,200})<\/title>/i) || [])[1] || "");
  const description = metaContent(html, "description")
    || metaContent(html, "og:description", "property")
    || metaContent(html, "twitter:description");
  const ogTitle = metaContent(html, "og:title", "property") || metaContent(html, "twitter:title");
  const ogImage = metaContent(html, "og:image", "property");
  const themeColor = metaContent(html, "theme-color");
  const textSnippet = stripHtml(html).slice(0, 6000);

  return {
    url,
    title: ogTitle || title,
    description,
    og_image: ogImage,
    theme_color: themeColor,
    text_snippet: textSnippet,
  };
}

module.exports = {
  fetchWebsiteSnapshot,
  normalizeUrl,
};
