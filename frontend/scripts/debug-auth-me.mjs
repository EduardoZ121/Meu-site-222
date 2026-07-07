import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

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
    process.env[k] = v;
  }
}

loadEnv(".env.smoke.tmp");
const { getDb } = require(path.join(root, "api/lib/mongo.cjs"));
const { signSession } = require(path.join(root, "api/lib/sessionToken.cjs"));

const db = await getDb();
const admin = await db.collection("users").findOne({ email: "eduardozola1998@gmail.com" });
console.log("admin", admin?.id);

const urls = ["local", "remakepix.com", "www.remakepix.com", "remakepix.vercel.app"];
for (const u of urls) {
  process.env.VERCEL_URL = u;
  const token = signSession({ id: admin.id, email: admin.email, role: "admin", name: "T" });
  const res = await fetch("https://www.remakepix.com/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.text();
  console.log(u, res.status, body.slice(0, 200));
}
