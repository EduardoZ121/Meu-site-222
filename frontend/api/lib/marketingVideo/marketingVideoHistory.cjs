/**
 * Marketing video job history (Mongo pending_predictions).
 */
const { getDb, storageEnabled } = require("../mongo.cjs");

async function listMarketingVideoHistory(userId, { limit = 24 } = {}) {
  if (!storageEnabled() || !userId) return [];
  const db = await getDb();
  const rows = await db
    .collection("pending_predictions")
    .find(
      { user_id: userId, type: "marketing_video" },
      {
        projection: {
          _id: 0,
          id: 1,
          status: 1,
          created_at: 1,
          completed_at: 1,
          credits_spent: 1,
          marketing_video_duration: 1,
          marketing_video_category: 1,
          marketing_video_provider: 1,
          marketing_video_image_count: 1,
          result_urls: 1,
          error: 1,
          model_used: 1,
        },
      },
    )
    .sort({ created_at: -1 })
    .limit(Math.min(50, Math.max(1, limit)))
    .toArray();

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    completed_at: r.completed_at,
    credits_spent: r.credits_spent,
    duration: r.marketing_video_duration,
    category: r.marketing_video_category,
    provider: r.marketing_video_provider,
    image_count: r.marketing_video_image_count,
    result_urls: r.result_urls || [],
    error: r.error,
    model_used: r.model_used,
  }));
}

module.exports = {
  listMarketingVideoHistory,
};
