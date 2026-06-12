/**
 * Normaliza capas para 512×512 (quadrado OpenArt) — corre encaixe nos cards.
 * Uso: node scripts/normalize-tool-covers.mjs
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "public", "images", "tools");

async function processFile(filePath) {
  const tmp = `${filePath}.tmp.jpg`;
  const buf = await sharp(filePath)
    .resize(512, 512, { fit: "cover", position: "centre" })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  await fs.promises.writeFile(tmp, buf);
  await fs.promises.rename(tmp, filePath);
  return buf.length;
}

async function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      await walk(full);
      continue;
    }
    if (!/\.(jpg|jpeg|png|webp)$/i.test(name)) continue;
    const out = full.replace(/\.(png|webp)$/i, ".jpg");
    if (out !== full) {
      const buf = await sharp(full)
        .resize(512, 512, { fit: "cover", position: "centre" })
        .jpeg({ quality: 84, mozjpeg: true })
        .toBuffer();
      await fs.promises.writeFile(out, buf);
      await fs.promises.unlink(full).catch(() => {});
      console.log(path.basename(out), buf.length);
    } else {
      const size = await processFile(full);
      console.log(name, size);
    }
  }
}

await walk(root);
console.log("done");
