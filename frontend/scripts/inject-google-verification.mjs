#!/usr/bin/env node
/**
 * Injeta google-site-verification em public/index.html quando
 * REACT_APP_GOOGLE_SITE_VERIFICATION está definida (ex.: Vercel env).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "../public/index.html");

const token = String(process.env.REACT_APP_GOOGLE_SITE_VERIFICATION || "").trim();
if (!token) {
  process.exit(0);
}

if (!fs.existsSync(indexPath)) {
  console.error("inject-google-verification: index.html not found");
  process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");
const meta = `<meta name="google-site-verification" content="${token.replace(/"/g, "")}" />`;

if (html.includes("google-site-verification")) {
  html = html.replace(/<meta name="google-site-verification"[^>]*\s*\/?>/i, meta);
} else {
  html = html.replace(/<head>/i, `<head>\n        ${meta}`);
}

fs.writeFileSync(indexPath, html);
console.log("inject-google-verification: meta tag added to index.html");
