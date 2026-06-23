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
    brief.site_headlines?.length ? `Site headlines (use/adapt): ${brief.site_headlines.join(" | ")}` : "",
    brief.site_marketing_copy
      ? `Site copy context: ${brief.site_marketing_copy.slice(0, 1200)}`
      : "",
    brief.must_include?.length ? `Must include: ${brief.must_include.join("; ")}` : "",
    brief.must_avoid?.length ? `Avoid: ${brief.must_avoid.join("; ")}` : "",
  ].filter(Boolean).join("\n");

  const conceptBlock = [
    concept?.title ? `Ad angle: ${concept.title}` : "",
    concept?.format ? `Format: ${concept.format}` : "",
    concept?.headline_hint ? `Headline ON the ad (legible typography, exact text): "${concept.headline_hint}"` : "",
    concept?.prompt || "",
  ].filter(Boolean).join("\n");

  const refLock = (
    "PRODUCT/BRAND REFERENCE LOCK: Reference images show the REAL product/packaging/logo from the brand website. "
    + "Preserve exact product shape, label, logo, colors and packaging. "
    + "Build the ad AROUND these real assets — NOT a generic stock product. "
    + "Integrate naturally into the ad — NOT a collage of uploads."
  );

  const quality = (
    "Single finished advertisement image. Professional lighting, strong hierarchy, print-ready. "
    + "Render the headline text clearly if specified. "
    + "No watermarks, no mock phone UI, no split-screen before/after unless concept requires it. "
    + `Aspect ratio ${aspectRatio || "4:5"}.`
  );

  return [brandBlock, conceptBlock, refLock, quality].join("\n\n");
}

module.exports = {
  buildBrandCampaignImagePrompt,
};
