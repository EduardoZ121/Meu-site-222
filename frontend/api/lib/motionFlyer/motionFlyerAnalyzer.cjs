/**
 * Flyer image analysis + category detection (vision when OpenAI available).
 */
const { getOpenAIKey } = require("../openaiEnv.cjs");
const {
  CATEGORY_IDS,
  CONFIDENCE_THRESHOLD,
  getCategoryMeta,
  isDetectableCategoryId,
} = require("./motionFlyerCategories.cjs");

async function analyzeWithVision(mainImageUrl, lang) {
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
        "You analyze promotional flyers/posters for a 10-second After Effects-style motion flyer video. "
        + "Identify event type, mood, main subject, typography style, and decorative elements. "
        + "Return ONLY valid JSON: "
        + '{"category":"music_event|nightclub|promo|food|fashion|sports|festival|business|general",'
        + '"confidence":0.0-1.0,'
        + '"flyer_label":"short descriptive name in '
        + `${lang === "en" ? "English" : "Portuguese"}`
        + '",'
        + '"motion_mood":"one sentence motion design mood hint",'
        + '"layer_notes":"brief notes on subject, text, logos, decorative elements"}\n\nCategories:\n'
        + categories,
    },
    { type: "image_url", image_url: { url: mainImageUrl, detail: "low" } },
  ];

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

async function analyzeFlyerImage({ mainImageUrl, lang = "pt" }) {
  let vision = null;
  try {
    vision = await analyzeWithVision(mainImageUrl, lang);
  } catch {
    vision = null;
  }

  const visionCategory = vision?.category && isDetectableCategoryId(vision.category)
    ? vision.category
    : null;
  const confidence = Math.min(1, Math.max(0, Number(vision?.confidence) || 0));
  const flyerLabel = String(vision?.flyer_label || "").slice(0, 120);
  const motionMood = String(vision?.motion_mood || "").slice(0, 200);
  const layerNotes = String(vision?.layer_notes || "").slice(0, 200);

  if (visionCategory) {
    const useCategory = confidence >= CONFIDENCE_THRESHOLD ? visionCategory : "general";
    return {
      category: useCategory,
      confidence,
      flyer_label: flyerLabel,
      motion_mood: motionMood,
      layer_notes: layerNotes,
      detected_category: visionCategory,
    };
  }

  return {
    category: "general",
    confidence: 0,
    flyer_label: flyerLabel,
    motion_mood: motionMood,
    layer_notes: layerNotes,
  };
}

module.exports = {
  analyzeFlyerImage,
  CONFIDENCE_THRESHOLD,
};
