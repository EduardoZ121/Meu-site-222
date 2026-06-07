const WEEKLY_TO = String(process.env.WEEKLY_REPORT_EMAIL || "eduardozola121998@gmail.com").trim();
const FROM = String(process.env.REPORT_FROM_EMAIL || "Remake Pixel <noreply@remakepix.com>").trim();

async function sendResendEmail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false, skipped: true, reason: "RESEND_API_KEY not set" };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return { ok: false, error: data.message || data.error || `Resend ${r.status}` };
  }
  return { ok: true, id: data.id };
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatReportHtml(stats, periodLabel) {
  const rows = [
    ["Utilizadores (total)", stats.users],
    ["Registos (últimos 7 dias)", stats.signups_week],
    ["Registos (hoje)", stats.signups_today],
    ["Criações (total)", stats.creations],
    ["Compras concluídas", stats.purchases],
    ["Receita EUR", `€${Number(stats.revenue_eur || 0).toFixed(2)}`],
    ["Receita USD", `$${Number(stats.revenue_usd || 0).toFixed(2)}`],
    ["Créditos em circulação", stats.credits_in_circulation],
    ["IPs com 2+ contas", stats.risky_ips],
  ];
  if (stats.finance) {
    rows.push(
      ["Compradores únicos", stats.finance.unique_buyers],
      ["Reserva Replicate necessária (USD)", `$${Number(stats.finance.replicate_reserve_needed_usd || 0).toFixed(2)}`],
      ["Carregar no Replicate (USD)", `$${Number(stats.finance.top_up_recommended_usd || 0).toFixed(2)}`],
      ["Margem estimada total (USD)", `$${Number(stats.finance.estimated_margin_usd_total || 0).toFixed(2)}`],
    );
  }
  const tr = rows.map(([k, v]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666">${esc(k)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${esc(v)}</td></tr>`).join("");
  let risky = "";
  if (stats.top_risky_ips?.length) {
    risky = `<h3 style="margin:24px 0 8px;font-size:14px;color:#b91c1c">IPs com várias contas</h3><ul style="margin:0;padding-left:20px">${stats.top_risky_ips.map((g) => `<li><strong>${esc(g.ip)}</strong> — ${g.count} contas</li>`).join("")}</ul>`;
  }
  return [
    "<!DOCTYPE html><html><body style=\"font-family:system-ui,sans-serif;background:#f8f8fc;padding:24px\">",
    "<div style=\"max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e8e8f0\">",
    `<h1 style="margin:0 0 4px;font-size:22px">Remake Pixel — ${esc(periodLabel)}</h1>`,
    "<p style=\"margin:0 0 20px;color:#888;font-size:13px\">Relatório semanal automático (sábado)</p>",
    `<table style="width:100%;border-collapse:collapse">${tr}</table>`,
    risky,
    "<p style=\"margin-top:24px;font-size:12px;color:#aaa\">remakepix.com · painel Admin</p>",
    "</div></body></html>",
  ].join("");
}

function formatReportText(stats, periodLabel) {
  return [
    `Remake Pixel — ${periodLabel}`,
    "",
    `Utilizadores: ${stats.users}`,
    `Registos (7d): ${stats.signups_week}`,
    `Registos (hoje): ${stats.signups_today}`,
    `Criações: ${stats.creations}`,
    `Compras: ${stats.purchases}`,
    `Receita EUR: €${Number(stats.revenue_eur || 0).toFixed(2)}`,
    `Receita USD: $${Number(stats.revenue_usd || 0).toFixed(2)}`,
    `Créditos em circulação: ${stats.credits_in_circulation}`,
    `IPs com 2+ contas: ${stats.risky_ips}`,
    stats.finance
      ? [
        "",
        `Compradores únicos: ${stats.finance.unique_buyers}`,
        `Reserva Replicate: $${Number(stats.finance.replicate_reserve_needed_usd || 0).toFixed(2)}`,
        `Carregar no Replicate: $${Number(stats.finance.top_up_recommended_usd || 0).toFixed(2)}`,
        `Margem estimada: $${Number(stats.finance.estimated_margin_usd_total || 0).toFixed(2)}`,
      ].join("\n")
      : "",
  ].join("\n");
}

module.exports = {
  WEEKLY_TO,
  sendResendEmail,
  formatReportHtml,
  formatReportText,
};
