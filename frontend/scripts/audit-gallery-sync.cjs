require("dotenv").config({ path: ".env.smoke.tmp" });
require("dotenv").config({ path: ".env.prod.tmp" });
const { getDb } = require("../api/lib/mongo.cjs");

(async () => {
  const db = await getDb();
  if (!db) {
    console.log("NO_DB");
    process.exit(1);
  }
  const adminId = "google_113952373365030962408";

  const pending = await db
    .collection("pending_predictions")
    .find(
      { user_id: adminId },
      {
        projection: {
          id: 1,
          status: 1,
          type: 1,
          created_at: 1,
          completed_at: 1,
          error: 1,
          brand_campaign_index: 1,
          result_urls: 1,
        },
      },
    )
    .sort({ created_at: -1 })
    .limit(15)
    .toArray();

  console.log("RECENT_PENDING", pending.length);
  for (const p of pending) {
    const urls = Array.isArray(p.result_urls) ? p.result_urls.length : 0;
    console.log(
      `${p.status?.padEnd(10)} ${String(p.type || "").slice(0, 12).padEnd(12)} idx=${p.brand_campaign_index ?? "-"} urls=${urls} ${p.id?.slice(0, 20)} err=${(p.error || "").slice(0, 40)}`,
    );
  }

  let orphan = 0;
  for (const p of pending) {
    if (p.status !== "completed") continue;
    // eslint-disable-next-line no-await-in-loop
    const c = await db.collection("creations").findOne({ id: p.id });
    if (!c) {
      orphan += 1;
      console.log("ORPHAN_COMPLETED", p.id, p.type);
    }
  }
  console.log("ORPHAN_COMPLETED_COUNT", orphan);

  const creations = await db
    .collection("creations")
    .find(
      { user_id: adminId },
      { projection: { id: 1, type: 1, created_at: 1, model_used: 1, result_urls: 1 } },
    )
    .sort({ created_at: -1 })
    .limit(8)
    .toArray();
  console.log("RECENT_CREATIONS", creations.length);
  for (const c of creations) {
    const u = Array.isArray(c.result_urls) ? c.result_urls[0] : null;
    console.log(`${String(c.type || "").padEnd(14)} ${(c.model_used || "").slice(0, 30)} ${c.id?.slice(0, 18)} hasUrl=${Boolean(u)}`);
  }
  process.exit(0);
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
