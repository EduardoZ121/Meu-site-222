/**
 * Fetch public website snapshot for brand analysis (no JS execution).
 */
const { enrichWebsiteSnapshot } = require("./brandCampaignSiteIntel.cjs");
const MAX_HTML_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 15000;

const USER_AGENTS = [
  "Mozilla/5.0 (compatible; RemakePixBrandBot/1.0; +https://www.remakepix.com)",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
];

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
  u = u.replace(/^[\s\u200B]+|[\s\u200B]+$/g, "");
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function resolveAbsoluteUrl(baseUrl, maybeRelative) {
  const raw = String(maybeRelative || "").trim();
  if (!raw) return "";
  try {
    if (raw.startsWith("//")) return `https:${raw}`;
    if (/^https?:\/\//i.test(raw)) return raw;
    return new URL(raw, baseUrl).toString();
  } catch {
    return "";
  }
}

function buildFallbackSnapshot(url, reason) {
  let host = "";
  let pathHint = "";
  try {
    const parsed = new URL(url);
    host = parsed.hostname.replace(/^www\./i, "");
    pathHint = parsed.pathname.replace(/\/$/, "").split("/").filter(Boolean).slice(-2).join(" / ");
  } catch {
    host = url;
  }

  const label = host || url;
  return {
    url,
    title: label,
    description: reason || `Website ${label}`,
    og_image: "",
    theme_color: "",
    text_snippet: [
      `Brand website URL: ${url}`,
      host ? `Domain: ${host}` : "",
      pathHint ? `Path context: ${pathHint}` : "",
      reason ? `Note: ${reason}` : "",
      "Use the URL, domain name and any public brand knowledge to infer product, audience and visual identity.",
    ].filter(Boolean).join("\n"),
    fetch_limited: true,
  };
}

async function fetchHtmlOnce(url, userAgent) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWebsiteSnapshot(websiteUrl) {
  const url = normalizeUrl(websiteUrl);
  if (!url) {
    const err = new Error("URL do site inválida — usa https://exemplo.com");
    err.status = 400;
    throw err;
  }

  let lastStatus = 0;
  let lastError = null;

  for (const ua of USER_AGENTS) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetchHtmlOnce(url, ua);
      lastStatus = res.status;

      if (!res.ok) {
        if ([403, 429, 503].includes(res.status)) continue;
        if (res.status >= 400) {
          const fallback = buildFallbackSnapshot(url, `HTTP ${res.status} — leitura parcial do domínio.`);
          return enrichWebsiteSnapshot(fallback, "");
        }
      }

      // eslint-disable-next-line no-await-in-loop
      const buf = Buffer.from(await res.arrayBuffer());
      const html = buf.slice(0, MAX_HTML_BYTES).toString("utf8");
      const finalUrl = res.url || url;

      const title = decodeEntities((html.match(/<title[^>]*>([^<]{1,200})<\/title>/i) || [])[1] || "");
      const description = metaContent(html, "description")
        || metaContent(html, "og:description", "property")
        || metaContent(html, "twitter:description");
      const ogTitle = metaContent(html, "og:title", "property") || metaContent(html, "twitter:title");
      const ogImage = resolveAbsoluteUrl(finalUrl, metaContent(html, "og:image", "property")
        || metaContent(html, "twitter:image")
        || metaContent(html, "twitter:image:src"));
      const themeColor = metaContent(html, "theme-color");
      const textSnippet = stripHtml(html).slice(0, 6000);

      if (!textSnippet && !title && !description) {
        const fallback = buildFallbackSnapshot(finalUrl, "Página sem texto legível — a IA usa o domínio e metadados.");
        return enrichWebsiteSnapshot(fallback, html);
      }

      const basic = {
        url: finalUrl,
        title: ogTitle || title,
        description,
        og_image: ogImage,
        theme_color: themeColor,
        text_snippet: textSnippet,
        fetch_limited: false,
      };
      return enrichWebsiteSnapshot(basic, html);
    } catch (err) {
      lastError = err;
      if (err?.name === "AbortError") {
        lastError = new Error("timeout");
      }
    }
  }

  if (lastStatus === 403 || lastStatus === 429) {
    return enrichWebsiteSnapshot(
      buildFallbackSnapshot(
        url,
        `O site bloqueou leitura HTML (HTTP ${lastStatus}) — a leitura Jina/markdown continua.`,
      ),
      "",
    );
  }

  if (lastError?.name === "AbortError" || String(lastError?.message || "").includes("timeout")) {
    return enrichWebsiteSnapshot(
      buildFallbackSnapshot(url, "Timeout ao abrir o site — a leitura Jina/markdown continua."),
      "",
    );
  }

  return enrichWebsiteSnapshot(
    buildFallbackSnapshot(
      url,
      "HTML parcial — a leitura Jina/markdown e metadados públicos continuam.",
    ),
    "",
  );
}

module.exports = {
  fetchWebsiteSnapshot,
  normalizeUrl,
  resolveAbsoluteUrl,
};
