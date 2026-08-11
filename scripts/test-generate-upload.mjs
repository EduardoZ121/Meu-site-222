#!/usr/bin/env node
/**
 * E2E: página Gerar — escolher foto NÃO deve chamar upload à nuvem; preview fica "ready" rápido.
 * Uso: BASE_URL=http://127.0.0.1:3001 node scripts/test-generate-upload.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { execSync, spawn } from "child_process";
import { injectDemoSessionLoggedIn } from "./demo-recording-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const FIXTURE = path.join(__dirname, "fixtures/test-photo.jpg");
const BASE = (process.env.BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const EXPECT_BUILD = process.env.EXPECT_BUILD_ID || "upload-generate-v11";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, maxMs = 90000) {
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
      await sleep(800);
    }
  }
  throw new Error(`Server not ready: ${url}`);
}

async function main() {
  if (!fs.existsSync(FIXTURE)) {
    throw new Error(`Missing fixture: ${FIXTURE}`);
  }

  let serverProc;
  if (process.env.START_SERVE === "1") {
    if (!fs.existsSync(path.join(ROOT, "frontend/build/index.html"))) {
      execSync("cd frontend && REACT_APP_BUILD_ID=upload-generate-v11 yarn build", {
        cwd: ROOT,
        stdio: "inherit",
      });
    }
    serverProc = spawn("npx", ["serve", "-s", "frontend/build", "-l", "3001"], {
      cwd: ROOT,
      stdio: "ignore",
      detached: true,
    });
    await waitForServer(`${BASE}/`);
  } else {
    await waitForServer(`${BASE}/`);
  }

  const uploadCalls = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  });

  await injectDemoSessionLoggedIn(context);

  await context.route(/\/api\//, async (route) => {
    const url = route.request().url();
    if (/\/api\/(upload\/image-blob|blob\/prepare)/.test(url)) {
      uploadCalls.push(url);
    }
    if (/\/api\/generate\/(easy|edit)/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ prediction_id: "e2e_test_pred", credits_spent: 5 }),
      });
    }
    if (/\/api\/predictions\//.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "succeeded",
          elapsed_seconds: 1,
          creation: {
            id: "e2e_c1",
            type: "image",
            credits_spent: 5,
            result_urls: [`${BASE}/og-image.jpg`],
          },
        }),
      });
    }
    if (/\/api\/(auth\/me|public\/)/.test(url)) {
      return route.continue();
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  const page = await context.newPage();
  const errors = [];

  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(`${BASE}/app/generate`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('[data-testid="generate-page"]', { timeout: 30000 });

  const accPhoto = page.locator('[data-testid="studio-acc-photo"]');
  await accPhoto.click();
  await sleep(400);

  const wrap = page.locator('[data-testid="gen-photo-wrap"]');
  await wrap.waitFor({ state: "visible", timeout: 20000 });

  const buildId = await wrap.getAttribute("data-rp-upload-build");
  if (buildId !== EXPECT_BUILD) {
    throw new Error(`BUILD_ID esperado "${EXPECT_BUILD}", obtido "${buildId}" — deploy/cache antigo.`);
  }

  const picker = page.locator('[data-testid="gen-photo"]');
  const input = page.locator('[data-testid="gen-photo-input"]');
  await input.setInputFiles(FIXTURE);

  const deadline = Date.now() + 12000;
  let ready = false;
  while (Date.now() < deadline) {
    const state = await picker.getAttribute("data-upload-state");
    const loading = await page.getByText(/guardar foto no servidor/i).isVisible().catch(() => false);
    if (state === "ready" && !loading) {
      ready = true;
      break;
    }
    if (loading) {
      throw new Error('Spinner "guardar foto no servidor" — upload à nuvem no pick (regressão CloudPhotoUpload).');
    }
    await sleep(200);
  }
  if (!ready) {
    const url = page.url();
    const body = await page.locator("body").innerText().catch(() => "");
    throw new Error(
      `Upload não ficou ready em 12s (state=${await picker.getAttribute("data-upload-state")}, url=${url}, snippet=${body.slice(0, 200)}).`,
    );
  }

  if (uploadCalls.length > 0) {
    throw new Error(`Chamadas de upload na nuvem ao escolher foto: ${uploadCalls.join(", ")}`);
  }

  const preview = page.locator('[data-testid="gen-photo-preview"]');
  const previewVisible = await preview.isVisible().catch(() => false);
  if (!previewVisible) {
    const nameShown = await page.getByText(/test-photo\.jpg/i).isVisible().catch(() => false);
    if (!nameShown) {
      throw new Error("Sem preview nem nome do ficheiro após pick.");
    }
  }

  await page.locator('[data-testid="studio-acc-photo"]').click().catch(() => {});
  await page.locator('[data-testid="prompt-input"]').fill("test prompt for edit mode here");
  await page.locator('[data-testid="generate-button"]').click();

  await page.waitForTimeout(1500);
  const toastErr = page.locator('[data-sonner-toast][data-type="error"]');
  if (await toastErr.count()) {
    const txt = await toastErr.first().textContent();
    throw new Error(`Toast de erro após Gerar: ${txt}`);
  }

  if (errors.length) {
    throw new Error(`Erros JS: ${errors.join("; ")}`);
  }

  console.log("OK: pick instantâneo, sem upload na nuvem, Gerar sem toast de erro (API mock).");
  await browser.close();
  if (serverProc) {
    try {
      process.kill(-serverProc.pid);
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error("FAIL:", err.message || err);
  process.exit(1);
});
