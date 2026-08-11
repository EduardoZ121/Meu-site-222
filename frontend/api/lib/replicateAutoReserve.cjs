/**
 * Sincronização automática Stripe → reserva Replicate.
 *
 * A Replicate não expõe API para comprar créditos. O fluxo automático é:
 * 1. Cliente compra créditos → calculamos reserva Replicate e alertamos
 * 2. Gastos descontam saldo rastreado (estimativa)
 * 3. Webhook opcional (REPLICATE_PURCHASE_SYNC_WEBHOOK_URL) para n8n/Zapier
 * 4. Auto reload no cartão em replicate.com/account/billing (activar uma vez)
 */
const { getDb, storageEnabled, ensureIndexes } = require("./mongo.cjs");
const { getFinanceConfig, purchaseEconomics, aggregateFinance } = require("./financeModel.cjs");
const { sendResendEmail } = require("./emailReport.cjs");
const { ADMIN_EMAILS } = require("./usersDb.cjs");

const FINANCE_SETTINGS_ID = "finance";

function nowIso() {
  return new Date().toISOString();
}

function alertEmails() {
  const raw = String(process.env.REPLICATE_ALERT_EMAIL || process.env.WEEKLY_REPORT_EMAIL || "").trim();
  if (raw) return raw.split(",").map((e) => e.trim()).filter(Boolean);
  return [...ADMIN_EMAILS];
}

function alertsEnabled() {
  return String(process.env.REPLICATE_PURCHASE_ALERT || "1").trim() !== "0";
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function getFinanceSettingsDoc(db) {
  return db.collection("platform_settings").findOne({ _id: FINANCE_SETTINGS_ID }) || {};
}

async function resolveTrackedBalance(db) {
  const doc = await getFinanceSettingsDoc(db);
  if (Number.isFinite(doc.replicate_balance_tracked_usd)) return doc.replicate_balance_tracked_usd;
  if (Number.isFinite(doc.replicate_balance_usd)) return doc.replicate_balance_usd;
  const cfg = getFinanceConfig();
  if (Number.isFinite(cfg.replicate_balance_usd)) return cfg.replicate_balance_usd;
  return null;
}

async function recommendAutoReload(db) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const rows = await db.collection("purchases").aggregate([
    { $match: { status: "completed", created_at: { $gte: since } } },
    {
      $group: {
        _id: null,
        avg: { $avg: { $ifNull: ["$replicate_reserve_usd", 0] } },
        max: { $max: { $ifNull: ["$replicate_reserve_usd", 0] } },
        count: { $sum: 1 },
      },
    },
  ]).toArray();
  const avg = Math.max(0, Number(rows[0]?.avg) || 0);
  const max = Math.max(0, Number(rows[0]?.max) || 0);
  const base = Math.max(avg, max * 0.5, 5);
  const threshold_usd = Math.max(5, Math.round(base * 2 * 100) / 100);
  const reload_balance_usd = Math.max(15, Math.round(threshold_usd * 5 * 100) / 100);
  return {
    threshold_usd,
    reload_balance_usd,
    based_on_purchases_30d: rows[0]?.count || 0,
    avg_reserve_usd: Math.round(avg * 100) / 100,
  };
}

async function buildReserveSnapshot(db) {
  const tracked = await resolveTrackedBalance(db);
  const finance = await aggregateFinance(db, {
    replicate_balance_usd: Number.isFinite(tracked) ? tracked : undefined,
  });
  const auto_reload = await recommendAutoReload(db);
  return { finance, tracked_balance_usd: tracked, auto_reload };
}

async function postPurchaseWebhook(payload) {
  const url = String(process.env.REPLICATE_PURCHASE_SYNC_WEBHOOK_URL || "").trim();
  if (!url) return { ok: false, skipped: true, reason: "webhook_not_configured" };
  const headers = { "Content-Type": "application/json" };
  const secret = String(process.env.REPLICATE_PURCHASE_SYNC_WEBHOOK_SECRET || "").trim();
  if (secret) headers.Authorization = `Bearer ${secret}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return { ok: false, status: res.status, error: text.slice(0, 200) || `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e.message || e).slice(0, 200) };
  }
}

function purchaseAlertHtml(payload) {
  const urgent = payload.urgent_top_up;
  const box = urgent
    ? "background:#fef2f2;border:1px solid #fecaca;color:#b91c1c"
    : "background:#f0fdf4;border:1px solid #bbf7d0;color:#166534";
  return [
    "<!DOCTYPE html><html><body style=\"font-family:system-ui,sans-serif;background:#f8f8fc;padding:24px\">",
    "<div style=\"max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e8e8f0\">",
    `<h1 style="margin:0 0 8px;font-size:20px">Nova compra de créditos — sync Replicate</h1>`,
    `<p style="margin:0 0 16px;color:#666;font-size:13px">${esc(payload.created_at)}</p>`,
    `<div style="padding:14px 16px;border-radius:8px;${box}">`,
    urgent
      ? `<strong>⚠ Carregar Replicate recomendado: $${esc(payload.top_up_recommended_usd)}</strong>`
      : `<strong>✓ Reserva dentro do saldo rastreado</strong>`,
    "</div>",
    "<table style=\"width:100%;border-collapse:collapse;margin-top:16px\">",
    `<tr><td style="padding:8px 0;color:#666">Créditos vendidos</td><td style="padding:8px 0;font-weight:600;text-align:right">${esc(payload.credits)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#666">Reserva desta compra</td><td style="padding:8px 0;font-weight:600;text-align:right">$${esc(payload.replicate_reserve_usd)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#666">Saldo rastreado</td><td style="padding:8px 0;font-weight:600;text-align:right">${payload.replicate_balance_tracked_usd != null ? `$${esc(payload.replicate_balance_tracked_usd)}` : "—"}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#666">Reserva total necessária</td><td style="padding:8px 0;font-weight:600;text-align:right">$${esc(payload.replicate_reserve_needed_usd)}</td></tr>`,
    `<tr><td style="padding:8px 0;color:#666">Auto reload sugerido</td><td style="padding:8px 0;font-weight:600;text-align:right">limiar $${esc(payload.recommended_auto_reload.threshold_usd)} → $${esc(payload.recommended_auto_reload.reload_balance_usd)}</td></tr>`,
    "</table>",
    `<p style="margin:16px 0 8px;font-size:13px;color:#444">${esc(payload.auto_reload_setup_note)}</p>`,
    `<p style="margin:0"><a href="${esc(payload.replicate_billing_url)}" style="color:#7c3aed">Abrir billing Replicate →</a></p>`,
    "<p style=\"margin-top:20px;font-size:11px;color:#aaa\">remakepix.com · sync automático pós-compra</p>",
    "</div></body></html>",
  ].join("");
}

async function sendPurchaseAlert(payload) {
  if (!alertsEnabled()) return { ok: false, skipped: true, reason: "alerts_disabled" };
  const to = alertEmails();
  if (!to.length) return { ok: false, skipped: true, reason: "no_recipients" };
  const subject = payload.urgent_top_up
    ? `[RemakePix] Compra ${payload.credits} cr — carregar ~$${payload.top_up_recommended_usd} no Replicate`
    : `[RemakePix] Compra ${payload.credits} cr — reserva Replicate +$${payload.replicate_reserve_usd}`;
  const text = [
    `Compra: ${payload.credits} créditos`,
    `Reserva Replicate desta compra: $${payload.replicate_reserve_usd}`,
    `Saldo rastreado: ${payload.replicate_balance_tracked_usd ?? "—"}`,
    `Reserva total necessária: $${payload.replicate_reserve_needed_usd}`,
    `Carregar recomendado: $${payload.top_up_recommended_usd}`,
    `Auto reload sugerido: limiar $${payload.recommended_auto_reload.threshold_usd}, recarregar até $${payload.recommended_auto_reload.reload_balance_usd}`,
    payload.replicate_billing_url,
  ].join("\n");
  return sendResendEmail({
    to,
    subject,
    html: purchaseAlertHtml(payload),
    text,
  });
}

/**
 * Desconta estimativa Replicate quando o utilizador gasta créditos.
 */
async function trackReplicateSpend(creditsSpent) {
  if (!storageEnabled()) return;
  const cost = Math.abs(Number(creditsSpent) || 0);
  if (cost <= 0) return;
  const cfg = getFinanceConfig();
  const usd = Math.round(cost * cfg.replicate_usd_per_credit * 100) / 100;
  if (usd <= 0) return;
  const db = await getDb();
  const doc = await getFinanceSettingsDoc(db);
  const current = Number.isFinite(doc.replicate_balance_tracked_usd)
    ? doc.replicate_balance_tracked_usd
    : doc.replicate_balance_usd;
  if (!Number.isFinite(current)) return;
  const next = Math.max(0, Math.round((current - usd) * 100) / 100);
  await db.collection("platform_settings").updateOne(
    { _id: FINANCE_SETTINGS_ID },
    {
      $set: {
        replicate_balance_tracked_usd: next,
        replicate_balance_usd: next,
        updated_at: nowIso(),
      },
    },
    { upsert: true },
  );
}

/**
 * Chamado após cada compra Stripe nova (idempotente por sessionId).
 */
async function onCreditPurchase({
  sessionId,
  userId,
  credits,
  amount,
  currency,
  packageId,
  pricingRegion,
}) {
  if (!storageEnabled() || !sessionId) return null;
  await ensureIndexes();
  const db = await getDb();

  const existing = await db.collection("replicate_sync_events").findOne({
    type: "purchase",
    stripe_session_id: sessionId,
  });
  if (existing?.result) return existing.result;

  const purchase = await db.collection("purchases").findOne({ stripe_session_id: sessionId });
  const econ = purchaseEconomics({
    amount: purchase?.amount_eur || purchase?.amount_usd || amount,
    currency: purchase?.currency || currency,
    credits: purchase?.credits || credits,
  });
  const reserve = purchase?.replicate_reserve_usd ?? econ.replicate_reserve_usd;
  const snapshot = await buildReserveSnapshot(db);

  const payload = {
    event: "credit_purchase",
    stripe_session_id: sessionId,
    user_id: userId,
    package_id: packageId || purchase?.package || "unknown",
    pricing_region: pricingRegion || purchase?.pricing_region || "intl",
    credits: Number(credits) || purchase?.credits || 0,
    replicate_reserve_usd: reserve,
    replicate_balance_tracked_usd: snapshot.tracked_balance_usd,
    replicate_reserve_needed_usd: snapshot.finance.replicate_reserve_needed_usd,
    top_up_recommended_usd: snapshot.finance.top_up_recommended_usd,
    balance_ok: snapshot.finance.balance_ok,
    urgent_top_up: snapshot.finance.balance_ok === false,
    recommended_auto_reload: snapshot.auto_reload,
    replicate_billing_url: "https://replicate.com/account/billing",
    auto_reload_setup_note:
      "Activa Auto reload em replicate.com/account/billing (uma vez). Quando o saldo desce abaixo do limiar, o Replicate cobra o cartão automaticamente — equivalente a comprar créditos Replicate quando vendes no site.",
    created_at: nowIso(),
  };

  const webhook = await postPurchaseWebhook(payload);
  const email = await sendPurchaseAlert(payload);

  await db.collection("platform_settings").updateOne(
    { _id: FINANCE_SETTINGS_ID },
    {
      $set: {
        last_purchase_sync_at: payload.created_at,
        last_purchase_replicate_reserve_usd: reserve,
        recommended_auto_reload: snapshot.auto_reload,
        replicate_sync_status: payload.urgent_top_up ? "top_up_needed" : "ok",
        replicate_auto_reload_note: payload.auto_reload_setup_note,
      },
      $inc: { replicate_purchase_sync_count: 1 },
    },
    { upsert: true },
  );

  await db.collection("replicate_sync_events").insertOne({
    id: `rsync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: "purchase",
    stripe_session_id: sessionId,
    result: payload,
    webhook,
    email,
    created_at: payload.created_at,
  });

  return { ...payload, webhook, email };
}

function scheduleCreditPurchaseSync(args) {
  onCreditPurchase(args).catch((err) => {
    console.error("[replicate-auto-reserve]", err?.message || err);
  });
}

async function getReplicateSyncStatus(db) {
  const doc = await getFinanceSettingsDoc(db);
  const lastEvent = await db.collection("replicate_sync_events")
    .find({ type: "purchase" }, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .limit(1)
    .toArray();
  return {
    status: doc.replicate_sync_status || "unknown",
    last_sync_at: doc.last_purchase_sync_at || null,
    last_reserve_usd: doc.last_purchase_replicate_reserve_usd ?? null,
    sync_count: doc.replicate_purchase_sync_count ?? 0,
    tracked_balance_usd: doc.replicate_balance_tracked_usd ?? doc.replicate_balance_usd ?? null,
    recommended_auto_reload: doc.recommended_auto_reload || null,
    auto_reload_note: doc.replicate_auto_reload_note || null,
    webhook_configured: Boolean(String(process.env.REPLICATE_PURCHASE_SYNC_WEBHOOK_URL || "").trim()),
    alerts_enabled: alertsEnabled(),
    last_event: lastEvent[0] || null,
  };
}

module.exports = {
  onCreditPurchase,
  scheduleCreditPurchaseSync,
  trackReplicateSpend,
  getReplicateSyncStatus,
  recommendAutoReload,
  resolveTrackedBalance,
};
