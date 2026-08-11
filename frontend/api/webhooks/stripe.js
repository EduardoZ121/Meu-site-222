/**
 * POST /api/webhooks/stripe — Stripe webhook (checkout, subscriptions, refunds).
 * Configure in Stripe Dashboard: https://www.remakepix.com/api/webhooks/stripe
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 */
const Stripe = require("stripe");
const { getRegionConfig } = require("../pricingRegions.cjs");
const {
  fulfillStripeCheckoutSession,
  findPurchaseBySessionId,
  addCredits,
  addPremiumCredits,
  storageEnabled,
} = require("../lib/usersDb.cjs");
const {
  activateSubscriptionFromCheckout,
  applySubscriptionFromStripe,
  renewSubscriptionCreditsFromInvoice,
} = require("../lib/creatorSubscription.cjs");

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const secret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  const key = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!secret || !key) {
    return res.status(503).json({ detail: "Stripe webhook not configured." });
  }
  if (!storageEnabled()) {
    return res.status(503).json({ detail: "Storage not configured." });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).json({ detail: "Missing stripe-signature." });
  }

  let event;
  const stripe = new Stripe(key);
  try {
    const raw = Buffer.isBuffer(req.body)
      ? req.body
      : await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return res.status(400).json({ detail: `Webhook signature failed: ${e.message}` });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        await activateSubscriptionFromCheckout(session);
      } else if (session.payment_status === "paid") {
        const meta = session.metadata || {};
        const userId = meta.user_id;
        const wallet = meta.wallet || "standard";
        if (wallet === "subscription") {
          /* handled via subscription activate */
        } else {
          const credits = Number(meta.credits || 0);
          const premiumCredits = Number(meta.premium_credits || 0);
          const packageId = meta.package || "unknown";
          const pricingRegion = meta.pricing_region || "intl";
          const isPremium = wallet === "premium";
          const units = isPremium ? premiumCredits : credits;
          if (userId && units > 0) {
            const cfg = getRegionConfig(pricingRegion);
            const pkg = !isPremium && packageId && packageId !== "custom" ? cfg.packages[packageId] : null;
            const hqPkg = isPremium && packageId ? (cfg.premium_packages || {})[packageId] : null;
            const amount = pkg
              ? pkg.amount_cents / 100
              : hqPkg
                ? hqPkg.amount_cents / 100
                : typeof session.amount_total === "number"
                  ? session.amount_total / 100
                  : 0;
            await fulfillStripeCheckoutSession({
              userId,
              sessionId: session.id,
              packageId,
              credits,
              premiumCredits,
              wallet,
              amount,
              currency: cfg.currency || "eur",
              pricingRegion,
            });
          }
        }
      }
    } else if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await renewSubscriptionCreditsFromInvoice(invoice);
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      await applySubscriptionFromStripe(subscription);
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const pi = charge.payment_intent;
      if (pi) {
        const sessions = await stripe.checkout.sessions.list({ payment_intent: pi, limit: 1 });
        const session = sessions.data?.[0];
        if (session?.id) {
          const purchase = await findPurchaseBySessionId(session.id);
          const userId = purchase?.user_id || session.metadata?.user_id;
          const wallet = purchase?.wallet || session.metadata?.wallet || "standard";
          const isPremium = wallet === "premium";
          const credits = Number(purchase?.credits || session.metadata?.credits || 0);
          const premiumCredits = Number(purchase?.premium_credits || session.metadata?.premium_credits || 0);
          const refundUnits = isPremium ? premiumCredits : credits;
          if (userId && refundUnits > 0 && purchase?.status !== "refunded") {
            if (isPremium) {
              await addPremiumCredits(userId, -premiumCredits, "refund", "Stripe refund", {
                stripe_session_id: session.id,
              });
            } else {
              await addCredits(userId, -credits, "refund", "Stripe refund", {
                stripe_session_id: session.id,
              });
            }
            const { getDb } = require("../lib/mongo.cjs");
            const db = await getDb();
            await db.collection("purchases").updateOne(
              { stripe_session_id: session.id },
              { $set: { status: "refunded" } },
            );
          }
        }
      }
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error("[stripe-webhook]", e);
    return res.status(500).json({ detail: e.message || "Webhook handler failed." });
  }
};
