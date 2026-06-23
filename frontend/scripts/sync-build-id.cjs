/**
 * Gera o mesmo build ID para o bundle React e para /api/health.
 * Correr antes de `craco build` (hook prebuild).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const id =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
  process.env.REACT_APP_BUILD_ID ||
  "guest-access-v1";

fs.writeFileSync(
  path.join(root, "api", "_buildId.cjs"),
  `"use strict";\nmodule.exports = ${JSON.stringify(id)};\n`,
);

fs.writeFileSync(
  path.join(root, ".env.production.local"),
  `REACT_APP_BUILD_ID=${id}\n`,
);

console.log("[sync-build-id]", id);
