/**
 * Smoke test produção — auth admin via JWT local, galeria, analyze + 1 anúncio BC.
 * Uso: node scripts/smoke-prod-brand-campaign.mjs [--skip-generate]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://www.remakepix.com/api";
const skipGenerate = process.argv.includes("--skip-generate");

function loadEnv(file) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 1) continue;
    const k = trimmed.slice(0, i);
    let v = trimmed.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(".env.smoke.tmp");
loadEnv(".env.production.local");
loadEnv(".env.local");

const { signSession, verifySessionToken } = require(path.join(root, "api/lib/sessionToken.cjs"));
const { getDb } = require(path.join(root, "api/lib/mongo.cjs"));

const ADMIN_EMAILS = [
  "eduardozola1998@gmail.com",
  "eduardozola121998@gmail.com",
  "eduardozola11998@gmail.com",
];

function log(step, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${step}${detail ? ` — ${detail}` : ""}`);
}

async function apiFetch(pathname, { method = "GET", token, body, headers = {}, timeoutMs = 120000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}/${pathname.replace(/^\//, "")}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body,
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text.slice(0, 200) };
    }
    return { status: res.status, data };
  } finally {
    clearTimeout(t);
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const report = { passed: 0, failed: 0, warnings: [] };

  // 1) Health
  const health = await apiFetch("health", { timeoutMs: 30000 });
  const healthOk = health.status === 200 && health.data?.ok;
  log("API /health", healthOk, healthOk ? `build=${health.data.build}` : String(health.status));
  healthOk ? (report.passed += 1) : (report.failed += 1);

  // 2) Admin user from Mongo
  const db = await getDb();
  if (!db) {
    log("MongoDB", false, "MONGO_URL em falta");
    process.exit(1);
  }
  const admin = await db.collection("users").findOne({
    email: { $in: ADMIN_EMAILS },
  });
  if (!admin?.id) {
    log("Admin user in DB", false, "nenhum admin encontrado");
    process.exit(1);
  }
  log("Admin user in DB", true, `${admin.email} credits=${admin.credits ?? "?"}`);
  report.passed += 1;

  const token = signSession({
    id: admin.id,
    email: admin.email,
    role: admin.role || "admin",
    name: admin.name || "Smoke",
  });
  const selfVerify = verifySessionToken(token);
  log("JWT sign/verify local", Boolean(selfVerify?.id), selfVerify?.id || "");
  selfVerify?.id ? (report.passed += 1) : (report.failed += 1);

  // 3) auth/me on production
  const me = await apiFetch("auth/me", { token });
  const meOk = me.status === 200 && me.data?.id === admin.id;
  log("GET /auth/me (prod)", meOk, meOk ? `credits=${me.data.credits}` : me.data?.detail || me.status);
  meOk ? (report.passed += 1) : (report.failed += 1);
  if (!meOk) {
    console.log("\n>>> Sessão rejeitada em produção — RP_SESSION_SECRET não coincide com Vercel.");
    process.exit(1);
  }

  // 4) Gallery history before
  const histBefore = await apiFetch("generations/history?limit=5", { token });
  const histBeforeOk = histBefore.status === 200 && Array.isArray(histBefore.data?.creations);
  const countBefore = histBeforeOk ? histBefore.data.creations.length : -1;
  log("GET /generations/history", histBeforeOk, `${countBefore} recent (sample)`);
  histBeforeOk ? (report.passed += 1) : (report.failed += 1);

  // 5) Repair (gallery sync)
  const repair = await apiFetch("generations/repair", { method: "POST", token, timeoutMs: 60000 });
  const repairOk = repair.status === 200;
  log("POST /generations/repair", repairOk, repairOk ? `repaired=${repair.data?.repaired ?? 0}` : repair.data?.detail);
  repairOk ? (report.passed += 1) : (report.failed += 1);

  // 6) Brand campaign config
  const cfg = await apiFetch("brand-campaign/config", { token });
  log("GET /brand-campaign/config", cfg.status === 200, cfg.status === 200 ? "ok" : cfg.data?.detail);
  cfg.status === 200 ? (report.passed += 1) : (report.failed += 1);

  if (skipGenerate) {
    console.log("\n--- skip-generate: analyze + batch omitidos ---");
    console.log(`RESULT: ${report.passed} passed, ${report.failed} failed`);
    process.exit(report.failed ? 1 : 0);
  }

  // 7) Analyze (website only — sem upload)
  const analyzeFd = new FormData();
  analyzeFd.append("website_url", "https://www.remakepix.com");
  analyzeFd.append("lang", "pt");
  const analyze = await apiFetch("brand-campaign/analyze", {
    method: "POST",
    token,
    body: analyzeFd,
    timeoutMs: 180000,
  });
  const brief = analyze.data?.brief;
  const analyzeOk = analyze.status === 200 && brief?.concepts?.length;
  log("POST /brand-campaign/analyze", analyzeOk, analyzeOk ? `${brief.concepts.length} concepts` : analyze.data?.detail || analyze.status);
  analyzeOk ? (report.passed += 1) : (report.failed += 1);
  if (!analyzeOk) {
    console.log(`\nRESULT: ${report.passed} passed, ${report.failed} failed`);
    process.exit(1);
  }

  // 8) Generate 1 ad (batch)
  const genFd = new FormData();
  genFd.append("brief", JSON.stringify(brief));
  genFd.append("output_count", "1");
  genFd.append("aspect_ratio", "4:5");
  genFd.append("lang", "pt");
  genFd.append("style_category", "general");
  genFd.append("style_preset", "auto");
  if (admin.email) genFd.append("notify_email", admin.email);

  const batch = await apiFetch("generate/brand-campaign-batch", {
    method: "POST",
    token,
    body: genFd,
    timeoutMs: 780000,
  });
  const batchOk = batch.status === 200;
  const results = batch.data?.results || [];
  const errors = batch.data?.errors || [];
  const pending = batch.data?.pending || [];
  log(
    "POST /generate/brand-campaign-batch (1 ad)",
    batchOk && (results.length > 0 || pending.length > 0),
    batchOk
      ? `ok=${results.length} pending=${pending.length} err=${errors.length} spent=${batch.data?.credits_spent ?? "?"}`
      : batch.data?.detail || batch.status,
  );
  if (!batchOk || (results.length === 0 && pending.length === 0 && errors.length > 0)) {
    report.failed += 1;
    if (errors[0]?.error) report.warnings.push(errors[0].error);
  } else {
    report.passed += 1;
  }

  // 9) Poll pending jobs
  const toPoll = [
    ...results.map((r) => r.prediction_id).filter(Boolean),
    ...pending.map((p) => p.prediction_id).filter(Boolean),
  ];
  const uniquePoll = [...new Set(toPoll)];
  for (const pid of uniquePoll) {
    let done = false;
    for (let i = 0; i < 120 && !done; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const poll = await apiFetch(`predictions/${pid}?lang=pt`, { token, timeoutMs: 60000 });
      const st = poll.data?.status;
      if (st === "succeeded" || st === "failed") {
        log(`Poll ${pid}`, st === "succeeded", st === "succeeded" ? "succeeded" : poll.data?.error || st);
        st === "succeeded" ? (report.passed += 1) : (report.failed += 1);
        done = true;
        break;
      }
      // eslint-disable-next-line no-await-in-loop
      await sleep(5000);
    }
    if (!done) {
      log(`Poll ${pid}`, false, "timeout 10min");
      report.failed += 1;
    }
  }

  // 10) Repair + gallery after
  await apiFetch("generations/repair", { method: "POST", token, timeoutMs: 60000 });
  const histAfter = await apiFetch("generations/history?limit=10", { token });
  const afterList = histAfter.data?.creations || [];
  const bcRecent = afterList.filter(
    (c) => /campanha|brand|on-brand/i.test(String(c.model_used || c.type || c.prompt || "")),
  );
  log("Gallery after generate", histAfter.status === 200, `${afterList.length} recent, ${bcRecent.length} BC-like`);

  // 11) DB: completed pending without creation?
  const recentPending = await db
    .collection("pending_predictions")
    .find({ user_id: admin.id })
    .sort({ created_at: -1 })
    .limit(5)
    .toArray();
  let orphanCompleted = 0;
  for (const p of recentPending) {
    if (p.status !== "completed") continue;
    // eslint-disable-next-line no-await-in-loop
    const cre = await db.collection("creations").findOne({ id: p.id });
    if (!cre) orphanCompleted += 1;
  }
  log("DB pending→creation sync", orphanCompleted === 0, orphanCompleted ? `${orphanCompleted} completed sem creation` : "ok");
  orphanCompleted === 0 ? (report.passed += 1) : (report.failed += 1);

  // 12) ROUTING_EPOCH in bundle
  try {
    const indexHtml = await fetch("https://www.remakepix.com/app/brand-campaign").then((r) => r.text());
    const jsMatch = indexHtml.match(/\/static\/js\/main\.[a-f0-9]+\.js/);
    if (jsMatch) {
      const jsUrl = `https://www.remakepix.com${jsMatch[0]}`;
      const js = await fetch(jsUrl).then((r) => r.text());
      const epochOk = js.includes("gallery-s3-bell-v16");
      log("ROUTING_EPOCH in prod bundle", epochOk, epochOk ? "gallery-s3-bell-v16" : "NOT FOUND");
      epochOk ? (report.passed += 1) : (report.failed += 1);
    } else {
      log("ROUTING_EPOCH check", false, "main.js hash not found in HTML");
      report.failed += 1;
    }
  } catch (e) {
    log("ROUTING_EPOCH check", false, e.message);
    report.failed += 1;
  }

  console.log("\n========== SMOKE SUMMARY ==========");
  console.log(`Passed: ${report.passed}  Failed: ${report.failed}`);
  if (report.warnings.length) console.log("Warnings:", report.warnings.join("; "));
  console.log("===================================\n");
  process.exit(report.failed ? 1 : 0);
}

main().catch((e) => {
  console.error("SMOKE CRASH", e.message);
  process.exit(1);
});
