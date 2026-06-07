/** Studio Plus: 30-day unlock after Creator (€12) or Studio package purchase. */

const PREMIUM_DAYS = 30;
const PREMIUM_PACKAGES = new Set(["creator", "studio"]);

function isStudioPremiumActive(doc) {
  if (!doc) return false;
  const until = doc.studio_premium_until;
  if (!until) return false;
  const ts = Date.parse(until);
  return Number.isFinite(ts) && ts > Date.now();
}

function packageGrantsStudioPremium(packageId) {
  return PREMIUM_PACKAGES.has(String(packageId || "").trim());
}

async function grantStudioPremium(userId) {
  const { storageEnabled, getDb } = require("./mongo.cjs");
  if (!storageEnabled() || !userId) return null;
  const db = await getDb();
  const until = new Date(Date.now() + PREMIUM_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.collection("users").updateOne(
    { id: userId },
    { $set: { studio_premium_until: until } },
  );
  return until;
}

module.exports = {
  PREMIUM_DAYS,
  PREMIUM_PACKAGES,
  isStudioPremiumActive,
  packageGrantsStudioPremium,
  grantStudioPremium,
};
