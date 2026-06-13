/**
 * Image analysis + category detection (vision when OpenAI available).
 */
const { getOpenAIKey } = require("../openaiEnv.cjs");
const {
  CATEGORY_IDS,
  CONFIDENCE_THRESHOLD,
  getCategoryMeta,
  isValidCategoryId,
} = require("./marketingVideoCategories.cjs");

async function analyzeWithVision(mainImageUrl, referenceUrls, lang) {
  const key = getOpenAIKey()?.key;
  if (!key || !mainImageUrl) return null;

  const categories = CATEGORY_IDS.map((id) => {
    const m = getCategoryMeta(id);
    return `${id}: ${m.labelEn} (${m.hints.slice(0, 4).join(", ")})`;
  }).join("\n");

  const content = [
    {
      type: "text",
      text:
        "Analyze this product/service marketing image set for a vertical ad video. "
        + "Return ONLY valid JSON: "
        + '{"category":"fashion|drinks|cars|cosmetics|websites|food|jewelry|realEstate|gaming",'
        + '"confidence":0.0-1.0,"product_label":"short name in '
        + `${lang === "en" ? "English" : "Portuguese"}`
        + '","angle_notes":"brief"}\n\nCategories:\n'
        + categories,
    },
    { type: "image_url", image_url: { url: mainImageUrl, detail: "low" } },
  ];

  for (const url of (referenceUrls || []).slice(0, 3)) {
    if (url) content.push({ type: "image_url", image_url: { url, detail: "low" } });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 220,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function analyzeMarketingImages({
  mainImageUrl,
  referenceUrls = [],
  manualCategory = "",
  lang = "pt",
}) {
  const manual = String(manualCategory || "").trim();
  if (manual && isValidCategoryId(manual)) {
    return {
      category: manual,
      confidence: 1,
      product_label: "",
      manual: true,
      needs_manual: false,
    };
  }

  let vision = null;
  try {
    vision = await analyzeWithVision(mainImageUrl, referenceUrls, lang);
  } catch {
    vision = null;
  }

  if (vision?.category && isValidCategoryId(vision.category)) {
    const confidence = Math.min(1, Math.max(0, Number(vision.confidence) || 0));
    return {
      category: vision.category,
      confidence,
      product_label: String(vision.product_label || "").slice(0, 120),
      angle_notes: String(vision.angle_notes || "").slice(0, 200),
      needs_manual: confidence < CONFIDENCE_THRESHOLD,
      manual: false,
    };
  }

  return {
    category: null,
    confidence: 0,
    product_label: "",
    needs_manual: true,
    manual: false,
    suggestions: CATEGORY_IDS.slice(0, 5),
  };
}

module.exports = {
  analyzeMarketingImages,
  CONFIDENCE_THRESHOLD,
};
