require("dotenv").config({ path: ".env.prod.tmp" });
const { getDb } = require("../api/lib/mongo.cjs");

(async () => {
  const db = await getDb();
  if (!db) {
    console.log("NO_DB");
    process.exit(1);
  }
  const admins = [
    "eduardozola1998@gmail.com",
    "eduardozola121998@gmail.com",
    "eduardozola11998@gmail.com",
  ];
  const users = await db
    .collection("users")
    .find({ email: { $in: admins } }, { projection: { id: 1, email: 1 } })
    .toArray();
  const userIds = users.map((u) => u.id);
  console.log("USERS", JSON.stringify(users, null, 2));

  const pending = await db
    .collection("pending_predictions")
    .find(
      { user_id: { $in: userIds } },
      {
        projection: {
          _id: 0,
          id: 1,
          status: 1,
          type: 1,
          prompt: 1,
          created_at: 1,
          completed_at: 1,
          result_urls: 1,
          notify_email: 1,
          notify_email_sent_at: 1,
          error: 1,
          replicate_prediction_id: 1,
        },
      }
    )
    .sort({ created_at: -1 })
    .limit(20)
    .toArray();
  console.log("PENDING_COUNT", pending.length);
  for (const p of pending) {
    const urls = Array.isArray(p.result_urls) ? p.result_urls : [];
    console.log("---");
    console.log(
      JSON.stringify(
        { ...p, result_urls: urls.slice(0, 2), url_count: urls.length },
        null,
        2
      )
    );
  }

  const creations = await db
    .collection("creations")
    .find(
      { user_id: { $in: userIds } },
      { projection: { _id: 0, id: 1, type: 1, prompt: 1, created_at: 1, result_urls: 1 } }
    )
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();
  console.log("CREATIONS_COUNT", creations.length);
  for (const c of creations) {
    const urls = Array.isArray(c.result_urls) ? c.result_urls : [];
    console.log(
      "CREATION",
      JSON.stringify({
        id: c.id,
        type: c.type,
        created_at: c.created_at,
        url: urls[0] || null,
      })
    );
  }
  process.exit(0);
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
