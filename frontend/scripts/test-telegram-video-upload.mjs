/**
 * Test upload with Telegram Desktop sample videos.
 * Usage: node scripts/test-telegram-video-upload.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://www.remakepix.com/api";

const samples = [
  "C:\\Users\\eduar\\Downloads\\Telegram Desktop\\video_2026-06-12_03-53-46.mp4",
  "C:\\Users\\eduar\\Downloads\\Telegram Desktop\\video_2026-06-12_03-56-24.mp4",
  path.join(root, "public", "images", "tools", "video", "edit.mp4"),
].filter((p) => fs.existsSync(p));

function loadEnv(file) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 1) continue;
    process.env[trimmed.slice(0, i)] = trimmed.slice(i + 1).replace(/^["']|["']$/g, "");
  }
}

loadEnv(".env.production.local");
process.env.VERCEL_URL = "www.remakepix.com";
const { signSession } = require(path.join(root, "api/lib/sessionToken.cjs"));
const token = process.env.RP_TEST_TOKEN || signSession({
  id: "admin-upload-test",
  email: "eduardozola1998@gmail.com",
  role: "admin",
  name: "Admin Test",
});

async function uploadOne(filePath) {
  const buf = fs.readFileSync(filePath);
  const mime = filePath.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4";
  const file = new File([buf], path.basename(filePath), { type: mime });
  const mb = (buf.length / (1024 * 1024)).toFixed(1);
  console.log(`\n=== ${path.basename(filePath)} (${mb} MB) ===`);

  const status = await fetch(`${API}/blob/status`).then((r) => r.json());
  if (!status.blob) throw new Error("Blob off");

  const tokenRes = await fetch(`${API}/video/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: {
        pathname: `rp/test-${Date.now()}-${path.basename(filePath).replace(/[^\w.\-]+/g, "_")}`,
        callbackUrl: `${API}/video/upload`,
        clientPayload: JSON.stringify({ token }),
        multipart: true,
      },
    }),
  });
  const tj = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tj.clientToken) {
    throw new Error(`Token ${tokenRes.status}: ${tj.detail || JSON.stringify(tj)}`);
  }
  console.log("✓ clientToken");

  const { upload } = await import("@vercel/blob/client");
  const started = Date.now();
  const blob = await upload(`rp/test-${Date.now()}-${path.basename(filePath).replace(/[^\w.\-]+/g, "_")}`, file, {
    access: "public",
    handleUploadUrl: `${API}/video/upload`,
    clientPayload: JSON.stringify({ token }),
    multipart: true,
    onUploadProgress: ({ percentage }) => {
      if (percentage >= 99 || percentage % 25 === 0) console.log(`  ${Math.round(percentage)}%`);
    },
  });
  console.log(`✓ OK ${Math.round((Date.now() - started) / 1000)}s`);
  console.log(`  ${blob.url}`);
  const head = await fetch(blob.url, { method: "HEAD" });
  console.log(`  HEAD ${head.status}`);
}

async function main() {
  if (!samples.length) {
    console.error("Nenhum vídeo de teste encontrado.");
    process.exit(1);
  }
  for (const sample of samples) {
    try {
      await uploadOne(sample);
    } catch (e) {
      console.error("FALHOU:", e.message || e);
    }
  }
}

main();
