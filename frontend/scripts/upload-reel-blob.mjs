import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = path.resolve(__dirname, "../..");

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    for (const base of [ROOT, path.join(ROOT, "frontend")]) {
      try {
        const raw = require("fs").readFileSync(path.join(base, name), "utf8");
        raw.split("\n").forEach((line) => {
          const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
          if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        });
      } catch { /* */ }
    }
  }
}

loadEnv();
const buf = await fs.readFile(path.join(__dirname, "output/motion-flyer-marketing/motion-flyer-instagram-reel-15s.mp4"));
const blob = await put("marketing/motion-flyer-reel/instagram-reel-15s-v1.mp4", buf, {
  access: "public",
  token: process.env.BLOB_READ_WRITE_TOKEN,
  contentType: "video/mp4",
});
console.log(blob.url);
