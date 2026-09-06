#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const token = process.env.VERCEL_TOKEN;

if (!token) {
  console.error("Missing VERCEL_TOKEN. Set it in the Grok sandbox before running this script.");
  process.exit(1);
}

const tempDir = mkdtempSync(join(tmpdir(), "remakepix-vercel-env-"));
const pulledEnvPath = join(tempDir, "production.env");

try {
  const pull = spawnSync(
    "npx",
    [
      "vercel",
      "env",
      "pull",
      pulledEnvPath,
      "--environment=production",
      "--yes",
      "--token",
      token,
      "--cwd",
      repoRoot,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  process.stdout.write(stripToken(pull.stdout, token));
  process.stderr.write(stripToken(pull.stderr, token));

  if (pull.status !== 0) {
    console.error("Failed to pull Vercel environment variables.");
    process.exit(pull.status || 1);
  }

  const pulled = parseEnv(readFileSync(pulledEnvPath, "utf8"));
  const usable = {};
  const sensitive = [];

  for (const [key, value] of Object.entries(pulled)) {
    if (value === "[SENSITIVE]") {
      sensitive.push(key);
      continue;
    }

    // Vercel OIDC tokens are deployment-scoped and should not be copied into a non-Vercel sandbox.
    if (key === "VERCEL_OIDC_TOKEN") continue;

    usable[key] = value;
  }

  const previewOverrides = {
    APP_BUILD_ID: "rp-grok-preview",
    REACT_APP_BUILD_ID: "rp-grok-preview",
    DISABLE_VERCEL_BLOB: "0",
    REACT_APP_DISABLE_VERCEL_BLOB: "0",
    RP_STORAGE_BACKEND: "blob",
    SITE_URL: "http://localhost:3000",
  };

  const merged = {
    ...usable,
    ...previewOverrides,
  };

  const criticalMissing = [
    "REPLICATE_API_TOKEN",
  ].filter((key) => !merged[key] || sensitive.includes(key));

  const optionalMissing = [
    "OPENAI_API_KEY",
    "RESEND_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ].filter((key) => !merged[key] || sensitive.includes(key));

  const output = [
    "# Created by scripts/prepare-grok-env.mjs",
    "# Local preview only. Do not commit this file.",
    ...Object.entries(merged)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${quoteEnvValue(value)}`),
    "",
    "# Add these manually in the Grok sandbox if you need full generation:",
    ...criticalMissing.map((key) => `# ${key}=<required-secret-from-provider>`),
    "",
    "# Optional integrations:",
    ...optionalMissing.map((key) => `# ${key}=<optional-secret-from-provider>`),
    "",
  ].join("\n");

  const rootEnv = join(repoRoot, ".env.local");
  const frontendEnv = join(repoRoot, "frontend", ".env.local");

  writeFileSync(rootEnv, output, { encoding: "utf8", mode: 0o600 });
  writeFileSync(frontendEnv, output, { encoding: "utf8", mode: 0o600 });

  console.log("");
  console.log("Created local preview env files:");
  console.log("- .env.local");
  console.log("- frontend/.env.local");
  console.log("");
  console.log(`Usable values copied: ${Object.keys(usable).length}`);
  console.log(`Locked/sensitive values not recoverable from Vercel: ${sensitive.length}`);

  if (criticalMissing.length) {
    console.log("");
    console.log("Still required for real generation:");
    for (const key of criticalMissing) console.log(`- ${key}`);
  }

  if (optionalMissing.length) {
    console.log("");
    console.log("Optional integrations still missing:");
    for (const key of optionalMissing) console.log(`- ${key}`);
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function stripToken(text, secret) {
  if (!text) return "";
  return text.split(secret).join("[REDACTED]");
}

function parseEnv(text) {
  const out = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value.replace(/\\n/g, "\n");
  }

  return out;
}

function quoteEnvValue(value) {
  const stringValue = String(value ?? "");
  if (/^[A-Za-z0-9_@%+=:,./-]*$/.test(stringValue)) {
    return stringValue;
  }

  return JSON.stringify(stringValue);
}
