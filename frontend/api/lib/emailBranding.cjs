const SITE = "https://www.remakepix.com";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absUrl(path) {
  const p = String(path || "").trim();
  if (!p) return SITE;
  if (p.startsWith("http")) return p;
  return `${SITE}${p.startsWith("/") ? "" : "/"}${p}`;
}

/**
 * Premium promotional HTML email — dark purple / gold energy (high-converting layout).
 */
function buildPromoEmailHtml({
  preheader = "",
  heroImageUrl = "",
  badge = "",
  headline = "",
  subheadline = "",
  paragraphs = [],
  highlight = null,
  bullets = [],
  ctaPrimary = null,
  ctaSecondary = null,
  footerLines = [],
}) {
  const hero = heroImageUrl
    ? `<tr><td style="padding:0"><img src="${esc(absUrl(heroImageUrl))}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0" /></td></tr>`
    : "";

  const badgeHtml = badge
    ? `<div style="display:inline-block;margin:0 0 14px;padding:6px 14px;background:linear-gradient(90deg,#F59E0B,#FBBF24);color:#1a0a00;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;border-radius:999px">${esc(badge)}</div>`
    : "";

  const highlightHtml = highlight
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0"><tr><td style="padding:20px 22px;background:linear-gradient(135deg,#1e1035 0%,#2d1b69 100%);border:1px solid #7c3aed;border-radius:14px;text-align:center">
      ${highlight.label ? `<p style="margin:0 0 6px;font-size:11px;color:#c4b5fd;letter-spacing:0.12em;text-transform:uppercase;font-weight:700">${esc(highlight.label)}</p>` : ""}
      <p style="margin:0;font-size:36px;line-height:1.1;font-weight:800;color:#fde68a;font-family:Georgia,'Times New Roman',serif">${esc(highlight.value)}</p>
      ${highlight.sub ? `<p style="margin:8px 0 0;font-size:13px;color:#e9d5ff">${esc(highlight.sub)}</p>` : ""}
    </td></tr></table>`
    : "";

  const bulletsHtml = bullets.length
    ? `<ul style="margin:16px 0 20px;padding:0 0 0 18px;color:#d4d4d8;font-size:14px;line-height:1.65">${bullets.map((b) => `<li style="margin:0 0 8px">${esc(b)}</li>`).join("")}</ul>`
    : "";

  const parasHtml = paragraphs
    .map((p) => `<p style="margin:0 0 14px;color:#d4d4d8;font-size:15px;line-height:1.65">${esc(p)}</p>`)
    .join("");

  const ctaPrimaryHtml = ctaPrimary?.url
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto 12px"><tr><td align="center" style="border-radius:12px;background:linear-gradient(90deg,#7C3AED,#A855F7);box-shadow:0 8px 24px rgba(124,58,237,0.45)">
      <a href="${esc(absUrl(ctaPrimary.url))}" style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;letter-spacing:0.04em;text-transform:uppercase">${esc(ctaPrimary.label || "Abrir")}</a>
    </td></tr></table>`
    : "";

  const ctaSecondaryHtml = ctaSecondary?.url
    ? `<p style="margin:0;text-align:center"><a href="${esc(absUrl(ctaSecondary.url))}" style="color:#c4b5fd;font-size:13px;text-decoration:underline">${esc(ctaSecondary.label)}</a></p>`
    : "";

  const footerHtml = (footerLines.length ? footerLines : [
    "Remake Pixel · remakepix.com",
    "Recebeste este email porque tens conta no Remake Pixel.",
  ]).map((l) => `<p style="margin:0 0 6px;font-size:11px;color:#71717a;line-height:1.5">${esc(l)}</p>`).join("");

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${esc(headline)}</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#09090b;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#111118;border:1px solid #27272a;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.45)">
        ${hero}
        <tr><td style="padding:28px 28px 32px">
          <p style="margin:0 0 18px;text-align:center;font-size:13px;font-weight:800;letter-spacing:0.22em;color:#a78bfa">REMAKE PIXEL</p>
          ${badgeHtml}
          <h1 style="margin:0 0 10px;font-size:28px;line-height:1.15;font-weight:800;color:#fafafa;font-family:Georgia,'Times New Roman',serif">${esc(headline)}</h1>
          ${subheadline ? `<p style="margin:0 0 18px;font-size:16px;line-height:1.5;color:#a1a1aa;font-weight:500">${esc(subheadline)}</p>` : ""}
          ${highlightHtml}
          ${parasHtml}
          ${bulletsHtml}
          ${ctaPrimaryHtml}
          ${ctaSecondaryHtml}
        </td></tr>
        <tr><td style="padding:18px 28px 24px;background:#0c0c10;border-top:1px solid #27272a;text-align:center">
          ${footerHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = {
  SITE,
  esc,
  absUrl,
  buildPromoEmailHtml,
};
