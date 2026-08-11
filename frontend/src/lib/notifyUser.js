/** Eventos globais: notificações no painel + scroll ao resultado. */

import { humanizeGenerationError } from "./friendlyGenerationError";

export function emitNotification(detail) {
  if (typeof window === "undefined" || !detail) return;
  window.dispatchEvent(new CustomEvent("rp:notification", { detail }));
}

export function requestScrollToResult() {
  // Bubble-only UX: generation results open via Gallery, not an in-page result screen.
}

export function notifyGenerationComplete(creation) {
  const spent = Number(creation?.credits_spent || 0);
  const balance = creation?.new_balance;
  const creationType = creation?.type || "image";
  const isVideo = creationType === "video";
  emitNotification({
    type: "generation",
    titleKey: isVideo ? "notif_video_ready_title" : "notif_generation_title",
    bodyKey: spent > 0 && balance != null ? "notif_generation_body_spent" : "notif_generation_body",
    spent,
    balance,
    creationType,
    creationId: creation?.id || null,
    href: "/app/gallery",
  });
  if (balance != null && balance >= 0 && balance <= 12) {
    emitNotification({
      type: "credits_low",
      titleKey: "notif_credits_low_title",
      bodyKey: "notif_credits_low_body",
      balance,
      href: "/app/billing",
    });
  }
  // Bubble-only UX: do not scroll to / open an in-page generation result screen.
}

export function notifyCreditsUpdate({ balance, refunded, spent }) {
  if (refunded) {
    emitNotification({
      type: "credits_refund",
      titleKey: "notif_refund_title",
      bodyKey: "notif_refund_body",
      credits: spent || 0,
      spent: spent || 0,
      balance,
      href: "/app/billing",
    });
    return;
  }
  if (spent > 0 && balance != null) {
    emitNotification({
      type: "credits_spent",
      titleKey: "notif_spent_title",
      bodyKey: "notif_spent_body",
      spent,
      balance,
    });
  }
}

/** Falha de geração — mensagem explícita no painel (vídeo ou imagem). */
export function notifyGenerationFailed({ error, type = "image", balance, credits, t } = {}) {
  const raw = String(error || "").trim();
  // Prefer server-localized / already-humanized text (PT/EN NSFW, refunds, etc.).
  const body = humanizeGenerationError(raw, t);
  const isVideo = /video|marketing_video|motion_flyer/i.test(String(type || ""));
  emitNotification({
    type: "generation_failed",
    titleKey: isVideo ? "notif_video_failed_title" : "notif_generation_failed_title",
    body,
    creationType: type || "image",
    balance,
    credits: credits ?? 0,
    spent: credits ?? 0,
    href: isVideo ? "/app/video" : "/app/gallery",
  });
}
