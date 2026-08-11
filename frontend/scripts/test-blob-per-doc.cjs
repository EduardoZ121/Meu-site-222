require("dotenv").config({ path: ".env.local" });
process.env.RP_STORAGE_BACKEND = "blob";
process.env.RP_DISABLE_KV = "1";

const { createBlobColDb } = require("../api/lib/blobColDb.cjs");

(async () => {
  const db = createBlobColDb();
  const col = db.collection("pending_predictions");
  const a = `test_${Date.now()}_a`;
  const b = `test_${Date.now()}_b`;
  await col.insertOne({ id: a, user_id: "u1", status: "starting" });
  await col.insertOne({ id: b, user_id: "u1", status: "starting" });
  const both = await col.find({ user_id: "u1" }).toArray();
  const hits = both.filter((d) => d.id === a || d.id === b);
  console.log("parallel inserts ok:", hits.length === 2);

  const claimed = await col.findOneAndUpdate(
    {
      id: a,
      user_id: "u1",
      $or: [
        { notify_email_sending_at: null },
        { notify_email_sending_at: { $lt: "2000-01-01T00:00:00.000Z" } },
      ],
    },
    { $set: { notify_email_sending_at: new Date().toISOString() } },
    { returnDocument: "before" },
  );
  console.log("$or mixed filter ok:", claimed?.id === a);
  await col.deleteOne({ id: a });
  await col.deleteOne({ id: b });

  const cre = db.collection("creations");
  await cre.updateOne(
    { id: "cre_test_1", user_id: "u1" },
    {
      $setOnInsert: { id: "cre_test_1", user_id: "u1", created_at: new Date().toISOString() },
      $set: { result_urls: ["https://example.com/x.jpg"], type: "poster" },
    },
    { upsert: true },
  );
  const c = await cre.findOne({ id: "cre_test_1" });
  console.log("upsert creation ok:", Boolean(c?.result_urls?.length));
  if (!c?.result_urls?.length) console.log("upsert creation doc:", JSON.stringify(c));
  await cre.deleteOne({ id: "cre_test_1" });
  process.exit(hits.length === 2 && claimed?.id === a && c?.result_urls?.length ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
