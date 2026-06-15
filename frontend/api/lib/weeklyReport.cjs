const { adminStats, adminIpGroups, adminFinance } = require("./adminHandlers.cjs");
const { storageEnabled } = require("./mongo.cjs");
const {
  WEEKLY_TO,
  sendResendEmail,
  formatReportHtml,
  formatReportText,
} = require("./emailReport.cjs");

function periodLabel() {
  const d = new Date();
  return `Semana até ${d.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
}

async function buildWeeklyStats() {
  const stats = await adminStats();
  const { groups } = await adminIpGroups(2);
  stats.top_risky_ips = (groups || []).slice(0, 10).map((g) => ({ ip: g.ip, count: g.count }));
  try {
    const fin = await adminFinance();
    stats.finance = {
      unique_buyers: fin.unique_buyers,
      credits_spent: fin.credits_spent,
      replicate_spent_estimated_usd: fin.replicate_spent_estimated_usd,
      replicate_reserve_needed_usd: fin.replicate_reserve_needed_usd,
      top_up_recommended_usd: fin.top_up_recommended_usd,
      estimated_margin_usd_total: fin.estimated_margin_usd_total,
      replicate_balance_usd: fin.replicate_balance_usd,
      balance_ok: fin.balance_ok,
      credits_in_circulation: fin.credits_in_circulation,
    };
  } catch {
    stats.finance = null;
  }
  return stats;
}

async function runWeeklyReport() {
  if (!storageEnabled()) {
    return { ok: false, skipped: true, reason: "Storage not configured" };
  }
  const stats = await buildWeeklyStats();
  const label = periodLabel();
  const subject = `Remake Pixel — resumo semanal (${new Date().toLocaleDateString("pt-PT")})`;
  const html = formatReportHtml(stats, label);
  const text = formatReportText(stats, label);
  const sent = await sendResendEmail({ to: WEEKLY_TO, subject, html, text });
  return { ok: sent.ok, stats, email: sent };
}

module.exports = { runWeeklyReport, buildWeeklyStats };
