#!/usr/bin/env node
/**
 * Fail if forbidden duplicate / old-site paths exist in repo root.
 */
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const forbidden = [
  "components",
  "images",
  "hero-bg.jpg",
  "index.html",
  "craco.config.js",
  "jsconfig.json",
  "postcss.config.js",
  "tailwind.config.js",
  "components.json",
  "frontend-completo.zip",
  "api.symlink.txt",
  "src",
];

const required = [
  "frontend/package.json",
  "frontend/src/App.js",
  "frontend/public/index.html",
  "frontend/public/images/hero-bg.jpg",
  "vercel.json",
];

let failed = false;

for (const name of forbidden) {
  if (fs.existsSync(path.join(root, name))) {
    console.error(`FORBIDDEN: ${name} (old/duplicate site — remove)`);
    failed = true;
  }
}

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    failed = true;
  }
}

if (fs.existsSync(path.join(root, "frontend/node_modules"))) {
  const nmInGit = false; // checked separately via git
}

const pagesDir = path.join(root, "frontend/src/pages");
if (fs.existsSync(pagesDir)) {
  const count = walk(pagesDir).filter((f) => f.endsWith(".jsx")).length;
  if (count < 20) {
    console.error(`WARN: only ${count} page components in frontend/src/pages`);
  } else {
    console.log(`OK: ${count} page files in frontend/src/pages`);
  }
}

if (failed) {
  process.exit(1);
}
console.log("verify-single-site: OK — repo structure is canonical.");

function walk(dir) {
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}
