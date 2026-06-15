require("dotenv").config({ path: ".env.prod.tmp" });
const { getDb } = require("../api/lib/mongo.cjs");

(async () => {
  const db = await getDb();
  if (!db?.collection) {
    console.log("NO_MONGO");
    process.exit(1);
  }
  const uid = "google_113952373365030962408";
  const broken = await db
    .collection("creations")
    .find({
      user_id: uid,
      $or: [{ created_at: { $exists: false } }, { created_at: null }],
    })
    .toArray();
  console.log("broken_count", broken.length);
  let fixed = 0;
  for (const c of broken) {
    const pending = await db.collection("pending_predictions").findOne(
      { id: c.id, user_id: uid },
      { projection: { completed_at: 1, created_at: 1 } }
    );
    const createdAt =
      pending?.completed_at || pending?.created_at || new Date().toISOString();
    await db.collection("creations").updateOne(
      { id: c.id, user_id: uid },
      { $set: { created_at: createdAt } }
    );
    fixed += 1;
    const urls = c.result_urls || [];
    console.log(
      "fixed",
      c.id,
      c.type,
      createdAt,
      urls[0] ? urls[0].slice(-48) : "no-url"
    );
  }
  console.log("fixed_total", fixed);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
