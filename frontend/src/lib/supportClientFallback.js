/** Offline Sofia replies when API is unavailable or account is local-only. */

import { SITE_ORIGIN } from "./siteConfig";

function firstName(user) {
  const raw = String(user?.name || "").trim();
  if (raw.length > 1) return raw.split(/\s+/)[0];
  const email = String(user?.email || "").split("@")[0] || "";
  if (email.length >= 2 && !email.startsWith("google")) {
    return email.charAt(0).toUpperCase() + email.slice(1).replace(/[._0-9]+/g, " ").trim().split(/\s+/)[0];
  }
  return "";
}

function replyFor(lang, user, userText) {
  const name = firstName(user);
  const hey = name
    ? (lang === "en" ? `Hey ${name}` : lang === "es" ? `Hola ${name}` : lang === "fr" ? `Salut ${name}` : `Olá ${name}`)
    : (lang === "en" ? "Hey" : lang === "es" ? "Hola" : lang === "fr" ? "Salut" : "Olá");
  const text = String(userText || "").toLowerCase();
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_ORIGIN;

  if (/crédit|credit|credito|crédito/.test(text)) {
    if (lang === "en") {
      return `${hey}! Credits are spent when you hit Generate. Check your balance in [Billing](${origin}/app/billing) — the Creator pack (€12) also unlocks Studio Plus for 30 days (1080p video, prompt enhance, HD images).`;
    }
    return `${hey}! Os créditos gastam-se ao carregar em Gerar. Vê o saldo em [Faturação](${origin}/app/billing) — o pacote Creator (12€) desbloqueia Studio Plus durante 30 dias (vídeo 1080p, melhorar prompt, imagens HD).`;
  }

  if (/vídeo|video|clip/.test(text)) {
    if (lang === "en") {
      return `${hey}! For video go to [Video](${origin}/app/video) — text/image clips use 4–8s. Video-to-video: upload a short clip (max 10s), pick duration, and describe the change.`;
    }
    return `${hey}! Para vídeo abre [Vídeo](${origin}/app/video) — clipe 4–8s no gerador. Vídeo→vídeo: envia um clip curto (máx. 10s), escolhe duração e descreve a alteração.`;
  }

  if (lang === "en") {
    return `${hey}! I'm Sofia from Remake Pixel.\n\nTell me what you want to create (portrait, poster, remove background…) and I'll point you to the right tool with a link.\n\n• [Studio](${origin}/app/generate)\n• [Video](${origin}/app/video)\n• [Billing / credits](${origin}/app/billing)`;
  }
  return `${hey}! Sou a Sofia do Remake Pixel.\n\nDiz-me o que queres criar (retrato, poster, tirar fundo…) e indico-te o caminho com link.\n\n• [Estúdio](${origin}/app/generate)\n• [Vídeo](${origin}/app/video)\n• [Créditos](${origin}/app/billing)`;
}

export function isLocalAuthToken() {
  try {
    const token = localStorage.getItem("rp_token") || "";
    return token.startsWith("local:");
  } catch {
    return false;
  }
}

export function supportFallbackReply({ lang, user, userText }) {
  const code = (lang || "pt").slice(0, 2);
  return replyFor(code === "pt" ? "pt" : code, user, userText);
}
