/**
 * Gera imagem Open Graph 1200×630 para partilhas (WhatsApp, Facebook, X, LinkedIn).
 * Requer: cd frontend && yarn add -D sharp
 * Uso: node scripts/generate-og-image.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "frontend", "public");
const images = path.join(root, "images");
const heroPath = path.join(images, "hero-bg.jpg");

const sharpPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "frontend",
  "node_modules",
  "sharp",
  "lib",
  "index.js",
);
const { default: sharp } = await import(pathToFileURL(sharpPath).href);

const W = 1200;
const H = 630;

const overlaySvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B0B0C" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#0B0B0C" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0B0B0C" stop-opacity="0.92"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#9333EA" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#accent)"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="80" y="280" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="120" font-weight="700" fill="#F4F1EA">R</text>
  <text x="200" y="280" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="120" font-weight="700" fill="#A855F7">.</text>
  <text x="80" y="360" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="52" font-weight="600" fill="#F4F1EA" letter-spacing="-1">Remake Pixel</text>
  <text x="80" y="430" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="36" font-weight="400" fill="#C4B5FD">Transforma ideias em arte com IA</text>
  <text x="80" y="490" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="22" font-weight="500" fill="#8A8A8E" letter-spacing="2">96 ESTILOS · VÍDEO · PÔSTERES · FERRAMENTAS PRO</text>
  <rect x="80" y="530" width="200" height="4" rx="2" fill="#7C3AED"/>
  <text x="80" y="580" font-family="ui-monospace, monospace" font-size="18" fill="#A855F7" letter-spacing="4">REMAKEPIX.COM</text>
</svg>
`;

let base;
if (fs.existsSync(heroPath)) {
  base = await sharp(heroPath).resize(W, H, { fit: "cover", position: "centre" }).toBuffer();
} else {
  base = await sharp({
    create: { width: W, height: H, channels: 3, background: { r: 11, g: 11, b: 12 } },
  })
    .png()
    .toBuffer();
}

const outJpg = path.join(root, "og-image.jpg");
const outPng = path.join(root, "og-image.png");

await sharp(base)
  .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(outJpg);

await sharp(outJpg).png().toFile(outPng);

console.log("wrote", outJpg, outPng);
