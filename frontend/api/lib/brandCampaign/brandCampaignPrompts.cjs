/**
 * Final image prompts for on-brand ad generation.
 */

function buildBrandCampaignImagePrompt({ brief, concept, aspectRatio }) {
  const brandBlock = [
    "ON-BRAND AD CREATIVE (paid social / Meta / Instagram):",
    `Brand: ${brief.brand_name || "Brand"}`,
    brief.industry ? `Industry: ${brief.industry}` : "",
    brief.product_summary ? `Product: ${brief.product_summary}` : "",
    brief.target_audience ? `Audience: ${brief.target_audience}` : "",
    brief.value_proposition ? `Value: ${brief.value_proposition}` : "",
    brief.tone_of_voice ? `Tone: ${brief.tone_of_voice}` : "",
    brief.visual_style ? `Visual style: ${brief.visual_style}` : "",
    brief.color_palette?.length ? `Colors: ${brief.color_palette.join(", ")}` : "",
    brief.typography_mood ? `Typography mood: ${brief.typography_mood}` : "",
    brief.must_include?.length ? `Must include: ${brief.must_include.join("; ")}` : "",
    brief.must_avoid?.length ? `Avoid: ${brief.must_avoid.join("; ")}` : "",
  ].filter(Boolean).join("\n");

  const conceptBlock = [
    concept?.title ? `Ad angle: ${concept.title}` : "",
    concept?.format ? `Format: ${concept.format}` : "",
    concept?.headline_hint ? `Headline (legible typography): ${concept.headline_hint}` : "",
    concept?.prompt || "",
  ].filter(Boolean).join("\n");

  const refLock = (
    "PRODUCT REFERENCE LOCK: If a product/packshot photo is provided, preserve exact product shape, "
    + "label, logo, colors and packaging. Integrate naturally into the ad — NOT a collage of uploads."
  );

  const quality = (
    "Single finished advertisement image. Professional lighting, strong hierarchy, print-ready. "
    + "No watermarks, no mock phone UI, no split-screen before/after unless concept requires it. "
    + `Aspect ratio ${aspectRatio || "4:5"}.`
  );

  return [brandBlock, conceptBlock, refLock, quality].join("\n\n");
}

module.exports = {
  buildBrandCampaignImagePrompt,
};
