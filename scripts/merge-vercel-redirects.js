#!/usr/bin/env node
/**
 * Funde vercel.redirects.remake.com.json em vercel.json → redirects.
 * Só corre quando REACT_APP_SITE_ORIGIN aponta para remake.com (ou FORCE=1).
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const vercelPath = path.join(root, "vercel.json");
const redirectsPath = path.join(root, "vercel.redirects.remake.com.json");

const origin = String(process.env.REACT_APP_SITE_ORIGIN || process.env.SITE_URL || "").trim();
const force = process.env.FORCE_MERGE_REMAKE_REDIRECTS === "1";

if (!force && !origin.includes("remake.com")) {
  console.log(
    "merge-vercel-redirects: skip (set REACT_APP_SITE_ORIGIN=https://www.remake.com or FORCE_MERGE_REMAKE_REDIRECTS=1)",
  );
  process.exit(0);
}

const extra = JSON.parse(fs.readFileSync(redirectsPath, "utf8"));
const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
const existing = Array.isArray(vercel.redirects) ? vercel.redirects : [];

const key = (r) => `${r.source}|${r.destination}|${JSON.stringify(r.has || [])}`;
const seen = new Set(existing.map(key));
const merged = [...existing];
for (const rule of extra) {
  const k = key(rule);
  if (!seen.has(k)) {
    merged.push(rule);
    seen.add(k);
  }
}

vercel.redirects = merged;
fs.writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`, "utf8");
console.log(`merge-vercel-redirects: ${merged.length} redirect rule(s) in vercel.json`);
