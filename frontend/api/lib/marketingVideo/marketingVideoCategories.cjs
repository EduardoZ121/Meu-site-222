/**
 * Supported marketing video categories — auto-detect + manual selection.
 */

const CATEGORIES = {
  fashion: {
    id: "fashion",
    labelPt: "Roupa & Moda",
    labelEn: "Fashion & Apparel",
    hints: ["clothing", "outfit", "model", "garment", "dress", "shirt", "shoes", "accessories"],
  },
  drinks: {
    id: "drinks",
    labelPt: "Bebidas",
    labelEn: "Drinks & Beverages",
    hints: ["bottle", "can", "drink", "beverage", "cocktail", "coffee", "wine", "beer"],
  },
  cars: {
    id: "cars",
    labelPt: "Automóveis",
    labelEn: "Automotive",
    hints: ["car", "vehicle", "automotive", "interior dashboard", "wheel", "motorcycle"],
  },
  cosmetics: {
    id: "cosmetics",
    labelPt: "Cosméticos",
    labelEn: "Cosmetics & Beauty",
    hints: ["skincare", "makeup", "perfume", "cosmetic", "cream", "lipstick", "beauty"],
  },
  websites: {
    id: "websites",
    labelPt: "Sites & Apps",
    labelEn: "Websites & Apps",
    hints: ["website", "app", "dashboard", "ui", "screen", "saas", "software"],
  },
  food: {
    id: "food",
    labelPt: "Alimentação",
    labelEn: "Food & Dining",
    hints: ["food", "restaurant", "dish", "meal", "burger", "pizza", "dessert"],
  },
  jewelry: {
    id: "jewelry",
    labelPt: "Joias",
    labelEn: "Jewelry",
    hints: ["jewelry", "ring", "necklace", "watch", "gold", "diamond", "bracelet"],
  },
  realEstate: {
    id: "realEstate",
    labelPt: "Imobiliário",
    labelEn: "Real Estate",
    hints: ["property", "house", "apartment", "real estate", "interior design room", "villa"],
  },
  gaming: {
    id: "gaming",
    labelPt: "Gaming",
    labelEn: "Gaming Products",
    hints: ["game", "gaming", "controller", "esports", "console", "headset", "keyboard"],
  },
  general: {
    id: "general",
    labelPt: "Outros / Geral",
    labelEn: "Other / General",
    hints: ["pet", "animal", "person", "object", "service", "tool", "gadget", "anything"],
  },
};

/** Manual-only — not returned by vision auto-detect list */
const MANUAL_ONLY_CATEGORIES = {
  random: {
    id: "random",
    labelPt: "Aleatório",
    labelEn: "Random",
    hints: [],
  },
};

const CATEGORY_IDS = Object.keys(CATEGORIES);
const SELECTABLE_CATEGORY_IDS = [...CATEGORY_IDS, "random"];
const CONFIDENCE_THRESHOLD = Number(process.env.MARKETING_VIDEO_CATEGORY_CONFIDENCE || 0.35);

function listMarketingCategories(lang = "pt") {
  const l = String(lang || "pt").slice(0, 2).toLowerCase();
  const random = MANUAL_ONLY_CATEGORIES.random;
  const items = CATEGORY_IDS.map((id) => {
    const c = CATEGORIES[id];
    return { id, label: l === "en" ? c.labelEn : c.labelPt };
  });
  items.push({ id: random.id, label: l === "en" ? random.labelEn : random.labelPt });
  return items;
}

function isValidCategoryId(id) {
  return SELECTABLE_CATEGORY_IDS.includes(String(id || "").trim());
}

function isDetectableCategoryId(id) {
  return CATEGORY_IDS.includes(String(id || "").trim());
}

function getCategoryMeta(id) {
  const key = String(id || "").trim();
  return CATEGORIES[key] || MANUAL_ONLY_CATEGORIES[key] || null;
}

function resolvePipelineCategory(manualCategory, detectedCategory) {
  const manual = String(manualCategory || "").trim();
  if (manual === "random") return "random";
  if (manual && isDetectableCategoryId(manual)) return manual;
  if (detectedCategory && isDetectableCategoryId(detectedCategory)) return detectedCategory;
  return "general";
}

module.exports = {
  CATEGORIES,
  MANUAL_ONLY_CATEGORIES,
  CATEGORY_IDS,
  SELECTABLE_CATEGORY_IDS,
  CONFIDENCE_THRESHOLD,
  listMarketingCategories,
  isValidCategoryId,
  isDetectableCategoryId,
  getCategoryMeta,
  resolvePipelineCategory,
};
