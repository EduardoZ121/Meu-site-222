/**
 * Plano Creator Mensal — €14/mês · 400 créditos (não acumulam) · templates exclusivos · suporte personalizado.
 */
const { getDb, storageEnabled } = require("./mongo.cjs");

const PLAN_ID = "creator_monthly";
const SUPPORT_EMAIL = "suporte@remakepix.com";

const ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS || "eduardozola1998@gmail.com,eduardozola121998@gmail.com,eduardozola11998@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

function nowIso() {
  return new Date().toISOString();
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.has(String(email || "").trim().toLowerCase());
}

function getSubscriptionPlan(regionId = "intl") {
  try {
    const { getRegionConfig } = require("../pricingRegions.cjs");
    const cfg = getRegionConfig(regionId);
    const plan = cfg.subscription?.[PLAN_ID];
    if (!plan) return null;
    return {
      id: PLAN_ID,
      ...plan,
      currency: cfg.currency,
      region: cfg.id,
      amount_display: plan.amount_cents / 100,
    };
  } catch {
    return null;
  }
}

function isSubscriptionActive(doc) {
  if (!doc) return false;
  if (isAdminEmail(doc.email)) return true;
  const status = String(doc.subscription_status || "").toLowerCase();
  if (!["active", "trialing"].includes(status)) return false;
  const end = doc.subscription_period_end;
  if (!end) return status === "active";
  const ts = Date.parse(end);
  return Number.isFinite(ts) ? ts > Date.now() : status === "active";
}

function subscriptionCredits(doc) {
  if (!isSubscriptionActive(doc)) return 0;
  const n = Number(doc.subscription_credits);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function spendableStandardCredits(doc) {
  if (!doc) return 0;
  if (isAdminEmail(doc.email)) return Number(doc.credits) || 999999999;
  const purchased = Number(doc.credits);
  const safePurchased = Number.isFinite(purchased) && purchased > 0 ? purchased : 0;
  return safePurchased + subscriptionCredits(doc);
}

function publicSubscriptionFields(doc) {
  const active = isSubscriptionActive(doc);
  const subCredits = subscriptionCredits(doc);
  const purchased = Number(doc?.credits);
  const safePurchased = Number.isFinite(purchased) && purchased >= 0 ? purchased : 0;
  return {
    subscription_credits: subCredits,
    total_standard_credits: safePurchased + subCredits,
    subscription: {
      active,
      plan: active ? (doc?.subscription_plan || PLAN_ID) : null,
      status: doc?.subscription_status || "none",
      period_end: doc?.subscription_period_end || null,
      support_email: SUPPORT_EMAIL,
      personalized_requests_per_month: 2,
      personalized_sla_hours: "24–48",
      can_manage: Boolean(doc?.stripe_customer_id),
    },
  };
}

async function findUserByStripeCustomerId(customerId) {
  if (!storageEnabled() || !customerId) return null;
  const db = await getDb();
  return db.collection("users").findOne(
    { stripe_customer_id: String(customerId) },
    { projection: { _id: 0, password_hash: 0 } },
  );
}

async function findUserByStripeSubscriptionId(subId) {
  if (!storageEnabled() || !subId) return null;
  const db = await getDb();
  return db.collection("users").findOne(
    { stripe_subscription_id: String(subId) },
    { projection: { _id: 0, password_hash: 0 } },
  );
}

async function applySubscriptionFromStripe(subscription, userIdHint = null) {
  if (!storageEnabled() || !subscription?.id) return null;
  const db = await getDb();
  const subId = String(subscription.id);
  const customerId = String(subscription.customer || "");
  let doc = userIdHint
    ? await db.collection("users").findOne({ id: userIdHint }, { projection: { _id: 0, password_hash: 0 } })
    : null;
  if (!doc && customerId) doc = await findUserByStripeCustomerId(customerId);
  if (!doc && subId) doc = await findUserByStripeSubscriptionId(subId);
  if (!doc) return null;

  const region = doc.pricing_region || "intl";
  const plan = getSubscriptionPlan(region);
  const monthlyCredits = Number(plan?.credits_per_month) || 400;
  const status = String(subscription.status || "none").toLowerCase();
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const $set = {
    stripe_customer_id: customerId || doc.stripe_customer_id || null,
    stripe_subscription_id: subId,
    subscription_plan: PLAN_ID,
    subscription_status: status,
    subscription_period_end: periodEnd,
    subscription_updated_at: nowIso(),
  };

  if (["active", "trialing"].includes(status)) {
    $set.subscription_credits = monthlyCredits;
  } else if (["canceled", "unpaid", "incomplete_expired"].includes(status)) {
    $set.subscription_credits = 0;
  }

  await db.collection("users").updateOne({ id: doc.id }, { $set });
  return db.collection("users").findOne({ id: doc.id }, { projection: { _id: 0, password_hash: 0 } });
}

async function renewSubscriptionCreditsFromInvoice(invoice) {
  if (!storageEnabled()) return null;
  const subId = invoice?.subscription;
  if (!subId) return null;
  const db = await getDb();
  const doc = await findUserByStripeSubscriptionId(String(subId));
  if (!doc) return null;
  const region = doc.pricing_region || "intl";
  const plan = getSubscriptionPlan(region);
  const monthlyCredits = Number(plan?.credits_per_month) || 400;
  const status = String(doc.subscription_status || "").toLowerCase();
  if (!["active", "trialing"].includes(status)) return null;

  await db.collection("users").updateOne(
    { id: doc.id },
    {
      $set: {
        subscription_credits: monthlyCredits,
        subscription_last_renewal: nowIso(),
      },
    },
  );

  await db.collection("credit_transactions").insertOne({
    id: `tx_sub_${Date.now().toString(36)}`,
    user_id: doc.id,
    amount: monthlyCredits,
    type: "subscription_renewal",
    description: `Creator Mensal — ${monthlyCredits} créditos (ciclo mensal)`,
    wallet: "subscription",
    stripe_invoice_id: invoice.id || null,
    created_at: nowIso(),
  });

  return monthlyCredits;
}

async function activateSubscriptionFromCheckout(session) {
  if (!storageEnabled() || !session?.subscription) return null;
  const userId = session.metadata?.user_id;
  if (!userId) return null;
  const stripe = require("stripe")(String(process.env.STRIPE_SECRET_KEY || "").trim());
  const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
  return applySubscriptionFromStripe(subscription, userId);
}

module.exports = {
  PLAN_ID,
  SUPPORT_EMAIL,
  getSubscriptionPlan,
  isSubscriptionActive,
  subscriptionCredits,
  spendableStandardCredits,
  publicSubscriptionFields,
  findUserByStripeCustomerId,
  findUserByStripeSubscriptionId,
  applySubscriptionFromStripe,
  renewSubscriptionCreditsFromInvoice,
  activateSubscriptionFromCheckout,
};
