/** Cálculos admin/finanças em memória (Upstash KV ou datasets pequenos). */

async function loadAll(db, names) {
  const out = {};
  for (const n of names) {
    // eslint-disable-next-line no-await-in-loop
    out[n] = await db.collection(n).find({}).toArray();
  }
  return out;
}

async function computeAdminStats(db) {
  const { users, purchases, creations } = await loadAll(db, ["users", "purchases", "creations"]);
  const completed = purchases.filter((p) => p.status === "completed");
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const revenue_eur = completed.reduce((s, p) => s + (Number(p.amount_eur) || 0), 0);
  const revenue_usd = completed.reduce((s, p) => s + (Number(p.amount_usd) || 0), 0);
  const credits_in_circulation = users
    .filter((u) => !u.is_unlimited && (u.credits || 0) < 500000)
    .reduce((s, u) => s + (Number(u.credits) || 0), 0);

  const ipCounts = {};
  for (const u of users) {
    const ip = u.signup_ip;
    if (ip) ipCounts[ip] = (ipCounts[ip] || 0) + 1;
  }
  const risky_ips = Object.values(ipCounts).filter((c) => c >= 2).length;

  return {
    users: users.length,
    creations: creations.length,
    purchases: completed.length,
    revenue_eur,
    revenue_usd,
    credits_in_circulation,
    signups_today: users.filter((u) => u.created_at >= dayStart.toISOString()).length,
    signups_week: users.filter((u) => u.created_at >= weekStart).length,
    risky_ips,
  };
}

async function computeIpGroups(db, minAccounts = 2) {
  const users = await db.collection("users").find({}).toArray();
  const byIp = {};
  for (const u of users) {
    const ip = u.signup_ip || u.last_ip;
    if (!ip) continue;
    if (!byIp[ip]) byIp[ip] = [];
    byIp[ip].push({
      id: u.id,
      email: u.email,
      name: u.name,
      credits: u.credits,
      banned: u.banned,
      created_at: u.created_at,
    });
  }
  return {
    groups: Object.entries(byIp)
      .filter(([, list]) => list.length >= minAccounts)
      .map(([ip, list]) => ({
        ip,
        count: list.length,
        risk: list.length >= 2 ? "high" : "low",
        users: list,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 150),
  };
}

async function computeFinance(db, opts = {}) {
  const { getFinanceConfig, purchaseEconomics } = require("./financeModel.cjs");
  const cfg = getFinanceConfig();
  const { users, purchases, credit_transactions: txs } = await loadAll(
    db,
    ["users", "purchases", "credit_transactions"],
  );
  const completed = purchases.filter((p) => p.status === "completed");
  const buyers = new Set(completed.map((p) => p.user_id).filter(Boolean));

  let revenue_eur = 0;
  let revenue_usd = 0;
  let credits_sold = 0;
  let replicate_reserve_allocated_usd = 0;
  let estimated_margin_usd_total = 0;

  for (const p of completed) {
    credits_sold += Number(p.credits) || 0;
    revenue_eur += Number(p.amount_eur) || 0;
    revenue_usd += Number(p.amount_usd) || 0;
    replicate_reserve_allocated_usd += Number(p.replicate_reserve_usd) || 0;
    estimated_margin_usd_total += Number(p.margin_usd) || 0;
  }

  const credits_in_circulation = users
    .filter((u) => !u.is_unlimited && (u.credits || 0) < 500000)
    .reduce((s, u) => s + (Number(u.credits) || 0), 0);
  const credits_spent = txs
    .filter((t) => t.type === "spend" && t.amount < 0)
    .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);

  const replicate_reserve_needed_usd =
    Math.round(credits_in_circulation * cfg.replicate_usd_per_credit * 100) / 100;
  const replicate_spent_estimated_usd =
    Math.round(credits_spent * cfg.replicate_usd_per_credit * 100) / 100;

  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const purchases_week = completed.filter((p) => p.created_at >= weekStart).length;

  let replicate_balance_usd = null;
  let top_up_recommended_usd = null;
  let balance_ok = null;
  const balanceSource = Number.isFinite(opts.replicate_balance_usd)
    ? opts.replicate_balance_usd
    : NaN;
  if (Number.isFinite(balanceSource)) {
    replicate_balance_usd = balanceSource;
    top_up_recommended_usd = Math.max(
      0,
      Math.round((replicate_reserve_needed_usd - replicate_balance_usd) * 100) / 100,
    );
    balance_ok = replicate_balance_usd >= replicate_reserve_needed_usd;
  } else {
    top_up_recommended_usd = replicate_reserve_needed_usd;
  }

  return {
    config: {
      replicate_usd_per_credit: cfg.replicate_usd_per_credit,
      note: "Custo estimado por crédito do site no Replicate. Ajusta REPLICATE_USD_PER_CREDIT na Vercel se os teus custos reais forem diferentes.",
    },
    unique_buyers: buyers.size,
    purchases_total: completed.length,
    purchases_week,
    revenue_eur: Math.round(revenue_eur * 100) / 100,
    revenue_usd: Math.round(revenue_usd * 100) / 100,
    credits_sold,
    credits_in_circulation,
    credits_spent,
    replicate_reserve_needed_usd,
    replicate_reserve_allocated_usd: Math.round(replicate_reserve_allocated_usd * 100) / 100,
    replicate_spent_estimated_usd,
    estimated_margin_usd_total: Math.round(estimated_margin_usd_total * 100) / 100,
    replicate_balance_usd,
    top_up_recommended_usd,
    balance_ok,
    auto_reload_note:
      "Quando um cliente compra créditos, o site calcula a reserva Replicate e envia alerta automático. Activa Auto reload em replicate.com/account/billing (uma vez) — o Replicate cobra o cartão quando o saldo desce, sem carregamento manual.",
  };
}

module.exports = { computeAdminStats, computeIpGroups, computeFinance };
