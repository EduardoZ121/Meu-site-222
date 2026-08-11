/**
 * Teste local do fluxo upload() + /api/video/upload (client → Blob).
 * Uso: npx vercel dev --listen 3000  (outro terminal)
 *      node scripts/test-video-blob-upload.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Carregar .env.local (Vercel dev também injeta, mas o script corre à parte)
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
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
process.env.VERCEL_URL = process.env.VERCEL_URL || "local";

const { signSession, verifySessionToken } = require(path.join(root, "api/lib/sessionToken.cjs"));
const adminToken = signSession({
  id: "test-admin",
  email: "eduardozola1998@gmail.com",
  name: "Test Admin",
  role: "admin",
});
if (!verifySessionToken(adminToken)) {
  throw new Error("Token de teste não bate certo com REPLICATE_API_TOKEN/VERCEL_URL — verifica .env.local");
}

async function probeAuth(label, token) {
  const res = await fetch(`${API}/blob/prepare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename: "probe.mp4", kind: "video" }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(`  auth probe (${label}): ${res.status}`, data.detail || (data.clientToken ? "OK" : JSON.stringify(data)));
  return res.ok;
}

const API = process.env.TEST_API_BASE || "http://127.0.0.1:3000/api";
const tmpVideo = path.join(root, "scripts", ".test-video-5mb.mp4");

function makeTestVideo() {
  if (fs.existsSync(tmpVideo) && fs.statSync(tmpVideo).size >= 4_500_000) return tmpVideo;
  const buf = Buffer.alloc(5 * 1024 * 1024, 0);
  buf.write("ftypmp42", 4);
  fs.writeFileSync(tmpVideo, buf);
  return tmpVideo;
}

async function main() {
  const filePath = makeTestVideo();
  const fileBuf = fs.readFileSync(filePath);
  const file = new File([fileBuf], "test-clip.mp4", { type: "video/mp4" });

  const statusRes = await fetch(`${API}/blob/status`);
  const status = await statusRes.json().catch(() => ({}));
  if (!statusRes.ok || !status.blob) {
    throw new Error(`Blob indisponível (${statusRes.status}): ${JSON.stringify(status)}`);
  }
  console.log("✓ blob/status OK");

  let bearer = adminToken;
  let authOk = await probeAuth("default", bearer);
  if (!authOk) {
    for (const url of ["local", "localhost:3000", "remakepix.com", "www.remakepix.com"]) {
      process.env.VERCEL_URL = url;
      const alt = signSession({
        id: "test-admin",
        email: "eduardozola1998@gmail.com",
        name: "Test Admin",
        role: "admin",
      });
      if (await probeAuth(`VERCEL_URL=${url}`, alt)) {
        authOk = true;
        bearer = alt;
        break;
      }
    }
  }
  if (!authOk) {
    throw new Error("Não foi possível autenticar contra vercel dev — faz login no browser e testa manualmente.");
  }

  const tokenEvent = {
    type: "blob.generate-client-token",
    payload: {
      pathname: `rp/test-${Date.now()}-clip.mp4`,
      callbackUrl: `${API}/video/upload`,
    clientPayload: JSON.stringify({ token: bearer }),
      multipart: true,
    },
  };
  const tokenRes = await fetch(`${API}/video/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
    body: JSON.stringify(tokenEvent),
  });
  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenJson.clientToken) {
    throw new Error(`video/upload token falhou (${tokenRes.status}): ${JSON.stringify(tokenJson)}`);
  }
  console.log("✓ video/upload gerou clientToken");

  const { upload } = await import("@vercel/blob/client");
  const blob = await upload(`rp/test-${Date.now()}-clip.mp4`, file, {
    access: "public",
    handleUploadUrl: `${API}/video/upload`,
    clientPayload: JSON.stringify({ token: bearer }),
    multipart: true,
    onUploadProgress: ({ percentage }) => {
      if (percentage % 25 === 0 || percentage >= 99) {
        process.stdout.write(`  progress: ${percentage}%\n`);
      }
    },
  });

  if (!blob?.url?.startsWith("https://")) {
    throw new Error(`URL inválida: ${JSON.stringify(blob)}`);
  }
  console.log("✓ upload completo:", blob.url.slice(0, 80) + "…");

  const head = await fetch(blob.url, { method: "HEAD" });
  if (!head.ok) throw new Error(`Blob URL inacessível (${head.status})`);
  console.log("✓ Blob URL acessível (HEAD", head.status + ")");

  console.log("\nTESTE OK — upload client-side de vídeo >4MB funcionou.");
}

main().catch((err) => {
  console.error("\nTESTE FALHOU:", err.message || err);
  process.exit(1);
});
