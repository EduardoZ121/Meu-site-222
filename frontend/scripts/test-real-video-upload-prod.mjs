/**
 * Upload real video file to production Blob (client-side).
 * Usage: set RP_TEST_TOKEN=... && node scripts/test-real-video-upload-prod.mjs "C:\path\video.mp4"
 */
import fs from "node:fs";
import path from "node:path";

const API = "https://www.remakepix.com/api";
const bearer = process.env.RP_TEST_TOKEN || "";
const filePath = process.argv[2];

if (!bearer) {
  console.error("Define RP_TEST_TOKEN (localStorage rp_token).");
  process.exit(1);
}
if (!filePath || !fs.existsSync(filePath)) {
  console.error("Ficheiro em falta:", filePath);
  process.exit(1);
}

const st = fs.statSync(filePath);
const buf = fs.readFileSync(filePath);
const mime = filePath.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4";
const file = new File([buf], path.basename(filePath), { type: mime });
const mb = (st.size / (1024 * 1024)).toFixed(1);

async function main() {
  console.log(`Upload produção: ${path.basename(filePath)} (${mb} MB)`);

  const status = await fetch(`${API}/blob/status`).then((r) => r.json());
  if (!status.blob) throw new Error("Blob off");

  const tokenRes = await fetch(`${API}/video/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: {
        pathname: `rp/${path.basename(filePath).replace(/[^\w.\-]+/g, "_")}`,
        callbackUrl: `${API}/video/upload`,
        clientPayload: JSON.stringify({ token: bearer }),
        multipart: true,
      },
    }),
  });
  const tj = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tj.clientToken) {
    throw new Error(`Token falhou (${tokenRes.status}): ${tj.detail || JSON.stringify(tj)}`);
  }
  console.log("✓ clientToken OK");

  const { upload } = await import("@vercel/blob/client");
  const started = Date.now();
  let lastPct = -1;
  const blob = await upload(`rp/user-test-${Date.now()}-${path.basename(filePath).replace(/[^\w.\-]+/g, "_")}`, file, {
    access: "public",
    handleUploadUrl: `${API}/video/upload`,
    clientPayload: JSON.stringify({ token: bearer }),
    multipart: true,
    onUploadProgress: ({ percentage }) => {
      const p = Math.round(percentage);
      if (p >= lastPct + 10 || p >= 99) {
        lastPct = p;
        console.log(`  ${p}%`);
      }
    },
  });

  const secs = Math.round((Date.now() - started) / 1000);
  const head = await fetch(blob.url, { method: "HEAD" });
  console.log(`✓ OK em ${secs}s`);
  console.log(`  URL: ${blob.url}`);
  console.log(`  HEAD: ${head.status}, size: ${head.headers.get("content-length")}`);
}

main().catch((e) => {
  console.error("FALHOU:", e.message || e);
  process.exit(1);
});
