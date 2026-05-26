/**
 * Gera PNG/ICO do mark R. a partir de public/favicon.svg
 * Requer: cd frontend && yarn add -D sharp
 * Uso: node scripts/generate-favicon.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "frontend", "public");
const svg = fs.readFileSync(path.join(root, "favicon.svg"));

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

const sizes = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(path.join(root, name));
  console.log("wrote", name);
}

fs.copyFileSync(path.join(root, "favicon-32x32.png"), path.join(root, "favicon.ico"));
console.log("wrote favicon.ico");
