import fs from "fs";
import Stripe from "stripe";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv(".env.local");

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error("STRIPE_SECRET_KEY missing");
  process.exit(1);
}

const stripe = new Stripe(key);
const report = { expectedWebhook: "https://www.remakepix.com/api/webhooks/stripe" };

const acct = await stripe.accounts.retrieve();
report.account = {
  id: acct.id,
  country: acct.country,
  default_currency: acct.default_currency,
  email: acct.email,
  business_name: acct.business_profile?.name,
  support_email: acct.business_profile?.support_email,
  support_url: acct.business_profile?.support_url,
  url: acct.business_profile?.url,
  statement_descriptor: acct.settings?.payments?.statement_descriptor,
  branding: acct.settings?.branding,
};

const hooks = await stripe.webhookEndpoints.list({ limit: 20 });
report.webhooks = hooks.data.map((w) => ({
  id: w.id,
  url: w.url,
  status: w.status,
  enabled_events: w.enabled_events,
  api_version: w.api_version,
}));

const products = await stripe.products.list({ limit: 20, active: true });
report.products = products.data.map((p) => ({ id: p.id, name: p.name, active: p.active }));

const prices = await stripe.prices.list({ limit: 20, active: true });
report.prices = prices.data.map((p) => ({
  id: p.id,
  product: p.product,
  currency: p.currency,
  unit_amount: p.unit_amount,
}));

console.log(JSON.stringify(report, null, 2));
