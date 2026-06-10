#!/usr/bin/env node
/**
 * Quick SEO sanity check for remakepix.com (or BASE_URL).
 * Usage: node scripts/verify-seo.mjs
 */
const BASE = process.env.BASE_URL || "https://remakepix.com";

async function check(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "";
  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1]
    || "";
  const hasJsonLd = html.includes("application/ld+json");
  return { url, status: res.status, title, desc: desc.slice(0, 80), hasJsonLd };
}

async function main() {
  console.log(`SEO check — ${BASE}\n`);
  for (const path of ["/", "/robots.txt", "/sitemap.xml", "/discover"]) {
    const r = await check(path);
    console.log(r.url);
    console.log(`  status: ${r.status}`);
    if (path.endsWith(".txt") || path.endsWith(".xml")) {
      const body = await (await fetch(`${BASE}${path}`)).text();
      console.log(`  body: ${body.slice(0, 120).replace(/\n/g, " ")}…`);
    } else {
      console.log(`  title: ${r.title}`);
      console.log(`  description: ${r.desc}…`);
      console.log(`  JSON-LD in HTML: ${r.hasJsonLd}`);
    }
    console.log();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
