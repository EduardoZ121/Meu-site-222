/**
 * On-brand ad style categories (labels only on client — prompts stay server-side).
 */
const CATEGORIES = {
  fashion: { id: "fashion", labelPt: "Moda & Roupa", labelEn: "Fashion & Apparel", icon: "shirt" },
  cars: { id: "cars", labelPt: "Automóveis", labelEn: "Automotive", icon: "car" },
  cosmetics: { id: "cosmetics", labelPt: "Beleza & Cosmética", labelEn: "Beauty & Cosmetics", icon: "sparkles" },
  food: { id: "food", labelPt: "Alimentação", labelEn: "Food & Dining", icon: "utensils" },
  drinks: { id: "drinks", labelPt: "Bebidas", labelEn: "Drinks & Beverages", icon: "wine" },
  websites: { id: "websites", labelPt: "Sites & Apps", labelEn: "Websites & Apps", icon: "globe" },
  people: { id: "people", labelPt: "Pessoas & Lifestyle", labelEn: "People & Lifestyle", icon: "users" },
  tech: { id: "tech", labelPt: "Tech & Gadgets", labelEn: "Tech & Gadgets", icon: "cpu" },
  jewelry: { id: "jewelry", labelPt: "Joias & Relógios", labelEn: "Jewelry & Watches", icon: "gem" },
  realEstate: { id: "realEstate", labelPt: "Imobiliário", labelEn: "Real Estate", icon: "home" },
  fitness: { id: "fitness", labelPt: "Fitness & Desporto", labelEn: "Fitness & Sports", icon: "dumbbell" },
  general: { id: "general", labelPt: "Produto Geral", labelEn: "General Product", icon: "package" },
};

const MANUAL_ONLY = {
  random: { id: "random", labelPt: "Estilo Aleatório", labelEn: "Random Style", icon: "shuffle" },
};

function listBrandCampaignCategories(lang = "pt") {
  const en = String(lang || "pt").slice(0, 2) === "en";
  const label = (c) => (en ? c.labelEn : c.labelPt);
  return [
    ...Object.values(CATEGORIES).map((c) => ({
      id: c.id,
      label: label(c),
      icon: c.icon,
    })),
    {
      id: MANUAL_ONLY.random.id,
      label: label(MANUAL_ONLY.random),
      icon: MANUAL_ONLY.random.icon,
    },
  ];
}

function resolveCategoryId(raw) {
  const id = String(raw || "").trim();
  if (id === "random") return "random";
  if (CATEGORIES[id]) return id;
  return "general";
}

module.exports = {
  CATEGORIES,
  listBrandCampaignCategories,
  resolveCategoryId,
};
