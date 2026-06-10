/** Client-side Studio Plus (30 days after Creator / Studio package). */

export function hasStudioPremium(user) {
  if (!user) return false;
  if (user.is_unlimited || user.role === "admin") return true;
  if (user.studio_premium === true) return true;
  const until = user.studio_premium_until;
  if (!until) return false;
  const ts = Date.parse(until);
  return Number.isFinite(ts) && ts > Date.now();
}

export function studioPremiumDaysLeft(user) {
  if (!hasStudioPremium(user) || user?.is_unlimited) return null;
  const until = user?.studio_premium_until;
  if (!until) return null;
  const ms = Date.parse(until) - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
