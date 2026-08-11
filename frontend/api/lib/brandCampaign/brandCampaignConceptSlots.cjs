/**
 * Resolve a distinct ad concept for each batch slot (1–10 ads).
 * Every slot gets a unique creative angle — never returns the raw concept unchanged.
 */

const VARIATION_ANGLES = [
  "product hero close-up, bold gradient background, strong central focus",
  "lifestyle scene with human context, natural environment, aspirational mood",
  "minimal typography-led layout, lots of negative space, editorial feel",
  "dynamic energy scene with motion, splashes, particles, or action",
  "split composition with product + benefit callouts, infographic style",
  "premium dark-mode aesthetic, spotlight on product, luxury cues",
  "bright playful pop-art colors, fun and youthful energy",
  "seasonal / contextual setting (outdoor, café, gym, city) matching the brand",
  "UGC-style authentic photo ad, relatable and social-native",
  "offer-led promo layout with price/CTA emphasis and urgency",
];

const FORMAT_ROTATION = ["feed", "story", "hero", "lifestyle", "product-focus", "carousel"];

function pickHeadline(brief, slotIndex) {
  const headlines = [
    ...(brief?.site_headlines || []),
    ...(brief?.concepts || []).map((c) => c.headline_hint).filter(Boolean),
  ].filter(Boolean);
  if (!headlines.length) return "";
  return String(headlines[slotIndex % headlines.length]).slice(0, 120);
}

function enrichConceptForSlot(base, brief, slotIndex, batchTotal) {
  const angle = VARIATION_ANGLES[slotIndex % VARIATION_ANGLES.length];
  const format = FORMAT_ROTATION[slotIndex % FORMAT_ROTATION.length];
  const headline = pickHeadline(brief, slotIndex) || base.headline_hint || "";
  const titleBase = base.title || `Ad ${slotIndex + 1}`;

  return {
    ...base,
    title: batchTotal > 1 ? `${titleBase} (#${slotIndex + 1})` : titleBase,
    format,
    headline_hint: headline || base.headline_hint,
    prompt: [
      (base.prompt || "").slice(0, 1200),
      `Ad ${slotIndex + 1}/${batchTotal}. Angle: ${angle}. Format: ${format}.`,
      headline ? `Headline: "${headline}".` : "",
      "Unique layout vs other ads in this batch — different background and composition.",
    ].filter(Boolean).join(" "),
  };
}

/**
 * Ensure brief has at least `outputCount` concepts before batch generation.
 */
function prepareBriefForBatch(brief, outputCount) {
  const concepts = Array.isArray(brief?.concepts) ? [...brief.concepts] : [];
  const brand = brief?.brand_name || "the brand";
  const colors = (brief?.color_palette || []).join(", ") || "brand colors";
  const style = brief?.visual_style || "modern premium";

  while (concepts.length < outputCount) {
    const n = concepts.length;
    const angle = VARIATION_ANGLES[n % VARIATION_ANGLES.length];
    concepts.push({
      title: `Ad angle ${n + 1}`,
      format: FORMAT_ROTATION[n % FORMAT_ROTATION.length],
      headline_hint: pickHeadline(brief, n),
      prompt: [
        `Professional on-brand social media ad for ${brand}.`,
        `Creative angle: ${angle}.`,
        `Visual style: ${style}. Colors: ${colors}.`,
        brief?.product_summary ? `Product: ${brief.product_summary}` : "",
        "Distinct composition — not a duplicate of other ads in this campaign.",
      ].filter(Boolean).join(" "),
    });
  }

  return {
    ...brief,
    concepts: concepts.slice(0, Math.max(outputCount, concepts.length)),
  };
}

/**
 * @param {object} brief
 * @param {number} slotIndex — 0-based position in this batch
 * @param {number} batchTotal — ads requested in this run
 */
function resolveConceptForBatchSlot(brief, slotIndex, batchTotal) {
  const concepts = Array.isArray(brief?.concepts) ? brief.concepts : [];
  const base = concepts[slotIndex] || concepts[slotIndex % Math.max(concepts.length, 1)] || {
    title: `Ad ${slotIndex + 1}`,
    format: "feed",
    headline_hint: pickHeadline(brief, slotIndex),
    prompt: `Professional on-brand social ad for ${brief?.brand_name || "the brand"}.`,
  };

  return enrichConceptForSlot(base, brief, slotIndex, batchTotal);
}

module.exports = {
  resolveConceptForBatchSlot,
  prepareBriefForBatch,
  enrichConceptForSlot,
  VARIATION_ANGLES,
};
