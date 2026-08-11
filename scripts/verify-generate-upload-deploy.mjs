#!/usr/bin/env node
/** Falha CI se produção ainda tiver build antigo (CloudPhotoUpload no pick). */
const ORIGIN = (process.env.SITE_ORIGIN || "https://remakepix.com").replace(/\/$/, "");
const MIN_BUILD = process.env.MIN_BUILD_ID || "upload-generate-v11";

async function main() {
  const health = await fetch(`${ORIGIN}/api/health`).then((r) => r.json());
  const build = health?.build || "";
  if (build !== MIN_BUILD) {
    console.error(`FAIL: /api/health build="${build}" (esperado "${MIN_BUILD}"). Deploy em falta.`);
    process.exit(1);
  }

  const html = await fetch(`${ORIGIN}/`).then((r) => r.text());
  const m = html.match(/\/static\/js\/(main\.[a-f0-9]+\.js)/);
  if (!m) {
    console.error("FAIL: não encontrou main.js no HTML.");
    process.exit(1);
  }
  const js = await fetch(`${ORIGIN}/static/js/${m[1]}`).then((r) => r.text());
  if (js.includes("upload_cloud_saving") && !js.includes(MIN_BUILD)) {
    console.error(`FAIL: bundle ${m[1]} ainda tem upload à nuvem no pick sem BUILD ${MIN_BUILD}.`);
    process.exit(1);
  }
  if (!js.includes(MIN_BUILD)) {
    console.error(`FAIL: bundle sem BUILD_ID ${MIN_BUILD}.`);
    process.exit(1);
  }
  console.log(`OK: produção em ${ORIGIN} com build ${build}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
