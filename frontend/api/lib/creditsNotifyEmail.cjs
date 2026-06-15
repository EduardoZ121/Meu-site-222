const { sendResendEmail } = require("./emailReport.cjs");
const { buildPromoEmailHtml, absUrl } = require("./emailBranding.cjs");
const { isValidEmail } = require("./videoNotifyEmail.cjs");

function creditsGrantedCopy(lang, amount, balance) {
  const l = String(lang || "pt").slice(0, 2).toLowerCase();
  if (l === "en") {
    return {
      subject: `🎁 +${amount} credits added — Remake Pixel`,
      preheader: `Your new balance is ${balance} credits. Open the studio and create.`,
      badge: "CREDITS ADDED",
      headline: "Fresh credits landed in your account",
      subheadline: "You're ready to create — images, posters, and video.",
      body: `We added ${amount} credits to your Remake Pixel wallet.`,
      balanceLabel: "New balance",
      balanceSub: "Use anytime · no expiry",
      cta: "Open studio",
      billing: "View billing",
      bullets: [
        "Credits never expire on your account",
        "Use for images, posters, tools and video",
        "Buy more anytime from billing",
      ],
    };
  }
  return {
    subject: `🎁 +${amount} créditos — Remake Pixel`,
    preheader: `O teu saldo actual é ${balance} créditos. Abre o estúdio e cria.`,
    badge: "CRÉDITOS ADICIONADOS",
    headline: "Créditos frescos na tua conta",
    subheadline: "Estás pronto para criar — imagens, pósteres e vídeo.",
    body: `Adicionámos ${amount} créditos à tua carteira Remake Pixel.`,
    balanceLabel: "Saldo actual",
    balanceSub: "Usa quando quiseres · sem expiração",
    cta: "Abrir estúdio",
    billing: "Ver facturação",
    bullets: [
      "Os créditos não expiram na tua conta",
      "Usa em imagens, pósteres, ferramentas e vídeo",
      "Compra mais quando precisares",
    ],
  };
}

async function sendCreditsGrantedEmail({ to, lang, amount, balance, reason }) {
  const email = String(to || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, skipped: true, reason: "invalid_email" };
  }
  const amt = Math.round(Number(amount) || 0);
  const bal = Math.round(Number(balance) || 0);
  const copy = creditsGrantedCopy(lang, amt, bal);
  const reasonLine = String(reason || "").trim();

  const html = buildPromoEmailHtml({
    preheader: copy.preheader,
    heroImageUrl: "/marketing-email/campaign-creator-pack.png",
    badge: copy.badge,
    headline: copy.headline,
    subheadline: copy.subheadline,
    paragraphs: [
      copy.body,
      reasonLine ? `Nota da equipa: ${reasonLine}` : "",
    ].filter(Boolean),
    highlight: {
      label: copy.balanceLabel,
      value: `+${amt} → ${bal} cr`,
      sub: copy.balanceSub,
    },
    bullets: copy.bullets,
    ctaPrimary: { label: copy.cta, url: "/app/tools" },
    ctaSecondary: { label: copy.billing, url: "/app/billing" },
    footerLines: [
      "Remake Pixel · remakepix.com",
      "Créditos oferecidos pela equipa Remake Pixel.",
    ],
  });

  const text = [
    copy.headline,
    copy.subheadline,
    "",
    copy.body,
    reasonLine ? `Nota: ${reasonLine}` : "",
    "",
    `${copy.balanceLabel}: ${bal} créditos (+${amt})`,
    "",
    `${copy.cta}: ${absUrl("/app/tools")}`,
    `${copy.billing}: ${absUrl("/app/billing")}`,
  ].filter(Boolean).join("\n");

  const result = await sendResendEmail({
    to: email,
    subject: copy.subject,
    html,
    text,
  });

  if (!result.ok) {
    console.error("[credits-grant-email] send failed", {
      to: email,
      reason: result.reason || result.error || "unknown",
    });
  } else {
    console.info("[credits-grant-email] sent", { to: email, amount: amt, id: result.id });
  }
  return result;
}

module.exports = {
  sendCreditsGrantedEmail,
};
