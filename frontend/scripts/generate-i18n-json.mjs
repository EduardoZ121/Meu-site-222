#!/usr/bin/env node
/**
 * Generates src/i18n/*.json from legacy locale modules.
 * Run: yarn generate:i18n
 */
import { createRequire } from "module";
createRequire(import.meta.url)("sucrase/register");

import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, "../src");

const requireFromSrc = createRequire(path.join(srcRoot, "package.json"));
const { createMergedDict } = requireFromSrc("./lib/createMergedDict.js");
const { nestTranslations } = requireFromSrc("./i18n/nestTranslations.js");

const dicts = createMergedDict();

for (const lang of ["en", "pt", "es", "fr"]) {
  const flat = dicts[lang] || dicts.en;
  const translation = nestTranslations(flat);
  const outPath = path.join(srcRoot, "i18n", `${lang}.json`);
  writeFileSync(outPath, `${JSON.stringify({ translation }, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outPath} (${Object.keys(flat).length} flat keys)`);
}
