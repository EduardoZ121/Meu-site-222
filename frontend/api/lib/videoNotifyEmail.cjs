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
};
