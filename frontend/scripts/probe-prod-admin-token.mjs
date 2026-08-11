import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  for (const line of fs.readFileSync(path.join(root, file), "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 1) continue;
    const k = trimmed.slice(0, i);
    let v = trimmed.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

loadEnv(".env.production.local");
const { signSession } = require(path.join(root, "api/lib/sessionToken.cjs"));
const API = "https://www.remakepix.com/api";

for (const url of ["local", "remakepix.com", "www.remakepix.com", "remakepix.vercel.app", "remakepix-2u83mlyzx-eduardozola1998-1779s-projects.vercel.app"]) {
  process.env.VERCEL_URL = url;
  const token = signSession({
    id: "adm-probe",
    email: "eduardozola1998@gmail.com",
    role: "admin",
    name: "Admin Probe",
  });
  const res = await fetch(`${API}/video/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: {
        pathname: "rp/probe.mp4",
        callbackUrl: `${API}/video/upload`,
        clientPayload: JSON.stringify({ token }),
        multipart: true,
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(url, res.status, data.detail || (data.clientToken ? "OK" : JSON.stringify(data)));
}
