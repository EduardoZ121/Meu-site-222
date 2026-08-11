/** Capas estáticas em public/images/poster-covers — layout de referência na geração IG. */

function isIgRefPosterTemplate(templateId) {
  return String(templateId || "").startsWith("ig_ref_");
}

function posterLayoutCoverRelPath(templateId, variantKey = "classic") {
  if (!isIgRefPosterTemplate(templateId)) return null;
  const base = String(templateId || "").trim();
  const vk = String(variantKey || "classic").trim() || "classic";
  return `/images/poster-covers/${base}__${vk}.jpg`;
}

function posterLayoutCoverUrl(origin, templateId, variantKey = "classic") {
  const rel = posterLayoutCoverRelPath(templateId, variantKey);
  if (!rel) return null;
  let base = String(origin || process.env.SITE_URL || "https://www.remakepix.com").replace(/\/$/, "");
  try {
    const u = new URL(base);
    if (u.hostname.endsWith(".vercel.app") || u.hostname === "remakepix.com") {
      base = "https://www.remakepix.com";
    }
  } catch {
    base = "https://www.remakepix.com";
  }
  return `${base}${rel}`;
}

module.exports = {
  isIgRefPosterTemplate,
  posterLayoutCoverRelPath,
  posterLayoutCoverUrl,
};
