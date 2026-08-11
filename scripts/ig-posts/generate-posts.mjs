import sharp from "sharp";
import fs from "fs";
import path from "path";

const ROOT = path.resolve("../..");
const OUT = path.join(ROOT, "assets/marketing");
const ASSETS = path.join(ROOT, "assets");
const BG = { r: 11, g: 11, b: 12, alpha: 1 };
const W = 1080;
const H = 1080;

fs.mkdirSync(OUT, { recursive: true });

function svgOverlay(inner) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`
  );
}

async function save(name, layers) {
  const base = sharp({ create: { width: W, height: H, channels: 4, background: BG } });
  const out = path.join(OUT, name);
  await base.composite(layers).png().toFile(out);
  const m = await sharp(out).metadata();
  console.log(`${name}: ${m.width}x${m.height}`);
}

async function squareCrop(src, size) {
  const img = sharp(src);
  const meta = await img.metadata();
  const side = Math.min(meta.width, meta.height);
  const left = Math.floor((meta.width - side) / 2);
  const top = Math.floor((meta.height - side) / 2);
  return img.extract({ left, top, width: side, height: side }).resize(size, size).png().toBuffer();
}

async function post1BeforeAfter() {
  const before = await squareCrop(path.join(ASSETS, "ig-before-panel.png"), 420);
  const after = await squareCrop(path.join(ASSETS, "ig-after-panel.png"), 420);
  const overlay = svgOverlay(`
    <defs>
      <linearGradient id="p" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#7C3AED"/>
        <stop offset="100%" stop-color="#A855F7"/>
      </linearGradient>
    </defs>
    <text x="540" y="88" text-anchor="middle" fill="#F4F1EA" font-family="Arial,Helvetica,sans-serif" font-size="46" font-weight="700">From casual selfie to</text>
    <text x="540" y="142" text-anchor="middle" fill="#F4F1EA" font-family="Arial,Helvetica,sans-serif" font-size="46" font-weight="700">studio portrait.</text>
    <text x="540" y="182" text-anchor="middle" fill="#9CA3AF" font-family="Arial,Helvetica,sans-serif" font-size="22">Remake Pixel · Pro Mode</text>
    <rect x="88" y="228" width="420" height="420" rx="24" fill="none" stroke="url(#p)" stroke-width="3"/>
    <rect x="572" y="228" width="420" height="420" rx="24" fill="none" stroke="url(#p)" stroke-width="3"/>
    <rect x="108" y="248" width="100" height="34" rx="17" fill="#1a1a1f"/>
    <text x="158" y="271" text-anchor="middle" fill="#A855F7" font-family="Arial,sans-serif" font-size="16" font-weight="700">BEFORE</text>
    <rect x="592" y="248" width="100" height="34" rx="17" fill="#1a1a1f"/>
    <text x="642" y="271" text-anchor="middle" fill="#A855F7" font-family="Arial,sans-serif" font-size="16" font-weight="700">AFTER</text>
    <path d="M518 438 L548 438 L548 418 L578 438 L548 458 L548 438" fill="#A855F7"/>
    <text x="540" y="1010" text-anchor="middle" fill="#F4F1EA" font-family="Arial,sans-serif" font-size="72" font-weight="700">R<tspan fill="#A855F7">.</tspan></text>
    <text x="540" y="1048" text-anchor="middle" fill="#6B7280" font-family="Arial,sans-serif" font-size="20">remakepix.com</text>
  `);
  await save("post-01-before-after-1080-en.png", [
    { input: before, left: 98, top: 238 },
    { input: after, left: 582, top: 238 },
    { input: overlay, left: 0, top: 0 },
  ]);
}

async function post2Carousel() {
  const overlay = svgOverlay(`
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#7C3AED"/>
        <stop offset="100%" stop-color="#c7a77a"/>
      </linearGradient>
    </defs>
    <text x="540" y="78" text-anchor="middle" fill="#F4F1EA" font-size="44" font-weight="700" font-family="Arial,sans-serif">Create content every day</text>
    <text x="540" y="128" text-anchor="middle" font-size="44" font-weight="700" font-family="Arial,sans-serif">without the <tspan fill="url(#g)">hassle.</tspan></text>
    <text x="540" y="168" text-anchor="middle" fill="#9CA3AF" font-size="20" font-family="Arial,sans-serif">Type a topic. AI builds your carousel.</text>
    <rect x="80" y="200" width="760" height="64" rx="32" fill="#151518" stroke="#2a2a30"/>
    <text x="110" y="242" fill="#9CA3AF" font-size="22" font-family="Arial,sans-serif">Instagram ideas |</text>
    <rect x="680" y="212" width="140" height="40" rx="20" fill="#7C3AED"/>
    <text x="750" y="238" text-anchor="middle" fill="#fff" font-size="18" font-weight="700" font-family="Arial,sans-serif">Generate</text>
    ${[
      [80, 300, "#12121a", "DISCIPLINE TODAY", "FREEDOM TOMORROW", "#c7a77a"],
      [560, 300, "#0f0f12", "FOCUS · BUILD", "ELEVATE", "#A855F7"],
      [80, 640, "#141018", "BEATZ NIGHT", "Live DJ set · Sat 24", "#A855F7"],
      [560, 640, "#101010", "STRONG BODY", "STRONG MIND", "#c7a77a"],
    ]
      .map(([x, y, fill, l1, l2, accent], i) => {
        const cardY = y;
        return `
        <rect x="${x}" y="${cardY}" width="440" height="320" rx="20" fill="${fill}" stroke="#252530"/>
        <text x="${x + 24}" y="${cardY + 56}" fill="#F4F1EA" font-size="28" font-weight="700" font-family="Arial,sans-serif">${l1}</text>
        <text x="${x + 24}" y="${cardY + 96}" fill="${accent}" font-size="24" font-weight="700" font-family="Arial,sans-serif">${l2}</text>
        <text x="${x + 380}" y="${cardY + 300}" fill="${accent}" font-size="22" font-weight="700" font-family="Arial,sans-serif">R.</text>
      `;
      })
      .join("")}
    <text x="540" y="1020" text-anchor="middle" fill="#9CA3AF" font-size="22" font-family="Arial,sans-serif">R. Remake Pixel  ·  50 free credits</text>
  `);
  await save("post-02-carousel-1080-en.png", [{ input: overlay, left: 0, top: 0 }]);
}

async function post3Posters() {
  const overlay = svgOverlay(`
    <text x="80" y="70" fill="#F4F1EA" font-size="36" font-weight="700" font-family="Arial,sans-serif">R<tspan fill="#A855F7">.</tspan></text>
    ${[
      [120, 520, 200, "#7C3AED", "SOUND", "WAVES", "Live music"],
      [300, 480, 220, "#c7a77a", "BOLD", "FLAVORS", "Urban Bite"],
      [500, 460, 240, "#A855F7", "DISCIPLINE", "STRENGTH", "Strive Fitness"],
      [720, 500, 200, "#E5E7EB", "TIMELESS", "FORM", "Noir Studio"],
    ]
      .map(([x, y, h, accent, l1, l2, sub], i) => {
        const w = 180;
        return `
        <rect x="${x}" y="${1080 - h - 80}" width="${w}" height="${h}" rx="12" fill="#151518" stroke="#333" transform="rotate(${-8 + i * 5} ${x + w / 2} ${1080 - h / 2 - 80})"/>
        <text transform="rotate(${-8 + i * 5} ${x + 20} ${1080 - h - 20})" fill="${accent}" font-size="22" font-weight="700" font-family="Arial,sans-serif">${l1}</text>
        <text transform="rotate(${-8 + i * 5} ${x + 20} ${1080 - h + 16})" fill="#F4F1EA" font-size="20" font-weight="700" font-family="Arial,sans-serif">${l2}</text>
        <text transform="rotate(${-8 + i * 5} ${x + 20} ${1080 - h + 50})" fill="#9CA3AF" font-size="12" font-family="Arial,sans-serif">${sub}</text>
      `;
      })
      .join("")}
    <text x="540" y="920" text-anchor="middle" fill="#F4F1EA" font-size="52" font-weight="700" font-family="Arial,sans-serif">Professional</text>
    <text x="540" y="972" text-anchor="middle" fill="#A855F7" font-size="48" font-style="italic" font-family="Georgia,serif">posters</text>
    <text x="540" y="1020" text-anchor="middle" fill="#F4F1EA" font-size="40" font-weight="700" font-family="Arial,sans-serif">in seconds.</text>
    <rect x="380" y="1038" width="320" height="32" rx="16" fill="none" stroke="#444"/>
    <text x="540" y="1060" text-anchor="middle" fill="#9CA3AF" font-size="16" font-family="Arial,sans-serif">44 templates · Remake Pixel</text>
  `);
  await save("post-03-posters-1080-en.png", [{ input: overlay, left: 0, top: 0 }]);
}

async function post4Cover() {
  const overlay = svgOverlay(`
    <defs>
      <linearGradient id="ai" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#7C3AED"/>
        <stop offset="100%" stop-color="#c7a77a"/>
      </linearGradient>
    </defs>
    <text x="980" y="48" text-anchor="end" fill="#6B7280" font-size="18" font-family="Arial,sans-serif">1/5</text>
    <text x="540" y="100" text-anchor="middle" fill="#D1D5DB" font-size="28" font-family="Arial,sans-serif">I made these visuals</text>
    <text x="540" y="190" text-anchor="middle" fill="url(#ai)" font-size="92" font-weight="700" font-family="Arial,sans-serif">with AI</text>
    <text x="540" y="250" text-anchor="middle" fill="#F4F1EA" font-size="32" font-weight="700" font-family="Arial,sans-serif">on Remake Pixel</text>
    ${[
      [140, 620, "ART PORTRAIT", "#A855F7"],
      [310, 580, "ANIME STYLE", "#7C3AED"],
      [480, 560, "VIDEO SCENE", "#6B7280"],
      [650, 590, "MUSIC POSTER", "#c7a77a"],
    ]
      .map(([x, y, label, accent]) => `
        <rect x="${x}" y="${y}" width="160" height="280" rx="10" fill="#151518" stroke="${accent}" stroke-width="2" transform="rotate(${-6 + (x - 140) / 40} ${x + 80} ${y + 140})"/>
        <rect x="${x + 12}" y="${y + 40}" width="136" height="160" rx="6" fill="#0B0B0C" transform="rotate(${-6 + (x - 140) / 40} ${x + 80} ${y + 120})"/>
        <text transform="rotate(${-6 + (x - 140) / 40} ${x + 80} ${y + 230})" text-anchor="middle" fill="${accent}" font-size="11" font-weight="700" font-family="Arial,sans-serif">${label}</text>
      `)
      .join("")}
    <text x="540" y="1040" text-anchor="middle" fill="#6B7280" font-size="20" font-family="Arial,sans-serif">Creative studio · remakepix.com</text>
  `);
  await save("post-04-carousel-cover-1080-en.png", [{ input: overlay, left: 0, top: 0 }]);
}

await post1BeforeAfter();
await post2Carousel();
await post3Posters();
await post4Cover();
console.log("Done ->", OUT);
