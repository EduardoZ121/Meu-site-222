/**
 * Teste de upload de vídeo em PRODUÇÃO (remakepix.com).
 * Uso: set RP_TEST_TOKEN=<token do browser> && node scripts/test-video-blob-upload-prod.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const API = "https://www.remakepix.com/api";
const bearer = process.env.RP_TEST_TOKEN || "";
const tmpVideo = path.join(root, "scripts", ".test-video-80mb.mp4");

if (!bearer) {
  console.error("Define RP_TEST_TOKEN com o token do localStorage (rp_token).");
  process.exit(1);
}
if (!fs.existsSync(tmpVideo)) {
  console.error("Ficheiro de teste em falta:", tmpVideo);
  process.exit(1);
}

async function main() {
  const fileBuf = fs.readFileSync(tmpVideo);
  const file = new File([fileBuf], "test-80mb.mp4", { type: "video/mp4" });
  const mb = Math.round(file.size / (1024 * 1024));
  console.log(`Teste produção — vídeo ${mb} MB`);

  const statusRes = await fetch(`${API}/blob/status`);
  const status = await statusRes.json();
  console.log("blob/status:", statusRes.status, status);
  if (!status.blob) throw new Error("Blob off");

  const tokenEvent = {
    type: "blob.generate-client-token",
    payload: {
      pathname: `rp/prod-test-${Date.now()}-80mb.mp4`,
      callbackUrl: `${API}/video/upload`,
      clientPayload: JSON.stringify({ token: bearer }),
      multipart: true,
    },
  };
  const tokenRes = await fetch(`${API}/video/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify(tokenEvent),
  });
  const tokenJson = await tokenRes.json().catch(() => ({}));
  console.log("video/upload token:", tokenRes.status, tokenJson.detail || (tokenJson.clientToken ? "OK" : tokenJson));
  if (!tokenRes.ok || !tokenJson.clientToken) {
    throw new Error(`Falhou token: ${tokenJson.detail || tokenRes.status}`);
  }

  const { upload } = await import("@vercel/blob/client");
  const started = Date.now();
  const blob = await upload(`rp/prod-test-${Date.now()}-80mb.mp4`, file, {
    access: "public",
    handleUploadUrl: `${API}/video/upload`,
    clientPayload: JSON.stringify({ token: bearer }),
    multipart: true,
    onUploadProgress: ({ percentage }) => {
      if (percentage === 0 || percentage >= 25 && percentage % 25 === 0 || percentage >= 99) {
        console.log(`  progress: ${percentage}%`);
      }
    },
  });
  const secs = Math.round((Date.now() - started) / 1000);
  console.log(`✓ upload ${secs}s →`, blob.url);

  const head = await fetch(blob.url, { method: "HEAD" });
  console.log("✓ Blob HEAD", head.status, "content-length:", head.headers.get("content-length"));
}

main().catch((e) => {
  console.error("FALHOU:", e.message || e);
  process.exit(1);
});
