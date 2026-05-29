import { readUserSettings } from "./userSettings";
import { primaryResultUrl } from "./creationUrls";
import { SITE_ORIGIN } from "./siteConfig";

/** Apenas dígitos, com código de país (ex.: 351912345678). */
export function normalizeWhatsAppPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return "";
  return digits;
}

export function readWhatsAppPrefs() {
  const s = readUserSettings();
  return {
    enabled: Boolean(s.whatsapp_notify),
    phone: normalizeWhatsAppPhone(s.whatsapp_phone),
  };
}

export function buildGenerationWhatsAppUrl(creation, { lang = "pt", siteOrigin } = {}) {
  const { enabled, phone } = readWhatsAppPrefs();
  if (!enabled || !phone) return null;

  const origin = siteOrigin || (typeof window !== "undefined" ? window.location.origin : SITE_ORIGIN);
  const url = primaryResultUrl(creation);
  const type = creation?.type || "image";
  const spent = creation?.credits_spent;

  const pt = `✅ Remake Pixel — a tua ${type === "video" ? "geração de vídeo" : "imagem"} está pronta!${
    spent ? ` (${spent} créditos)` : ""
  }${url ? `\n\nVer resultado: ${url}` : `\n\nAbre a galeria: ${origin}/app/gallery`}`;

  const en = `✅ Remake Pixel — your ${type === "video" ? "video" : "image"} is ready!${
    spent ? ` (${spent} credits)` : ""
  }${url ? `\n\nView result: ${url}` : `\n\nOpen gallery: ${origin}/app/gallery`}`;

  const text = (lang || "pt").startsWith("en") ? en : pt;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Abre WhatsApp com mensagem pré-preenchida (o utilizador confirma o envio).
 * Não envia automaticamente — isso exige WhatsApp Business API na Meta.
 */
export function openWhatsAppGenerationNotice(creation, opts = {}) {
  const href = buildGenerationWhatsAppUrl(creation, opts);
  if (!href || typeof window === "undefined") return false;
  window.open(href, "_blank", "noopener,noreferrer");
  return true;
}
