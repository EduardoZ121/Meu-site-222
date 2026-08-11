/**
 * Copia vídeos TeraBox (pasta _incoming) para as capas da grelha Vídeo.
 *
 * Nomes esperados (como no TeraBox):
 * - Text to video.mp4          → text-fast.mp4
 * - Este video vai na sessão de imagem to video.mp4 → image.mp4
 * - Video to video.mp4         → edit.mp4
 *
 * Uso: node scripts/import-video-grid-covers.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const incoming = path.join(__dirname, "..", "public", "images", "tools", "video", "_incoming");
const outDir = path.join(__dirname, "..", "public", "images", "tools", "video");

const MAP = [
  { match: /text\s*to\s*video/i, out: "text-fast.mp4" },
  { match: /imagem\s*to\s*video|image\s*to\s*video/i, out: "image.mp4" },
  { match: /video\s*to\s*video/i, out: "edit.mp4" },
];

if (!fs.existsSync(incoming)) {
  fs.mkdirSync(incoming, { recursive: true });
  console.error(`Criada pasta: ${incoming}`);
  console.error("Coloca lá os 3 MP4 do TeraBox e volta a correr este script.");
  process.exit(1);
}

const files = fs.readdirSync(incoming).filter((f) => /\.(mp4|webm|mov)$/i.test(f));
if (!files.length) {
  console.error(`Sem vídeos em ${incoming}`);
  process.exit(1);
}

let copied = 0;
for (const file of files) {
  const rule = MAP.find((r) => r.match.test(file));
  if (!rule) {
    console.warn(`Ignorado (nome não reconhecido): ${file}`);
    continue;
  }
  const dest = path.join(outDir, rule.out);
  fs.copyFileSync(path.join(incoming, file), dest);
  console.log(`${file} → ${rule.out}`);
  copied += 1;
}

if (copied < 3) {
  console.warn(`Apenas ${copied}/3 vídeos copiados. Verifica os nomes dos ficheiros.`);
}
console.log("Feito.");
