/**
 * Post via Playwright Chromium (separate profile, no Edge session conflict).
 */
import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE = process.env.IG_POST_IMAGE || "C:/Users/eduar/AppData/Local/Temp/ig-post1.png";
const COMPOSER =
  "https://business.facebook.com/latest/composer/?asset_id=1074234992439730&business_id=791740167309125&ref=biz_web_home_create_post";

const CAPTION = `From casual selfie to studio portrait — in seconds.

Remake Pixel transforms your photos with Pro Mode AI: 96 creative styles, professional results, and no subscription required.

Start free with 100 credits 👇
https://www.remakepix.com

#RemakePixel #AIPhoto #BeforeAndAfter #PhotoEditing #ProMode #CreativeAI #ContentCreator`;

const profileDir = path.join(process.env.TEMP || ".", "pw-meta-chromium-profile");

async function main() {
  if (!fs.existsSync(IMAGE)) throw new Error(`Image not found: ${IMAGE}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    acceptDownloads: true,
    viewport: { width: 1400, height: 900 },
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto(COMPOSER, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(8000);

  const url = page.url();
  if (url.includes("login") || (await page.locator('input[name="email"]').count()) > 0) {
    console.log("NEEDS_LOGIN:", url);
    await page.waitForTimeout(300000);
  }

  const addBtn = page.getByRole("button", { name: /Adicionar foto/i });
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 30000 }),
    addBtn.click(),
  ]);
  await fileChooser.setFiles(IMAGE);
  await page.waitForTimeout(8000);

  const textbox = page
    .locator('[contenteditable="true"], [role="textbox"], textarea')
    .filter({ hasNot: page.locator("[aria-hidden=true]") })
    .first();
  await textbox.click({ timeout: 15000 });
  await textbox.fill(CAPTION);
  await page.waitForTimeout(2000);

  const publish = page.getByRole("button", { name: /^Publicar$/i });
  await publish.waitFor({ state: "visible", timeout: 15000 });
  await publish.click();
  await page.waitForTimeout(15000);

  console.log("PUBLISHED_OK");
  await context.close();
}

main().catch((err) => {
  console.error("PUBLISH_FAIL:", err.message);
  process.exit(1);
});
