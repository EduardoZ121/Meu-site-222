#!/usr/bin/env node
/**
 * Visual UI audit — scroll each section at desktop + mobile, detect layout issues.
 * Uses local demo session (no real API).
 */
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { injectDemoSessionLoggedIn, sleep } from "./demo-recording-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "artifacts", "ui-audit");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/discover", "/explore"];

const APP_ROUTES = [
  { path: "/app/tools", name: "tools-hub" },
  { path: "/app/generate", name: "generate" },
  { path: "/app/pro", name: "pro" },
  { path: "/app/artistic", name: "artistic" },
  { path: "/app/posters", name: "posters" },
  { path: "/app/video", name: "video" },
  { path: "/app/manga-studio", name: "manga" },
  { path: "/app/wizard", name: "wizard" },
  { path: "/app/tools/bg-remove", name: "bg-remove" },
  { path: "/app/tools/upscale", name: "upscale" },
  { path: "/app/tools/restore", name: "restore" },
  { path: "/app/tools/colorize", name: "colorize" },
  { path: "/app/tools/inpaint", name: "inpaint" },
  { path: "/app/tools/clothes", name: "clothes" },
  { path: "/app/gallery", name: "gallery" },
  { path: "/app/settings", name: "settings" },
  { path: "/app/billing", name: "billing" },
];

async function waitForServer(url, maxMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => { res.resume(); resolve(res.statusCode); });
        req.on("error", reject);
        req.setTimeout(4000, () => req.destroy(new Error("timeout")));
      });
      return;
    } catch {
      await sleep(1500);
    }
  }
  throw new Error(`Server not ready: ${url}`);
}

/** Detect elements clipped by overflow or overlapping fixed bars. */
async function collectLayoutIssues(page, label) {
  return page.evaluate(({ pageLabel }) => {
    const issues = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const fixedEls = [...document.querySelectorAll("*")].filter((el) => {
      const s = getComputedStyle(el);
      return (s.position === "fixed" || s.position === "sticky") && el.offsetHeight > 0;
    });
    const fixedBottom = fixedEls
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom >= vh - 4 && r.height > 40;
      })
      .map((el) => el.getBoundingClientRect().height);
    const bottomInset = fixedBottom.length ? Math.max(...fixedBottom) : 0;

    const skipTags = new Set(["HTML", "BODY", "MAIN", "DIV", "SECTION", "ARTICLE", "NAV", "HEADER", "FOOTER"]);
    const candidates = [...document.querySelectorAll("button, a, input, textarea, select, [data-testid]")];

    for (const el of candidates) {
      if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      if (r.bottom < 0 || r.top > vh) continue;

      // Clipped horizontally
      if (r.right > vw + 2) {
        issues.push({
          type: "overflow-x",
          page: pageLabel,
          tag: el.tagName,
          testId: el.getAttribute("data-testid") || "",
          text: (el.textContent || "").trim().slice(0, 60),
          right: Math.round(r.right),
          vw,
        });
      }

      // Hidden behind bottom fixed CTA
      if (bottomInset > 60 && r.bottom > vh - bottomInset + 8 && r.top < vh) {
        const testId = el.getAttribute("data-testid") || "";
        if (/create|generate|btn|cta/i.test(testId) || el.tagName === "BUTTON") {
          issues.push({
            type: "behind-fixed-cta",
            page: pageLabel,
            tag: el.tagName,
            testId,
            text: (el.textContent || "").trim().slice(0, 60),
            bottom: Math.round(r.bottom),
            vh,
            inset: Math.round(bottomInset),
          });
        }
      }
    }

    // Horizontal scroll on body
    const doc = document.documentElement;
    if (doc.scrollWidth > vw + 8) {
      issues.push({
        type: "horizontal-scroll",
        page: pageLabel,
        scrollWidth: doc.scrollWidth,
        vw,
      });
    }

    // Empty broken headings
    for (const h of document.querySelectorAll("h1, h2")) {
      const t = (h.textContent || "").trim();
      if (!t || t === "undefined" || /^[a-z_]+$/.test(t)) {
        issues.push({ type: "empty-heading", page: pageLabel, tag: h.tagName, text: t });
      }
    }

    // i18n key leaks (underscore keys visible)
    const bodyText = document.body?.innerText || "";
    const keyLeak = bodyText.match(/\b[a-z]+_[a-z_]{8,}\b/g);
    if (keyLeak) {
      const uniq = [...new Set(keyLeak)].slice(0, 5);
      issues.push({ type: "i18n-key-leak", page: pageLabel, keys: uniq });
    }

    return issues;
  }, { pageLabel: label });
}

async function auditRoute(page, route, viewportName) {
  const url = `${BASE}${route.path}`;
  await page.setViewportSize(viewportName === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => page.goto(url, { waitUntil: "domcontentloaded" }));
  await sleep(1200);

  const dir = path.join(OUT, viewportName, route.name);
  await fs.mkdir(dir, { recursive: true });

  await page.screenshot({ path: path.join(dir, "top.png"), fullPage: false });

  // Scroll in steps
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = viewportName === "mobile" ? 844 : 900;
  const steps = Math.min(8, Math.ceil(scrollHeight / (vh * 0.7)));
  const allIssues = [];

  for (let i = 0; i <= steps; i += 1) {
    const y = Math.min(scrollHeight, Math.round((scrollHeight / Math.max(steps, 1)) * i));
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await sleep(400);
    if (i > 0 && i < steps) {
      await page.screenshot({ path: path.join(dir, `scroll-${i}.png`), fullPage: false });
    }
    const issues = await collectLayoutIssues(page, `${route.name}/${viewportName}@y${y}`);
    allIssues.push(...issues);
  }

  await page.screenshot({ path: path.join(dir, "full.png"), fullPage: true });

  // Dedupe issues
  const seen = new Set();
  return allIssues.filter((iss) => {
    const k = JSON.stringify(iss);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  console.log("Waiting for dev server…");
  await waitForServer(BASE);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await injectDemoSessionLoggedIn(context);
  await context.addInitScript(() => {
    localStorage.setItem("rp_legal_consent_v1", "accepted");
  });
  const page = await context.newPage();

  const report = { ts: new Date().toISOString(), base: BASE, issues: [] };

  for (const vp of ["desktop", "mobile"]) {
    for (const route of PUBLIC_ROUTES) {
      const r = { path: route, name: route.replace(/\//g, "") || "home" };
      console.log(`Audit ${vp} ${route}`);
      try {
        const issues = await auditRoute(page, r, vp);
        report.issues.push(...issues);
      } catch (e) {
        report.issues.push({ type: "route-error", route, viewport: vp, error: String(e.message || e) });
      }
    }
  }

  for (const vp of ["desktop", "mobile"]) {
    for (const route of APP_ROUTES) {
      console.log(`Audit ${vp} ${route.path}`);
      try {
        const issues = await auditRoute(page, route, vp);
        report.issues.push(...issues);
      } catch (e) {
        report.issues.push({ type: "route-error", route: route.path, viewport: vp, error: String(e.message || e) });
      }
    }
  }

  await browser.close();

  const filtered = report.issues.filter((i) => i.type !== "behind-fixed-cta" || i.testId);
  report.issueCount = filtered.length;
  report.issues = filtered;

  await fs.writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(`\n=== UI Audit: ${report.issueCount} issues ===`);
  const grouped = {};
  for (const iss of filtered) {
    const k = iss.type;
    grouped[k] = (grouped[k] || 0) + 1;
  }
  console.log(grouped);
  for (const iss of filtered.slice(0, 40)) {
    console.log(JSON.stringify(iss));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
