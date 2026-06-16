const POSTER_TEMPLATES = require("./posterTemplatesData.json");
const PREMIUM_POSTER_TEMPLATES = require("./posterPremiumTemplatesData.json");
const EXTENDED_POSTER_TEMPLATES = require("./posterExtendedTemplatesData.json");
const RICH_POSTER_TEMPLATES = require("./posterRichTemplatesData.json");
const FASHION_POSTER_TEMPLATES = require("./posterFashionTemplatesData.json");
const SOCIAL_MARKETING_TEMPLATES = require("./posterSocialMarketingTemplatesData.json");
const PDF_RELEASE_POSTER_TEMPLATES = require("./posterPdfReleaseTemplatesData.json");

const HIDDEN_POSTER_TEMPLATE_IDS = new Set([
  "music_night_vibes",
  "music_night_frequency",
  "music_night_frequency_2",
  "music_club_night",
  "music_street_energy",
  "music_chill_mode",
  "music_stream_control",
  "music_street_chaos",
  "music_classic_drop",
  "music_gold_rush",
  "music_new_single",
  "music_vol_02",
  "music_underground_drop",
  "music_sunset_sound",
  "music_new_release",
  "motivational_discipline_today",
  "motivational_no_limits",
  "motivational_no_limit",
  "motivational_new_chance",
  "motivational_mindset_power",
  "motivational_execute",
  "food_restaurante_sabores_que_conectam",
  "food_sabor_qualidade",
  "food_burgers_artesanais",
  "food_oriental",
  "food_experiencia_unica",
  "fitness_beast_mode",
  "fitness_train_hard",
  "fitness_strong_life",
  "fitness_iron_club",
  "fitness_discipline",
  "fitness_fitness_zone",
  "fashion_character_showcase",
  "fashion_portfolio_sheet",
]);

function listPosterTemplates(opts = {}) {
  const subscriberActive = Boolean(opts.subscriberActive);
  return [
    ...POSTER_TEMPLATES,
    ...PREMIUM_POSTER_TEMPLATES,
    ...EXTENDED_POSTER_TEMPLATES,
    ...RICH_POSTER_TEMPLATES,
    ...FASHION_POSTER_TEMPLATES,
    ...SOCIAL_MARKETING_TEMPLATES,
    ...PDF_RELEASE_POSTER_TEMPLATES,
  ]
    .filter((t) => !HIDDEN_POSTER_TEMPLATE_IDS.has(String(t?.id || "")))
    .map((t) => {
      if (!t?.subscriber_only || subscriberActive) return t;
      return {
        ...t,
        locked: true,
        subscriber_only: true,
        lock_reason: "subscription",
      };
    });
}

function getPosterTemplateById(templateId, opts = {}) {
  const id = String(templateId || "").trim();
  const familyId = id.replace(/__[^/]+$/, "");
  return listPosterTemplates(opts).find((t) => t.id === id || t.id === familyId) || null;
}

module.exports = {
  POSTER_TEMPLATES,
  PREMIUM_POSTER_TEMPLATES,
  EXTENDED_POSTER_TEMPLATES,
  RICH_POSTER_TEMPLATES,
  FASHION_POSTER_TEMPLATES,
  SOCIAL_MARKETING_TEMPLATES,
  PDF_RELEASE_POSTER_TEMPLATES,
  listPosterTemplates,
  getPosterTemplateById,
};

