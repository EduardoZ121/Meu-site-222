#!/usr/bin/env node
/**
 * Converte placeholders literais ("BURGERS ARTESANAIS") em chaves estáveis (line_1, headline…)
 * e grava o texto original em template.replacements para o prompt continuar a funcionar.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);

const { FALLBACK_POSTER_TEMPLATES } = require("../frontend/src/lib/posterFallbacks.js");

function isSemanticKey(p) {
  return /^[a-z][a-z0-9_]*$/i.test(p) && p.length <= 40 && !/[À-úÁÉÍÓÚãõçÂÊÔ]/.test(p);
}

function migrateTemplate(tpl) {
  const replacements = { ...(tpl.replacements || {}) };
  const placeholders = [];

  for (let i = 0; i < (tpl.placeholders || []).length; i += 1) {
    const original = tpl.placeholders[i];
    const key = isSemanticKey(original) ? original : `line_${i + 1}`;
    placeholders.push(key);
    if (original && original !== key) {
      replacements[key] = original;
    } else if (original && !replacements[key]) {
      replacements[key] = original;
    }
  }

  return { ...tpl, placeholders, replacements };
}

const migrated = FALLBACK_POSTER_TEMPLATES.map(migrateTemplate);

const modelsBlock = `
export const FALLBACK_POSTER_MODELS = [
  {
    "key": "grok",
    "label": "Motor Rápido",
    "cost": 24,
    "tier": "fast",
    "supports_photo": true,
    "tag": "Padrão · rápido"
  },
  {
    "key": "flux2",
    "label": "Motor Pro",
    "cost": 32,
    "tier": "pro",
    "supports_photo": true,
    "tag": "Foto-realista"
  },
  {
    "key": "gpt_image",
    "label": "Motor Premium",
    "cost": 45,
    "tier": "premium",
    "supports_photo": true,
    "tag": "Qualidade Máxima"
  }
];
`;

const jsOut = `// Generated/migrated — stable placeholder keys + replacements for i18n labels.
export const FALLBACK_POSTER_TEMPLATES = ${JSON.stringify(migrated, null, 2)};
${modelsBlock}`;

const jsPath = path.join(root, "frontend/src/lib/posterFallbacks.js");
fs.writeFileSync(jsPath, jsOut);

const jsonPath = path.join(root, "frontend/api/lib/posterTemplatesData.json");
fs.writeFileSync(jsonPath, `${JSON.stringify(migrated)}\n`);

console.log(`Migrated ${migrated.length} templates → ${jsPath} and ${jsonPath}`);
