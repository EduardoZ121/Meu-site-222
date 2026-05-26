#!/usr/bin/env node
/**
 * Guardrail: fail CI/deploy prep if production baseline files or anti-regression rules break.
 * Baseline commit: 457b127 (+ API routes for wizard/gallery/suggest).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const REQUIRED_FILES = [
  "frontend/src/components/SupportChat.jsx",
  "frontend/src/components/DashboardHeaderMenu.jsx",
  "frontend/src/components/StudioAccordionSection.jsx",
  "frontend/src/pages/dashboard/Admin.jsx",
  "frontend/src/pages/dashboard/Settings.jsx",
  "frontend/src/pages/dashboard/Wizard.jsx",
  "frontend/src/lib/userSettings.js",
  "frontend/src/lib/localeStrings.js",
  "frontend/api/lib/supportAssistant.cjs",
  "frontend/api/lib/promptAssist.cjs",
  "frontend/api/lib/creationsRoutes.cjs",
  "frontend/src/lib/carouselSlides.js",
];

for (const f of REQUIRED_FILES) {
  if (!exists(f)) errors.push(`Missing required file: ${f}`);
}

const adminLines = exists("frontend/src/pages/dashboard/Admin.jsx")
  ? read("frontend/src/pages/dashboard/Admin.jsx").split("\n").length
  : 0;
if (adminLines < 400) {
  errors.push(`Admin.jsx too small (${adminLines} lines) — painel completo em falta?`);
}

const BANNED_IN_FRONTEND = [
  { re: /\/app\/omni/i, msg: "Rota Omni (/app/omni) não deve voltar ao frontend" },
  { re: /PerchanceStudio/i, msg: "PerchanceStudio não deve existir" },
  { re: /PremiumGate/i, msg: "PremiumGate experimental não deve estar no frontend" },
  { re: /PromptPremiumToolbar/i, msg: "PromptPremiumToolbar não deve estar no frontend" },
];

function scanDir(dir, exts, onMatch) {
  if (!exists(dir)) return;
  for (const ent of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${ent.name}`;
    if (ent.isDirectory() && ent.name !== "node_modules" && ent.name !== "build") {
      scanDir(rel, exts, onMatch);
    } else if (ent.isFile() && exts.some((e) => ent.name.endsWith(e))) {
      onMatch(rel, read(rel));
    }
  }
}

scanDir("frontend/src", [".js", ".jsx"], (rel, content) => {
  for (const { re, msg } of BANNED_IN_FRONTEND) {
    if (re.test(content)) errors.push(`${rel}: ${msg}`);
  }
});

const appJs = exists("frontend/src/App.js") ? read("frontend/src/App.js") : "";
const routeRe = /path="([^"]+)"/g;
const appRoutes = [...appJs.matchAll(routeRe)].map((m) => m[1]);

const toolsSrc = exists("frontend/src/lib/toolsCatalogue.js")
  ? read("frontend/src/lib/toolsCatalogue.js")
  : "";
const toolRoutes = [...toolsSrc.matchAll(/to:\s*"([^"]+)"/g)].map((m) => m[1]);

for (const to of toolRoutes) {
  if (!to.startsWith("/app/")) continue;
  const suffix = to.replace(/^\/app/, "");
  const ok =
    appRoutes.includes(suffix) ||
    appRoutes.includes(to.replace(/^\//, "")) ||
    appJs.includes(`path="${suffix.slice(1)}"`);
  if (!ok) warnings.push(`toolsCatalogue route ${to} may be missing in App.js`);
}

const apiPath = exists("frontend/api/[...path].js") ? read("frontend/api/[...path].js") : "";
const API_MUST = [
  "support/chat",
  "handlePromptAssistRoute",
  "handleCreationsRoute",
  'path.startsWith("admin/")',
];
const promptAssist = exists("frontend/api/lib/promptAssist.cjs")
  ? read("frontend/api/lib/promptAssist.cjs")
  : "";
if (!promptAssist.includes("wizard/compose") || !promptAssist.includes("suggest")) {
  errors.push("promptAssist.cjs must handle wizard/compose and suggest");
}
const creationsRoutes = exists("frontend/api/lib/creationsRoutes.cjs")
  ? read("frontend/api/lib/creationsRoutes.cjs")
  : "";
if (!creationsRoutes.includes("generations/history")) {
  errors.push("creationsRoutes.cjs must handle generations/history");
}
for (const needle of API_MUST) {
  if (!apiPath.includes(needle)) errors.push(`API router missing: ${needle}`);
}
if (!read("frontend/api/lib/promptAssist.cjs") && !apiPath.includes("carousel-slide")) {
  errors.push("API must expose generate/carousel-slide");
}
const carouselJsx = read("frontend/src/pages/dashboard/Carousel.jsx");
const hasCarouselApi = carouselJsx.includes("carousel-panoramic") || carouselJsx.includes("carousel-slide");
if (!hasCarouselApi || !carouselJsx.includes("StudioAccordionSection")) {
  errors.push("Carousel.jsx must use panoramic or per-slide API and studio accordions");
}
if (!apiPath.includes("carousel-panoramic") && !apiPath.includes("carousel-slide")) {
  errors.push("API must expose generate/carousel-panoramic or carousel-slide");
}

if (!read("frontend/src/pages/dashboard/Settings.jsx").includes("set_section_account")) {
  errors.push("Settings.jsx não é a versão simplificada (conta/idioma/password)");
}

if (!read("frontend/src/components/DashboardHeaderMenu.jsx").includes("SupportChat")) {
  errors.push("DashboardHeaderMenu sem SupportChat (assistente Sofia)");
}

console.log("=== Remake Pixel — verify production baseline ===\n");
if (warnings.length) {
  console.log("Warnings:");
  warnings.forEach((w) => console.log("  ⚠", w));
  console.log("");
}
if (errors.length) {
  console.log("FAILED:\n");
  errors.forEach((e) => console.log("  ✗", e));
  process.exit(1);
}
console.log("OK — baseline structure, routes, and anti-regression checks passed.");
console.log(`  Admin.jsx: ${adminLines} lines`);
console.log(`  App routes: ${appRoutes.length}`);
console.log(`  Tool catalogue links: ${toolRoutes.length}`);
