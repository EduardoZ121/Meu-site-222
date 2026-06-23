/**
 * Deep site reading — markdown via Jina Reader + HTML structure extraction.
 */

const JINA_TIMEOUT_MS = 22000;
const MAX_MARKDOWN = 14000;

function decodeEntities(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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

function stripTags(html) {
  return decodeEntities(String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractHeadings(html) {
  const out = [];
  const re = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html)) && out.length < 24) {
    const text = stripTags(m[1]).slice(0, 200);
    if (text.length > 2) out.push({ level: Number(m[1]), text });
  }
  return out;
}

function extractButtonsAndCtas(html) {
  const out = new Set();
  const patterns = [
    /<button[^>]*>([\s\S]*?)<\/button>/gi,
    /<a[^>]+class=["'][^"']*(?:btn|button|cta)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
    /<a[^>]+role=["']button["'][^>]*>([\s\S]*?)<\/a>/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) && out.size < 20) {
      const text = stripTags(m[1]).slice(0, 120);
      if (text.length > 2 && text.length < 80) out.add(text);
    }
  }
  return [...out];
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) && blocks.length < 8) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch {
      /* skip */
    }
  }
  return blocks;
}

function walkJsonLd(node, acc) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((n) => walkJsonLd(n, acc));
    return;
  }
  if (typeof node !== "object") return;

  const type = String(node["@type"] || "").toLowerCase();
  if (type.includes("product") || type.includes("offer") || type.includes("organization") || type.includes("brand")) {
    if (node.name) acc.product_names.push(String(node.name).slice(0, 160));
    if (node.description) acc.descriptions.push(String(node.description).slice(0, 400));
    if (node.brand?.name) acc.brand_names.push(String(node.brand.name).slice(0, 120));
    if (node.offers?.price || node.price) {
      const p = node.offers?.price || node.price;
      const cur = node.offers?.priceCurrency || node.priceCurrency || "";
      acc.prices.push(`${cur} ${p}`.trim());
    }
    if (node.image) {
      const imgs = Array.isArray(node.image) ? node.image : [node.image];
      imgs.forEach((img) => {
        const u = typeof img === "string" ? img : img?.url || img?.contentUrl;
        if (u) acc.product_images.push(String(u));
      });
    }
  }
  Object.values(node).forEach((v) => walkJsonLd(v, acc));
}

function extractFromJsonLd(blocks) {
  const acc = { product_names: [], descriptions: [], brand_names: [], prices: [], product_images: [] };
  blocks.forEach((b) => walkJsonLd(b, acc));
  return {
    product_names: [...new Set(acc.product_names)].slice(0, 12),
    descriptions: [...new Set(acc.descriptions)].slice(0, 6),
    brand_names: [...new Set(acc.brand_names)].slice(0, 4),
    prices: [...new Set(acc.prices)].slice(0, 8),
    product_images: [...new Set(acc.product_images)].slice(0, 12),
  };
}

function extractHexColors(html) {
  const colors = new Set();
  const re = /#([0-9a-fA-F]{6})\b/g;
  let m;
  while ((m = re.exec(html)) && colors.size < 16) {
    colors.add(`#${m[1].toLowerCase()}`);
  }
  return [...colors];
}

function scoreImageUrl(url) {
  const u = String(url || "").toLowerCase();
  let score = 0;
  if (/product|produto|item|pack|hero|gallery|main|featured/.test(u)) score += 3;
  if (/logo|icon|favicon|sprite|pixel|1x1|avatar|badge/.test(u)) score -= 4;
  if (/\.(svg|gif)(\?|$)/.test(u)) score -= 3;
  if (/\.(jpg|jpeg|webp|png)(\?|$)/.test(u)) score += 2;
  if (/width=(\d+)/.test(u)) {
    const w = Number(u.match(/width=(\d+)/)[1]);
    if (w > 0 && w < 120) score -= 3;
    if (w >= 400) score += 2;
  }
  return score;
}

function extractPageImages(html, baseUrl) {
  const candidates = new Set();
  const patterns = [
    /<img[^>]+src=["']([^"']+)["']/gi,
    /<img[^>]+data-src=["']([^"']+)["']/gi,
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) && candidates.size < 40) {
      const abs = resolveAbsoluteUrl(baseUrl, m[1]);
      if (abs && /^https:\/\//i.test(abs)) candidates.add(abs);
    }
  }
  return [...candidates]
    .map((url) => ({ url, score: scoreImageUrl(url) }))
    .filter((x) => x.score > -2)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.url)
    .slice(0, 12);
}

async function fetchJinaMarkdown(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JINA_TIMEOUT_MS);
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/markdown",
        "User-Agent": "RemakePixBrandIntel/1.0",
      },
    });
    if (!res.ok) return "";
    const md = await res.text();
    return String(md || "").trim().slice(0, MAX_MARKDOWN);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function buildMarketingCopy({ headings, ctas, jsonLdData, markdown, title, description }) {
  const lines = [];
  if (title) lines.push(`Site title: ${title}`);
  if (description) lines.push(`Meta description: ${description}`);
  if (jsonLdData.brand_names.length) lines.push(`Brand (structured data): ${jsonLdData.brand_names.join(", ")}`);
  if (jsonLdData.product_names.length) lines.push(`Products: ${jsonLdData.product_names.join(" | ")}`);
  if (jsonLdData.prices.length) lines.push(`Prices: ${jsonLdData.prices.join(" | ")}`);
  if (headings.length) {
    lines.push("Headlines on page:");
    headings.slice(0, 10).forEach((h) => lines.push(`- H${h.level}: ${h.text}`));
  }
  if (ctas.length) lines.push(`CTAs: ${ctas.join(" | ")}`);
  if (jsonLdData.descriptions.length) {
    lines.push("Product copy:");
    jsonLdData.descriptions.slice(0, 3).forEach((d) => lines.push(`- ${d}`));
  }
  if (markdown) {
    lines.push("Page content (markdown excerpt):");
    lines.push(markdown.slice(0, 5000));
  }
  return lines.join("\n").slice(0, 9000);
}

async function enrichWebsiteSnapshot(snapshot, html) {
  const baseUrl = snapshot.url;
  const headings = html ? extractHeadings(html) : [];
  const ctas = html ? extractButtonsAndCtas(html) : [];
  const jsonLd = html ? extractJsonLdBlocks(html) : [];
  const jsonLdData = extractFromJsonLd(jsonLd);
  const colorsFound = html ? extractHexColors(html) : [];
  const pageImages = html ? extractPageImages(html, baseUrl) : [];

  const jinaMarkdown = await fetchJinaMarkdown(baseUrl);

  const productImages = [
    ...new Set([
      ...(snapshot.og_image ? [snapshot.og_image] : []),
      ...jsonLdData.product_images.map((u) => resolveAbsoluteUrl(baseUrl, u)),
      ...pageImages,
    ].filter(Boolean)),
  ].slice(0, 12);

  const marketingCopy = buildMarketingCopy({
    headings,
    ctas,
    jsonLdData,
    markdown: jinaMarkdown,
    title: snapshot.title,
    description: snapshot.description,
  });

  return {
    ...snapshot,
    page_markdown: jinaMarkdown,
    headings,
    ctas,
    json_ld: jsonLd.slice(0, 4),
    product_names: jsonLdData.product_names,
    prices: jsonLdData.prices,
    colors_found: colorsFound,
    product_images: productImages,
    marketing_copy: marketingCopy,
    read_method: jinaMarkdown ? "html+jina" : (html ? "html" : "fallback"),
  };
}

module.exports = {
  enrichWebsiteSnapshot,
  fetchJinaMarkdown,
  extractPageImages,
};
