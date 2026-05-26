#!/usr/bin/env node
/**
 * Define créditos e idioma de uma conta por email.
 * Uso: MONGO_URL=... node scripts/admin-set-user-account.mjs --email user@example.com --credits 800 --lang en
 */
import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
function loadEnvFile(name) {
  const envPath = path.join(__dirname, "..", name);
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}
const useProduction = process.argv.includes("--production");
loadEnvFile(useProduction ? ".env.production.local" : ".env.local");
if (useProduction && !process.env.MONGO_URL) loadEnvFile(".env.production.local");

const { getDb, ensureIndexes, storageEnabled } = require("../api/lib/mongo.cjs");
const { upsertAccountPreset } = require("../api/lib/accountPresets.cjs");
const { setUserAccountByEmail } = require("../api/lib/usersDb.cjs");

function parseArgs(argv) {
  const out = { email: "", credits: null, lang: "en" };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--email" && argv[i + 1]) { out.email = argv[++i]; continue; }
    if (a === "--credits" && argv[i + 1]) { out.credits = Number(argv[++i]); continue; }
    if (a === "--lang" && argv[i + 1]) { out.lang = String(argv[++i]).slice(0, 2); continue; }
  }
  return out;
}

async function main() {
  const { email, credits, lang } = parseArgs(process.argv);
  if (!email) {
    console.error("Missing --email");
    process.exit(1);
  }
  if (!storageEnabled()) {
    console.error("MONGO_URL not configured");
    process.exit(1);
  }
  await ensureIndexes();
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  const variants = new Set([normalized]);
  if (normalized.includes("@gamil.com")) {
    variants.add(normalized.replace("@gamil.com", "@gmail.com"));
  }
  if (normalized.includes("@gmail.com")) {
    variants.add(normalized.replace("@gmail.com", "@gamil.com"));
  }

  const targetCredits = Number.isFinite(credits) ? Math.floor(credits) : 800;
  const targetLang = lang || "en";

  let applied = null;
  for (const em of variants) {
    // eslint-disable-next-line no-await-in-loop
    applied = await setUserAccountByEmail(em, { credits: targetCredits, lang: targetLang });
    if (applied?.user) break;
  }

  if (applied?.user) {
    console.log(JSON.stringify({
      ok: true,
      applied: "existing_user",
      email: applied.user.email,
      id: applied.user.id,
      before: applied.before,
      after: { credits: applied.user.credits, lang: applied.user.lang },
    }, null, 2));
    return;
  }

  await upsertAccountPreset(db, normalized, {
    credits: targetCredits,
    lang: targetLang,
    note: "admin CLI setup",
  });
  if (normalized.includes("@gamil.com")) {
    await upsertAccountPreset(db, normalized.replace("@gamil.com", "@gmail.com"), {
      credits: targetCredits,
      lang: targetLang,
      note: "admin CLI setup (gmail alias)",
    });
  }

  console.log(JSON.stringify({
    ok: true,
    pending: true,
    email: normalized,
    credits: targetCredits,
    lang: targetLang,
    message: "Conta ainda não registada — aplicado no primeiro login Google com este email.",
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
