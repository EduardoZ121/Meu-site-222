/**
 * Cria/atualiza webhook RemakePix na conta Stripe.
 * Perfil público (nome, URL) deve ser editado no Dashboard — API não permite na conta própria Standard.
 */
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
  console.error("STRIPE_SECRET_KEY em falta em .env.local");
  process.exit(1);
}

const WEBHOOK_URL = "https://www.remakepix.com/api/webhooks/stripe";
const stripe = new Stripe(key);

const acct = await stripe.accounts.retrieve();
console.log("Conta:", acct.id);
console.log("Nome actual:", acct.business_profile?.name);
console.log("URL actual:", acct.business_profile?.url);
console.log("Descriptor:", acct.settings?.payments?.statement_descriptor);

const existing = await stripe.webhookEndpoints.list({ limit: 20 });
let hook = existing.data.find((w) => w.url === WEBHOOK_URL);

if (!hook) {
  hook = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: ["checkout.session.completed", "charge.refunded"],
    description: "RemakePix production",
  });
  console.log("\nWebhook criado:", hook.url);
  fs.writeFileSync("scripts/.stripe-webhook-secret.local", `${hook.secret}\n`, { mode: 0o600 });
  console.log("Signing secret guardado em scripts/.stripe-webhook-secret.local");
} else {
  const events = new Set([...hook.enabled_events, "checkout.session.completed", "charge.refunded"]);
  if (events.size !== hook.enabled_events.length) {
    hook = await stripe.webhookEndpoints.update(hook.id, {
      enabled_events: [...events],
    });
  }
  console.log("\nWebhook do site já existe:", hook.url);
}

console.log("\nOutros webhooks:");
for (const w of existing.data.filter((x) => x.url !== WEBHOOK_URL)) {
  console.log(" -", w.url, `(${w.status})`);
}
