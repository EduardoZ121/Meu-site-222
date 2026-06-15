require("dotenv").config({ path: ".env.prod.tmp" });
const { getDb } = require("../api/lib/mongo.cjs");

(async () => {
  const db = await getDb();
  const ids = [
    "rp_6e2f01f1-9978-49e6-9023-10681bdd7696",
    "rp_af047d37-cd91-4682-88b2-0e893091d765",
    "rp_3cfea2c8-f52d-4bb6-9e43-0a7aa2c56b06",
    "rp_3f132719-a188-4d2b-9cf1-9a7244505cd2",
  ];
  for (const id of ids) {
    const c = await db.collection("creations").findOne({ id });
    console.log("---", id);
    console.log(
      JSON.stringify(
        {
          type: c?.type,
          created_at: c?.created_at,
          completed_at: c?.completed_at,
          user_id: c?.user_id,
          urls: (c?.result_urls || []).length,
          url: (c?.result_urls || [])[0],
        },
        null,
        2
      )
    );
  }
  const uid = "google_113952373365030962408";
  const missing = await db.collection("creations").countDocuments({
    user_id: uid,
    $or: [{ created_at: { $exists: false } }, { created_at: null }],
  });
  console.log("creations missing created_at:", missing);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
