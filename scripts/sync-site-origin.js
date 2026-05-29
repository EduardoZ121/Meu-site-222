#!/usr/bin/env node
/**
 * Injeta REACT_APP_SITE_ORIGIN e marca no index.html antes do build CRA.
 * Uso: REACT_APP_SITE_ORIGIN=https://www.remake.com node scripts/sync-site-origin.js
 */

const fs = require("fs");
const path = require("path");

const origin = String(process.env.REACT_APP_SITE_ORIGIN || "").trim().replace(/\/$/, "");
if (!origin) {
  console.log("sync-site-origin: skip (set REACT_APP_SITE_ORIGIN=https://www.remake.com)");
  process.exit(0);
}
const brand = String(process.env.REACT_APP_BRAND_NAME || "Remake").trim() || "Remake";
const brandFull = String(
  process.env.REACT_APP_BRAND_FULL_NAME || `${brand} — Estúdio AI de imagem e vídeo`,
).trim();
const description =
  process.env.REACT_APP_SITE_DESCRIPTION ||
  "Gera, edita e cria imagens com IA. 96 estilos, pôsteres, vídeo e ferramentas Pro — créditos simples, sem mensalidade obrigatória.";

const indexPath = path.join(__dirname, "../frontend/public/index.html");
let html = fs.readFileSync(indexPath, "utf8");

const replacements = [
  [/https:\/\/remakepix\.com\/?/g, `${origin}/`],
  [/content="https:\/\/remakepix\.com[^"]*"/g, (m) => m.replace(/https:\/\/remakepix\.com[^"]*/, `${origin}/`)],
  [/Remake Pixel — Estúdio AI de imagem e vídeo/g, brandFull],
  [/Remake Pixel — estúdio criativo com IA/g, `${brand} — estúdio criativo com IA`],
  [/content="Remake Pixel"/g, `content="${brand}"`],
  [/property="og:site_name" content="[^"]*"/, `property="og:site_name" content="${brand}"`],
];

for (const [pattern, repl] of replacements) {
  html = html.replace(pattern, repl);
}

if (!html.includes('rel="canonical"')) {
  console.warn("sync-site-origin: canonical link not found");
}

fs.writeFileSync(indexPath, html, "utf8");
console.log(`sync-site-origin: ${indexPath} → origin=${origin}, brand=${brand}`);
