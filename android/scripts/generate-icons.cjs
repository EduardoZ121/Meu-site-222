/**
 * Gera ícones PNG a partir de frontend/public/favicon.svg
 * Run: node android/scripts/generate-icons.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const publicDir = path.join(root, "frontend", "public");
const androidRes = path.join(root, "android", "app", "src", "main", "res");
const sharp = require(path.join(root, "frontend", "node_modules", "sharp"));

async function writeIcon(svg, outPath, size, pad = 0) {
  if (pad) {
    const inner = Math.round(size * (1 - pad * 2));
    const buf = await sharp(svg).resize(inner, inner).png().toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 11, g: 11, b: 12, alpha: 1 },
      },
    })
      .composite([{ input: buf, gravity: "center" }])
      .png()
      .toFile(outPath);
  } else {
    await sharp(svg).resize(size, size).png().toFile(outPath);
  }
  console.log("wrote", outPath);
}

async function main() {
  const svgPath = path.join(publicDir, "favicon.svg");
  const svg = fs.readFileSync(svgPath);

  await writeIcon(svg, path.join(publicDir, "icon-192.png"), 192);
  await writeIcon(svg, path.join(publicDir, "icon-512.png"), 512);
  await writeIcon(svg, path.join(publicDir, "icon-512-maskable.png"), 512, 0.12);

  const mipmaps = [
    { folder: "mipmap-mdpi", size: 48 },
    { folder: "mipmap-hdpi", size: 72 },
    { folder: "mipmap-xhdpi", size: 96 },
    { folder: "mipmap-xxhdpi", size: 144 },
    { folder: "mipmap-xxxhdpi", size: 192 },
  ];

  for (const { folder, size } of mipmaps) {
    const dir = path.join(androidRes, folder);
    fs.mkdirSync(dir, { recursive: true });
    for (const name of ["ic_launcher.png", "ic_launcher_round.png"]) {
      await writeIcon(svg, path.join(dir, name), size);
    }
    console.log("wrote mipmap", folder);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
