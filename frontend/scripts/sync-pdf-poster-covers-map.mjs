#!/usr/bin/env node
/** Sincroniza capas ig_ref_* existentes → posterTemplateCovers.js */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, "..");
const OUT_DIR = path.join(FRONTEND, "public/images/poster-covers");
const COVERS_MAP = path.join(FRONTEND, "src/lib/posterTemplateCovers.js");

async function main() {
  const files = (await fs.readdir(OUT_DIR)).filter((f) => f.startsWith("ig_ref") && f.endsWith(".jpg"));
  let txt = await fs.readFile(COVERS_MAP, "utf8");
  const lines = [];
  for (const f of files.sort()) {
    const id = f.replace(/\.jpg$/, "");
    if (txt.includes(`"${id}"`)) continue;
    lines.push(`  ${id}: "/images/poster-covers/${f}",`);
  }
  const families = [...new Set(files.map((f) => f.replace(/__.*\.jpg$/, "")))].sort();
  for (const fam of families) {
    if (txt.includes(`"${fam}"`)) continue;
    const classic = `${fam}__classic.jpg`;
    const pick = files.includes(classic)
      ? `${fam}__classic`
      : files.find((x) => x.startsWith(`${fam}__`))?.replace(".jpg", "");
    if (pick) lines.push(`  ${fam}: "/images/poster-covers/${pick}.jpg",`);
  }
  if (!lines.length) {
    console.log("Nada a sincronizar");
    return;
  }
  txt = txt.replace(
    "export const POSTER_TEMPLATE_COVER_BY_ID = {",
    `export const POSTER_TEMPLATE_COVER_BY_ID = {\n${lines.join("\n")}`,
  );
  await fs.writeFile(COVERS_MAP, txt);
  console.log(`+${lines.length} entradas (${files.length} ficheiros ig_ref)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
