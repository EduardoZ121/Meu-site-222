/**
 * Supported marketing video categories — auto-detect + manual fallback.
 */

const CATEGORIES = {
  fashion: {
    id: "fashion",
    labelPt: "Roupa & Moda",
    labelEn: "Fashion & Apparel",
    hints: ["clothing", "outfit", "model", "garment", "dress", "shirt"],
  },
  drinks: {
    id: "drinks",
    labelPt: "Bebidas",
    labelEn: "Drinks & Beverages",
    hints: ["bottle", "can", "drink", "beverage", "cocktail", "coffee"],
  },
  cars: {
    id: "cars",
    labelPt: "Automóveis",
    labelEn: "Automotive",
    hints: ["car", "vehicle", "automotive", "interior dashboard", "wheel"],
  },
  cosmetics: {
    id: "cosmetics",
    labelPt: "Cosméticos",
    labelEn: "Cosmetics & Beauty",
    hints: ["skincare", "makeup", "perfume", "cosmetic", "cream", "lipstick"],
  },
  websites: {
    id: "websites",
    labelPt: "Sites & Apps",
    labelEn: "Websites & Apps",
    hints: ["website", "app", "dashboard", "ui", "screen", "saas"],
  },
  food: {
    id: "food",
    labelPt: "Alimentação",
    labelEn: "Food & Dining",
    hints: ["food", "restaurant", "dish", "meal", "burger", "pizza"],
  },
  jewelry: {
    id: "jewelry",
    labelPt: "Joias",
    labelEn: "Jewelry",
    hints: ["jewelry", "ring", "necklace", "watch", "gold", "diamond"],
  },
  realEstate: {
    id: "realEstate",
    labelPt: "Imobiliário",
    labelEn: "Real Estate",
    hints: ["property", "house", "apartment", "real estate", "interior design room"],
  },
  gaming: {
    id: "gaming",
    labelPt: "Gaming",
    labelEn: "Gaming Products",
    hints: ["game", "gaming", "controller", "esports", "console"],
  },
};

const CATEGORY_IDS = Object.keys(CATEGORIES);
const CONFIDENCE_THRESHOLD = Number(process.env.MARKETING_VIDEO_CATEGORY_CONFIDENCE || 0.55);

function listMarketingCategories(lang = "pt") {
  const l = String(lang || "pt").slice(0, 2).toLowerCase();
  return CATEGORY_IDS.map((id) => {
    const c = CATEGORIES[id];
    return {
      id,
      label: l === "en" ? c.labelEn : c.labelPt,
    };
  });
}

function isValidCategoryId(id) {
  return CATEGORY_IDS.includes(String(id || "").trim());
}

function getCategoryMeta(id) {
  return CATEGORIES[String(id || "").trim()] || null;
}

module.exports = {
  CATEGORIES,
  CATEGORY_IDS,
  CONFIDENCE_THRESHOLD,
  listMarketingCategories,
  isValidCategoryId,
  getCategoryMeta,
};
