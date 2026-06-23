/**
 * Deep brand + product analysis (site text + vision on uploads).
 */
const { getOpenAIKey, openaiConfigured } = require("../openaiEnv.cjs");

const CONCEPT_COUNT = 10;

function buildAnalysisPrompt({ websiteSnapshot, lang, imageCount }) {
  const pt = lang !== "en";
  const siteBlock = websiteSnapshot
    ? [
      "WEBSITE DATA:",
      `URL: ${websiteSnapshot.url || ""}`,
      `Title: ${websiteSnapshot.title || ""}`,
      `Description: ${websiteSnapshot.description || ""}`,
      `Theme color: ${websiteSnapshot.theme_color || ""}`,
      `OG image: ${websiteSnapshot.og_image || ""}`,
      `Page text (excerpt): ${(websiteSnapshot.text_snippet || "").slice(0, 4500)}`,
    ].join("\n")
    : "WEBSITE: not provided.";

  return (
    `${pt ? "Analisa esta marca/produto para gerar anúncios visuais on-brand." : "Analyze this brand/product for on-brand visual ads."}\n`
    + `${siteBlock}\n`
    + `UPLOADED IMAGES: ${imageCount} product/reference photo(s).\n\n`
    + "Identify EVERYTHING relevant: brand name, industry, product type, colors, typography mood, "
    + "target audience, value proposition, price tier, tone of voice, visual style, competitors vibe, "
    + "key benefits, CTA style, and what must stay consistent across ads.\n\n"
    + `Return ONLY valid JSON:\n`
    + `{\n`
    + `  "brand_name": "string",\n`
    + `  "industry": "string",\n`
    + `  "product_summary": "2-3 sentences",\n`
    + `  "target_audience": "string",\n`
    + `  "value_proposition": "string",\n`
    + `  "tone_of_voice": "string",\n`
    + `  "color_palette": ["#hex or name", ...],\n`
    + `  "visual_style": "string",\n`
    + `  "typography_mood": "string",\n`
    + `  "must_include": ["elements that must appear in every ad"],\n`
    + `  "must_avoid": ["off-brand elements"],\n`
    + `  "concepts": [\n`
    + `    {\n`
    + `      "title": "short ad angle title",\n`
    + `      "format": "feed|story|carousel|hero|lifestyle|product-focus",\n`
    + `      "headline_hint": "optional short headline text for the ad",\n`
    + `      "prompt": "Detailed English image generation prompt (80-180 words). Professional paid-social ad. "
    + "Include composition, lighting, background, product placement, mood. NO watermarks. NO mock UI."\n`
    + `    }\n`
    + `  ]\n`
    + `}\n\n`
    + `Provide exactly ${CONCEPT_COUNT} unique concepts in "concepts" array — varied formats and angles.`
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

  for (const url of imageUrls.slice(0, 5)) {
    if (url) content.push({ type: "image_url", image_url: { url, detail: "high" } });
  }

  if (websiteSnapshot?.og_image && !imageUrls.includes(websiteSnapshot.og_image)) {
    content.push({
      type: "image_url",
      image_url: { url: websiteSnapshot.og_image, detail: "low" },
    });
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
      headline_hint: "",
      prompt: `Professional on-brand social media ad for ${parsed.brand_name || "the brand"}. `
        + `${parsed.visual_style || "modern premium"}. Product hero, clean layout, `
        + `colors ${(parsed.color_palette || []).join(", ") || "brand colors"}.`,
    });
  }

  return {
    brand_name: String(parsed.brand_name || "").slice(0, 120),
    industry: String(parsed.industry || "").slice(0, 120),
    product_summary: String(parsed.product_summary || "").slice(0, 600),
    target_audience: String(parsed.target_audience || "").slice(0, 300),
    value_proposition: String(parsed.value_proposition || "").slice(0, 300),
    tone_of_voice: String(parsed.tone_of_voice || "").slice(0, 200),
    color_palette: (parsed.color_palette || []).slice(0, 8).map((c) => String(c).slice(0, 40)),
    visual_style: String(parsed.visual_style || "").slice(0, 300),
    typography_mood: String(parsed.typography_mood || "").slice(0, 200),
    must_include: (parsed.must_include || []).slice(0, 12).map((s) => String(s).slice(0, 120)),
    must_avoid: (parsed.must_avoid || []).slice(0, 12).map((s) => String(s).slice(0, 120)),
    concepts: concepts.slice(0, CONCEPT_COUNT).map((c, i) => ({
      index: i,
      title: String(c.title || `Concept ${i + 1}`).slice(0, 80),
      format: String(c.format || "feed").slice(0, 40),
      headline_hint: String(c.headline_hint || "").slice(0, 120),
      prompt: String(c.prompt || "").slice(0, 2000),
    })),
    website_url: websiteSnapshot?.url || "",
  };
}

module.exports = {
  analyzeBrandCampaign,
  CONCEPT_COUNT,
};
