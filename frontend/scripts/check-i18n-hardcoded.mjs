#!/usr/bin/env node
/**
 * Scans JSX/TSX for likely hardcoded UI strings (PT diacritics or common EN phrases in JSX text).
 * Run: node scripts/check-i18n-hardcoded.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "../src");

const SKIP_DIRS = new Set(["node_modules", "build", "lib/catalogueLocales.js", "lib/posterFieldLocales.js", "lib/artisticStudioLocales.js", "lib/wizardData.js", "lib/billingLocales.js", "lib/carouselLocales.js", "lib/i18n.jsx"]);

const PT_RE = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/;
const JSX_TEXT_RE = />([^<{][^<]*?)</g;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const rel = path.relative(SRC, p);
    if (SKIP_DIRS.has(rel) || rel.includes("Locales")) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(jsx|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const issues = [];
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, "utf8");
  let m;
  JSX_TEXT_RE.lastIndex = 0;
  while ((m = JSX_TEXT_RE.exec(text))) {
    const chunk = m[1].trim();
    if (!chunk || chunk.length < 4) continue;
    if (/^\{/.test(chunk)) continue;
    if (/^[\d\s%.,:;!?+\-/]+$/.test(chunk)) continue;
    if (PT_RE.test(chunk) || /^(Generate|Credits|Loading|Settings|Posters|Back to)/i.test(chunk)) {
      const line = text.slice(0, m.index).split("\n").length;
      issues.push({ file: path.relative(process.cwd(), file), line, text: chunk.slice(0, 80) });
    }
  }
}

if (issues.length === 0) {
  console.log("No obvious hardcoded UI strings found.");
  process.exit(0);
}

console.log(`Found ${issues.length} potential hardcoded strings:\n`);
for (const i of issues.slice(0, 80)) {
  console.log(`${i.file}:${i.line}  ${i.text}`);
}
if (issues.length > 80) console.log(`… and ${issues.length - 80} more`);
process.exit(1);
