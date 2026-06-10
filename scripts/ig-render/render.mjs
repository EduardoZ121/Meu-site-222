import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../../assets/marketing");
const IMG = path.resolve(__dirname, "../../assets/marketing/img");

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });

const posts = [
  { html: "post1.html", out: "remakepix-post-1-before-after-en.png" },
  { html: "post2.html", out: "remakepix-post-2-carousel-en.png" },
  { html: "post3.html", out: "remakepix-post-3-posters-en.png" },
  { html: "post4.html", out: "remakepix-post-4-carousel-cover-en.png" },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });

for (const p of posts) {
  const file = path.join(__dirname, "templates", p.html);
  await page.goto(`file:///${file.replace(/\\/g, "/")}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  const outPath = path.join(OUT, p.out);
  await page.screenshot({ path: outPath, type: "png" });
  console.log(`OK ${p.out} 1080x1080`);
}

await browser.close();
console.log("Saved to", OUT);
