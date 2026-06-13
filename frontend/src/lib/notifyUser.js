/** Eventos globais: notificações no painel + scroll ao resultado. */

export function emitNotification(detail) {
  if (typeof window === "undefined" || !detail) return;
  window.dispatchEvent(new CustomEvent("rp:notification", { detail }));
}

export function requestScrollToResult() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("rp:scroll-to-result"));
}

export function notifyGenerationComplete(creation) {
  const spent = Number(creation?.credits_spent || 0);
  const balance = creation?.new_balance;
  emitNotification({
    type: "generation",
    titleKey: "notif_generation_title",
    bodyKey: spent > 0 && balance != null ? "notif_generation_body_spent" : "notif_generation_body",
    spent,
    balance,
    creationType: creation?.type || "image",
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
  requestScrollToResult();
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
export function notifyGenerationFailed({ error, type = "video", balance, credits }) {
  const msg = String(error || "").trim();
  emitNotification({
    type: "generation_failed",
    titleKey: type === "video" ? "notif_video_failed_title" : "notif_generation_failed_title",
    body: msg,
    creationType: type,
    balance,
    credits: credits ?? 0,
    spent: credits ?? 0,
    href: type === "video" ? "/app/video/edit" : "/app/billing",
  });
}
