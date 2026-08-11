#!/usr/bin/env node
/** Reconstrói posterTemplateCovers.js sem duplicados ig_ref */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, "..");
const MAP = path.join(FRONTEND, "src/lib/posterTemplateCovers.js");
const OUT_DIR = path.join(FRONTEND, "public/images/poster-covers");

const { PDF_RELEASE_FAMILIES } = await import(
  pathToFileURL(path.join(FRONTEND, "src/lib/posterPdfReleaseFamilies.js")).href
);

const txt = fs.readFileSync(MAP, "utf8");
const start = txt.indexOf("export const POSTER_TEMPLATE_COVER_BY_ID = {");
const end = txt.indexOf("};", start) + 2;
const footer = txt.slice(end);
const body = txt.slice(start, end);

const kept = {};
const re = /^\s*([a-zA-Z0-9_]+):\s*"([^"]+)",/gm;
let m;
while ((m = re.exec(body)) !== null) {
  if (!m[1].startsWith("ig_ref")) kept[m[1]] = m[2];
}

for (const f of fs.readdirSync(OUT_DIR).filter((x) => x.startsWith("ig_ref") && x.endsWith(".jpg")).sort()) {
  kept[f.replace(".jpg", "")] = `/images/poster-covers/${f}`;
}

for (const fam of PDF_RELEASE_FAMILIES) {
  const classic = `${fam.id}__classic`;
  if (kept[classic]) kept[fam.id] = kept[classic];
  else {
    const first = fam.variants?.[0]?.key;
    const id = first ? `${fam.id}__${first}` : null;
    if (id && kept[id]) kept[fam.id] = kept[id];
  }
}

const lines = Object.entries(kept)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([k, v]) => `  ${k}: "${v}",`);

const header = txt.slice(0, start);
const newFile = `${header}export const POSTER_TEMPLATE_COVER_BY_ID = {\n${lines.join("\n")}\n};${footer}`;
fs.writeFileSync(MAP, newFile);
console.log(`Rebuilt: ${lines.length} entries (${fs.readdirSync(OUT_DIR).filter((x) => x.startsWith("ig_ref")).length} ig_ref JPGs)`);
