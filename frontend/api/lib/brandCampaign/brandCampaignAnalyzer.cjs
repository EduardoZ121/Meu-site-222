/**
 * Deep brand + product analysis (site text + vision on uploads).
 */
const { getOpenAIKey, openaiConfigured } = require("../openaiEnv.cjs");

const CONCEPT_COUNT = 10;

function safeOpenAIImageUrl(raw) {
  const u = String(raw || "").trim();
  if (!/^https:\/\/.{12,}/i.test(u)) return null;
  if (/\.(svg|ico)(\?|$)/i.test(u)) return null;
  return u.slice(0, 2048);
}

function buildAnalysisPrompt({ websiteSnapshot, lang, imageCount }) {
  const pt = lang !== "en";
  const siteBlock = websiteSnapshot
    ? [
      "WEBSITE DATA (read carefully — use REAL copy from the site, not generic guesses):",
      `URL: ${websiteSnapshot.url || ""}`,
      `Read method: ${websiteSnapshot.read_method || "unknown"}`,
      `Title: ${websiteSnapshot.title || ""}`,
      `Description: ${websiteSnapshot.description || ""}`,
      `Theme color: ${websiteSnapshot.theme_color || ""}`,
      websiteSnapshot.product_names?.length ? `Products detected: ${websiteSnapshot.product_names.join(" | ")}` : "",
      websiteSnapshot.prices?.length ? `Prices: ${websiteSnapshot.prices.join(" | ")}` : "",
      websiteSnapshot.colors_found?.length ? `Colors on page: ${websiteSnapshot.colors_found.join(", ")}` : "",
      websiteSnapshot.headings?.length
        ? `Headlines:\n${websiteSnapshot.headings.slice(0, 12).map((h) => `- H${h.level}: ${h.text}`).join("\n")}`
        : "",
      websiteSnapshot.ctas?.length ? `CTA buttons: ${websiteSnapshot.ctas.join(" | ")}` : "",
      websiteSnapshot.marketing_copy
        ? `\nFULL SITE CONTENT FOR ANALYSIS:\n${websiteSnapshot.marketing_copy.slice(0, 8000)}`
        : `Page text (excerpt): ${(websiteSnapshot.text_snippet || "").slice(0, 4500)}`,
    ].filter(Boolean).join("\n")
    : "WEBSITE: not provided.";

  return (
    `${pt ? "Analisa esta marca/produto com base no CONTEÚDO REAL do site (textos, produtos, CTAs, preços, imagens)." : "Analyze this brand/product using REAL site content (copy, products, CTAs, prices, images)."}\n`
    + `${siteBlock}\n`
    + `UPLOADED IMAGES: ${imageCount} product/reference photo(s).\n\n`
    + "Identify EVERYTHING: brand name, industry, exact products, colors from the site, typography mood, "
    + "target audience, value proposition, price tier, tone of voice, visual style, key benefits, CTA style.\n"
    + "CRITICAL: Each ad concept MUST use REAL headlines/offers/copy inspired by the site — NOT generic placeholder marketing.\n"
    + "headline_hint must be actual short ad copy (can adapt site headlines). Reference specific products and benefits from the page.\n\n"
    + `Return ONLY valid JSON:\n`
    + `{\n`
    + `  "brand_name": "string",\n`
    + `  "industry": "string",\n`
    + `  "product_summary": "2-3 sentences using real site facts",\n`
    + `  "target_audience": "string",\n`
    + `  "value_proposition": "string",\n`
    + `  "tone_of_voice": "string",\n`
    + `  "color_palette": ["#hex or name from site", ...],\n`
    + `  "visual_style": "string",\n`
    + `  "typography_mood": "string",\n`
    + `  "must_include": ["specific elements from the brand/site"],\n`
    + `  "must_avoid": ["off-brand elements"],\n`
    + `  "site_headlines_used": ["exact or adapted headlines from site"],\n`
    + `  "concepts": [\n`
    + `    {\n`
    + `      "title": "short ad angle title",\n`
    + `      "format": "feed|story|carousel|hero|lifestyle|product-focus",\n`
    + `      "headline_hint": "REAL ad headline using site copy (short, legible)",\n`
    + `      "prompt": "Detailed English image generation prompt (80-180 words). Show the ACTUAL product/brand from references. "
    + "Include composition, lighting, background, product placement, mood. Use site colors and real offer text. NO watermarks. NO mock UI."\n`
    + `    }\n`
    + `  ]\n`
    + `}\n\n`
    + `Provide exactly ${CONCEPT_COUNT} unique concepts — varied formats and angles, all grounded in the site content.`
  );
}

async function analyzeBrandCampaign({ websiteSnapshot = null, imageUrls = [], lang = "pt" }) {
  if (!openaiConfigured()) {
    const err = new Error("Análise IA indisponível — OPENAI_API_KEY em falta.");
    err.status = 503;
    throw err;
  }

  const key = getOpenAIKey()?.key;
  const content = [
    { type: "text", text: buildAnalysisPrompt({ websiteSnapshot, lang, imageCount: imageUrls.length }) },
  ];

  const visionUrls = new Set();
  for (const url of imageUrls.slice(0, 5)) {
    const safe = safeOpenAIImageUrl(url) || (String(url || "").startsWith("data:image/") ? url : null);
    if (safe) visionUrls.add(safe);
  }

  const siteProductImages = (websiteSnapshot?.product_images || []).slice(0, 4);
  for (const url of siteProductImages) {
    const safe = safeOpenAIImageUrl(url);
    if (safe) visionUrls.add(safe);
  }

  if (websiteSnapshot?.og_image) {
    const og = safeOpenAIImageUrl(websiteSnapshot.og_image);
    if (og) visionUrls.add(og);
  }

  for (const url of [...visionUrls].slice(0, 6)) {
    content.push({ type: "image_url", image_url: { url, detail: "high" } });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.35,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err = new Error(`Análise da marca falhou (${res.status}). ${errText.slice(0, 120)}`);
    err.status = 502;
    throw err;
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) {
    const err = new Error("Análise vazia — tenta outra URL ou fotos mais nítidas.");
    err.status = 502;
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const err = new Error("Resposta de análise inválida.");
    err.status = 502;
    throw err;
  }

  const concepts = Array.isArray(parsed.concepts) ? parsed.concepts : [];
  while (concepts.length < CONCEPT_COUNT) {
    concepts.push({
      title: `Ad variation ${concepts.length + 1}`,
      format: "feed",
      headline_hint: (websiteSnapshot?.headings?.[0]?.text || "").slice(0, 80),
      prompt: `Professional on-brand social media ad for ${parsed.brand_name || websiteSnapshot?.title || "the brand"}. `
        + `${parsed.visual_style || "modern premium"}. Product hero, clean layout, `
        + `colors ${(parsed.color_palette || websiteSnapshot?.colors_found || []).join(", ") || "brand colors"}. `
        + `Include offer copy from site: ${(websiteSnapshot?.ctas || []).slice(0, 2).join(", ")}.`,
    });
  }

  return {
    brand_name: String(parsed.brand_name || websiteSnapshot?.title || "").slice(0, 120),
    industry: String(parsed.industry || "").slice(0, 120),
    product_summary: String(parsed.product_summary || "").slice(0, 600),
    target_audience: String(parsed.target_audience || "").slice(0, 300),
    value_proposition: String(parsed.value_proposition || "").slice(0, 300),
    tone_of_voice: String(parsed.tone_of_voice || "").slice(0, 200),
    color_palette: (parsed.color_palette?.length ? parsed.color_palette : websiteSnapshot?.colors_found || [])
      .slice(0, 8).map((c) => String(c).slice(0, 40)),
    visual_style: String(parsed.visual_style || "").slice(0, 300),
    typography_mood: String(parsed.typography_mood || "").slice(0, 200),
    must_include: (parsed.must_include || []).slice(0, 12).map((s) => String(s).slice(0, 120)),
    must_avoid: (parsed.must_avoid || []).slice(0, 12).map((s) => String(s).slice(0, 120)),
    site_headlines: (parsed.site_headlines_used || websiteSnapshot?.headings?.map((h) => h.text) || [])
      .slice(0, 12).map((s) => String(s).slice(0, 120)),
    site_marketing_copy: String(websiteSnapshot?.marketing_copy || "").slice(0, 4000),
    site_read_method: websiteSnapshot?.read_method || "",
    concepts: concepts.slice(0, CONCEPT_COUNT).map((c, i) => ({
      index: i,
      title: String(c.title || `Concept ${i + 1}`).slice(0, 80),
      format: String(c.format || "feed").slice(0, 40),
      headline_hint: String(c.headline_hint || "").slice(0, 120),
      prompt: String(c.prompt || "").slice(0, 2000),
    })),
    website_url: websiteSnapshot?.url || "",
    reference_image_urls: [],
  };
}

module.exports = {
  analyzeBrandCampaign,
  CONCEPT_COUNT,
};
