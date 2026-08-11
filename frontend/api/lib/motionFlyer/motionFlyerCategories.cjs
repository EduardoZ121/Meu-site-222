/**
 * Motion flyer categories — auto-detect via vision.
 */

const CATEGORIES = {
  music_event: {
    id: "music_event",
    labelPt: "Música & Eventos",
    labelEn: "Music & Events",
    hints: ["concert", "dj", "music", "album", "festival poster", "live show", "rapper", "band"],
  },
  nightclub: {
    id: "nightclub",
    labelPt: "Noite & Club",
    labelEn: "Nightlife & Club",
    hints: ["club", "nightclub", "party", "neon", "disco", "rave", "afterparty"],
  },
  promo: {
    id: "promo",
    labelPt: "Promoções & Vendas",
    labelEn: "Promo & Sales",
    hints: ["sale", "discount", "promo", "offer", "black friday", "clearance", "deal"],
  },
  food: {
    id: "food",
    labelPt: "Comida & Restaurante",
    labelEn: "Food & Restaurant",
    hints: ["restaurant", "food", "menu", "burger", "pizza", "cafe", "delivery", "chef"],
  },
  fashion: {
    id: "fashion",
    labelPt: "Moda & Estilo",
    labelEn: "Fashion & Style",
    hints: ["fashion", "runway", "clothing", "boutique", "model", "streetwear", "collection"],
  },
  sports: {
    id: "sports",
    labelPt: "Desporto",
    labelEn: "Sports",
    hints: ["sports", "football", "soccer", "basketball", "mma", "fitness", "match", "tournament"],
  },
  festival: {
    id: "festival",
    labelPt: "Festivais",
    labelEn: "Festivals",
    hints: ["festival", "fair", "carnival", "outdoor event", "multi-day", "lineup"],
  },
  business: {
    id: "business",
    labelPt: "Negócios & Corporate",
    labelEn: "Business & Corporate",
    hints: ["business", "corporate", "conference", "webinar", "workshop", "seminar", "launch"],
  },
  general: {
    id: "general",
    labelPt: "Geral",
    labelEn: "General",
    hints: ["event", "flyer", "poster", "announcement", "community", "charity", "anything"],
  },
};

const CATEGORY_IDS = Object.keys(CATEGORIES);
const CONFIDENCE_THRESHOLD = Number(process.env.MOTION_FLYER_CATEGORY_CONFIDENCE || 0.35);

function listMotionFlyerCategories(lang = "pt") {
  const l = String(lang || "pt").slice(0, 2).toLowerCase();
  return CATEGORY_IDS.map((id) => {
    const c = CATEGORIES[id];
    return { id, label: l === "en" ? c.labelEn : c.labelPt };
  });
}

function isDetectableCategoryId(id) {
  return CATEGORY_IDS.includes(String(id || "").trim());
}

function getCategoryMeta(id) {
  return CATEGORIES[String(id || "").trim()] || null;
}

function resolvePipelineCategory(detectedCategory) {
  if (detectedCategory && isDetectableCategoryId(detectedCategory)) return detectedCategory;
  return "general";
}

module.exports = {
  CATEGORIES,
  CATEGORY_IDS,
  CONFIDENCE_THRESHOLD,
  listMotionFlyerCategories,
  isDetectableCategoryId,
  getCategoryMeta,
  resolvePipelineCategory,
};
