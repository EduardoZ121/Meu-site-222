import { writeFileSync } from "node:fs";
import { FALLBACK_POSTER_TEMPLATES } from "../src/lib/posterFallbacks.js";

writeFileSync(
  new URL("../api/lib/posterTemplatesData.json", import.meta.url),
  `${JSON.stringify(FALLBACK_POSTER_TEMPLATES)}\n`,
);
console.log(`Synced ${FALLBACK_POSTER_TEMPLATES.length} templates`);
