/**
 * Modelo económico: créditos do site vs custo estimado Replicate (USD).
 * Ajustável via REPLICATE_USD_PER_CREDIT no ambiente.
 */

function numEnv(name, fallback) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

function getFinanceConfig() {
  return {
    replicate_usd_per_credit: numEnv("REPLICATE_USD_PER_CREDIT", 0.02),
    stripe_pct: numEnv("STRIPE_FEE_PERCENT", 0.029),
    stripe_fixed_eur: numEnv("STRIPE_FEE_FIXED_EUR", 0.25),
    stripe_fixed_usd: numEnv("STRIPE_FEE_FIXED_USD", 0.3),
    eur_usd: numEnv("EUR_USD_RATE", 1.08),
    /** Saldo Replicate que o admin reportou (opcional, para alertas). */
    replicate_balance_usd: numEnv("REPLICATE_BALANCE_USD", NaN),
  };
}

function stripeFee(amount, currency, cfg = getFinanceConfig()) {
  const fixed = currency === "usd" ? cfg.stripe_fixed_usd : cfg.stripe_fixed_eur;
  return amount * cfg.stripe_pct + fixed;
}

function toUsd(amount, currency, cfg = getFinanceConfig()) {
  if (currency === "usd") return amount;
  return amount * cfg.eur_usd;
}

/** Por compra: reserva Replicate, taxa Stripe, margem estimada. */
function purchaseEconomics({ amount, currency, credits }) {
  const cfg = getFinanceConfig();
  const cr = Math.max(0, Number(credits) || 0);
  const amt = Math.max(0, Number(amount) || 0);
  const replicate_reserve_usd = cr * cfg.replicate_usd_per_credit;
  const fee = stripeFee(amt, currency, cfg);
  const revenue_usd = toUsd(amt, currency, cfg);
  const margin_usd = revenue_usd - toUsd(fee, currency, cfg) - replicate_reserve_usd;
  return {
    replicate_reserve_usd: Math.round(replicate_reserve_usd * 100) / 100,
    stripe_fee: Math.round(fee * 100) / 100,
    margin_usd: Math.round(margin_usd * 100) / 100,
    revenue_usd: Math.round(revenue_usd * 100) / 100,
    replicate_usd_per_credit: cfg.replicate_usd_per_credit,
  };
}

async function aggregateFinance(db, opts = {}) {
  const cfg = getFinanceConfig();
  const reportedBalance = opts.replicate_balance_usd;
  const matchCompleted = { status: "completed" };

  const buyers = await db.collection("purchases").distinct("user_id", matchCompleted);
  const purchaseCount = await db.collection("purchases").countDocuments(matchCompleted);

  const rev = await db.collection("purchases").aggregate([
    { $match: matchCompleted },
    {
      $group: {
        _id: null,
        eur: { $sum: { $ifNull: ["$amount_eur", 0] } },
        usd: { $sum: { $ifNull: ["$amount_usd", 0] } },
        credits_sold: { $sum: { $ifNull: ["$credits", 0] } },
        reserve_usd: { $sum: { $ifNull: ["$replicate_reserve_usd", 0] } },
        margin_usd: { $sum: { $ifNull: ["$margin_usd", 0] } },
      },
    },
  ]).toArray();
  const agg = rev[0] || {};

  const cred = await db.collection("users").aggregate([
    { $match: { is_unlimited: { $ne: true }, credits: { $lt: 500000 } } },
    { $group: { _id: null, total: { $sum: { $ifNull: ["$credits", 0] } } } },
  ]).toArray();
  const credits_in_circulation = cred[0]?.total || 0;

  const spent = await db.collection("credit_transactions").aggregate([
    { $match: { type: "spend", amount: { $lt: 0 } } },
    { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } },
  ]).toArray();
  const credits_spent = spent[0]?.total || 0;

  const replicate_reserve_needed_usd =
    Math.round(credits_in_circulation * cfg.replicate_usd_per_credit * 100) / 100;
  const replicate_spent_estimated_usd =
    Math.round(credits_spent * cfg.replicate_usd_per_credit * 100) / 100;
  const replicate_reserve_allocated_usd =
    Math.round((agg.reserve_usd || 0) * 100) / 100;

  let replicate_balance_usd = null;
  let top_up_recommended_usd = null;
  let balance_ok = null;
  const balanceSource = Number.isFinite(reportedBalance)
    ? reportedBalance
    : (Number.isFinite(cfg.replicate_balance_usd) ? cfg.replicate_balance_usd : NaN);
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

  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekPurchases = await db.collection("purchases").countDocuments({
    ...matchCompleted,
    created_at: { $gte: weekStart },
  });

  return {
    config: {
      replicate_usd_per_credit: cfg.replicate_usd_per_credit,
      note: "Custo estimado por crédito do site no Replicate. Ajusta REPLICATE_USD_PER_CREDIT na Vercel se os teus custos reais forem diferentes.",
    },
    unique_buyers: buyers.filter(Boolean).length,
    purchases_total: purchaseCount,
    purchases_week: weekPurchases,
    revenue_eur: Math.round((agg.eur || 0) * 100) / 100,
    revenue_usd: Math.round((agg.usd || 0) * 100) / 100,
    credits_sold: agg.credits_sold || 0,
    credits_in_circulation,
    credits_spent,
    replicate_reserve_needed_usd,
    replicate_reserve_allocated_usd,
    replicate_spent_estimated_usd,
    estimated_margin_usd_total: Math.round((agg.margin_usd || 0) * 100) / 100,
    replicate_balance_usd,
    top_up_recommended_usd,
    balance_ok,
    auto_reload_note:
      "Quando um cliente compra créditos, o site calcula a reserva Replicate e envia alerta automático. Activa Auto reload em replicate.com/account/billing (uma vez) — o Replicate cobra o cartão quando o saldo desce, sem carregamento manual.",
  };
}

module.exports = {
  getFinanceConfig,
  purchaseEconomics,
  aggregateFinance,
  stripeFee,
};
