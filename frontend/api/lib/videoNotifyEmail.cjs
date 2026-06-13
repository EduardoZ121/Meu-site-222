const { sendResendEmail } = require("./emailReport.cjs");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return e.length >= 5 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function videoReadyCopy(lang) {
  const l = String(lang || "pt").slice(0, 2).toLowerCase();
  if (l === "en") {
    return {
      subject: "Your video is ready — Remake Pixel",
      headline: "Your edited video is ready",
      body: "Open the link below to watch or download your clip.",
      watch: "Watch video",
      gallery: "Open in gallery",
    };
  }
  return {
    subject: "O teu vídeo está pronto — Remake Pixel",
    headline: "O teu vídeo editado está pronto",
    body: "Abre o link abaixo para ver ou descarregar o clip.",
    watch: "Ver vídeo",
    gallery: "Abrir na galeria",
  };
}

function buildVideoReadyHtml({ headline, body, watch, gallery, videoUrl, galleryUrl }) {
  return [
    "<!DOCTYPE html><html><body style=\"font-family:system-ui,sans-serif;background:#f4f1ea;padding:24px\">",
    "<div style=\"max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;border:1px solid #e8e8f0\">",
    `<h1 style="margin:0 0 8px;font-size:22px;color:#1a1a1a">${esc(headline)}</h1>`,
    `<p style="margin:0 0 20px;color:#666;font-size:14px;line-height:1.5">${esc(body)}</p>`,
    videoUrl
      ? `<p style="margin:0 0 12px"><a href="${esc(videoUrl)}" style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${esc(watch)}</a></p>`
      : "",
    `<p style="margin:0"><a href="${esc(galleryUrl)}" style="color:#7C3AED;font-size:14px">${esc(gallery)}</a></p>`,
    "<p style=\"margin:24px 0 0;font-size:11px;color:#aaa\">remakepix.com</p>",
    "</div></body></html>",
  ].join("");
}

function videoFailedCopy(lang) {
  const l = String(lang || "pt").slice(0, 2).toLowerCase();
  if (l === "en") {
    return {
      subject: "Your video could not be generated — Remake Pixel",
      headline: "Video generation failed",
      intro: "We could not finish your video edit. Your credits were refunded automatically.",
      reasonLabel: "What happened",
      retry: "Try again",
      billing: "View billing history",
    };
  }
  return {
    subject: "Não foi possível gerar o teu vídeo — Remake Pixel",
    headline: "A geração do vídeo falhou",
    intro: "Não conseguimos concluir a edição do teu vídeo. Os créditos foram devolvidos automaticamente.",
    reasonLabel: "O que aconteceu",
    retry: "Tentar outra vez",
    billing: "Ver histórico de créditos",
  };
}

function buildVideoFailedHtml({ headline, intro, reasonLabel, errorMessage, retry, billing, editorUrl, billingUrl }) {
  return [
    "<!DOCTYPE html><html><body style=\"font-family:system-ui,sans-serif;background:#f4f1ea;padding:24px\">",
    "<div style=\"max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;border:1px solid #e8e8f0\">",
    `<h1 style="margin:0 0 8px;font-size:22px;color:#1a1a1a">${esc(headline)}</h1>`,
    `<p style="margin:0 0 16px;color:#666;font-size:14px;line-height:1.5">${esc(intro)}</p>`,
    `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:0.06em">${esc(reasonLabel)}</p>`,
    `<div style="margin:0 0 20px;padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#7f1d1d;font-size:14px;line-height:1.55">${esc(errorMessage)}</div>`,
    `<p style="margin:0 0 12px"><a href="${esc(editorUrl)}" style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${esc(retry)}</a></p>`,
    `<p style="margin:0"><a href="${esc(billingUrl)}" style="color:#7C3AED;font-size:14px">${esc(billing)}</a></p>`,
    "<p style=\"margin:24px 0 0;font-size:11px;color:#aaa\">remakepix.com</p>",
    "</div></body></html>",
  ].join("");
}

async function sendVideoFailedEmail({ to, lang, errorMessage, editorUrl, billingUrl }) {
  const email = String(to || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, skipped: true, reason: "invalid_email" };
  }
  const copy = videoFailedCopy(lang);
  const editor = editorUrl || "https://www.remakepix.com/app/video/edit";
  const billing = billingUrl || "https://www.remakepix.com/app/billing";
  const reason = String(errorMessage || copy.intro).trim().slice(0, 800);
  const html = buildVideoFailedHtml({
    ...copy,
    errorMessage: reason,
    editorUrl: editor,
    billingUrl: billing,
  });
  const text = [
    copy.headline,
    "",
    copy.intro,
    "",
    `${copy.reasonLabel}:`,
    reason,
    "",
    `${copy.retry}: ${editor}`,
    `${copy.billing}: ${billing}`,
  ].join("\n");

  const result = await sendResendEmail({
    to: email,
    subject: copy.subject,
    html,
    text,
  });

  if (!result.ok) {
    console.error("[video-fail-email] send failed", {
      to: email,
      reason: result.reason || result.error || "unknown",
    });
  } else {
    console.info("[video-fail-email] sent", { to: email, id: result.id });
  }
  return result;
}

async function sendVideoReadyEmail({ to, lang, videoUrl, galleryUrl, creationId }) {
  const email = String(to || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, skipped: true, reason: "invalid_email" };
  }
  const copy = videoReadyCopy(lang);
  const gallery = galleryUrl
    || `https://www.remakepix.com/app/gallery${creationId ? `?focus=${encodeURIComponent(creationId)}` : ""}`;
  const html = buildVideoReadyHtml({
    ...copy,
    videoUrl: videoUrl || null,
    galleryUrl: gallery,
  });
  const text = [
    copy.headline,
    "",
    copy.body,
    videoUrl ? `${copy.watch}: ${videoUrl}` : "",
    `${copy.gallery}: ${gallery}`,
  ].filter(Boolean).join("\n");

  const result = await sendResendEmail({
    to: email,
    subject: copy.subject,
    html,
    text,
  });

  if (!result.ok) {
    console.error("[video-notify-email] send failed", {
      to: email,
      reason: result.reason || result.error || "unknown",
    });
  } else {
    console.info("[video-notify-email] sent", { to: email, id: result.id });
  }
  return result;
}

module.exports = {
  isValidEmail,
  sendVideoReadyEmail,
  sendVideoFailedEmail,
};
