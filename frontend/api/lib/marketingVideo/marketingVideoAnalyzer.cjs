/**
 * Image analysis + category detection (vision when OpenAI available).
 */
const { getOpenAIKey } = require("../openaiEnv.cjs");
const {
  CATEGORY_IDS,
  CONFIDENCE_THRESHOLD,
  getCategoryMeta,
  isDetectableCategoryId,
} = require("./marketingVideoCategories.cjs");

async function analyzeWithVision(mainImageUrl, referenceUrls, lang) {
  const key = getOpenAIKey()?.key;
  if (!key || !mainImageUrl) return null;

  const categories = CATEGORY_IDS.map((id) => {
    const m = getCategoryMeta(id);
    return `${id}: ${m.labelEn} (${m.hints.join(", ")})`;
  }).join("\n");

  const content = [
    {
      type: "text",
      text:
        "You analyze images for a 15-second cinematic marketing video ad. "
        + "Identify ANY subject — products, food, drinks, fashion, vehicles, apps, pets, animals, people, objects, services, or anything marketable. "
        + "Pick the CLOSEST category even if unusual (e.g. pet → general, person → fashion or general). "
        + "Return ONLY valid JSON: "
        + '{"category":"fashion|drinks|cars|cosmetics|websites|food|jewelry|realEstate|gaming|general",'
        + '"confidence":0.0-1.0,'
        + '"product_label":"short descriptive name in '
        + `${lang === "en" ? "English" : "Portuguese"}`
        + '",'
        + '"creative_angle":"one sentence ad mood or style hint",'
        + '"angle_notes":"brief visual notes"}\n\nCategories:\n'
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
      temperature: 0.25,
      max_tokens: 280,
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
  if (manual === "random") {
    return {
      category: "random",
      confidence: 1,
      product_label: "",
      creative_angle: "",
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

  const visionCategory = vision?.category && isDetectableCategoryId(vision.category)
    ? vision.category
    : null;
  const confidence = Math.min(1, Math.max(0, Number(vision?.confidence) || 0));
  const productLabel = String(vision?.product_label || "").slice(0, 120);
  const creativeAngle = String(vision?.creative_angle || "").slice(0, 200);

  if (manual && isDetectableCategoryId(manual)) {
    return {
      category: manual,
      confidence: 1,
      product_label: productLabel,
      creative_angle: creativeAngle,
      angle_notes: String(vision?.angle_notes || "").slice(0, 200),
      detected_category: visionCategory,
      detected_confidence: confidence,
      manual: true,
      needs_manual: false,
    };
  }

  if (visionCategory) {
    const useCategory = confidence >= CONFIDENCE_THRESHOLD ? visionCategory : "general";
    return {
      category: useCategory,
      confidence,
      product_label: productLabel,
      creative_angle: creativeAngle,
      angle_notes: String(vision?.angle_notes || "").slice(0, 200),
      detected_category: visionCategory,
      needs_manual: false,
      manual: false,
    };
  }

  return {
    category: "general",
    confidence: 0,
    product_label: productLabel,
    creative_angle: creativeAngle,
    needs_manual: false,
    manual: false,
  };
}

module.exports = {
  analyzeMarketingImages,
  CONFIDENCE_THRESHOLD,
};
