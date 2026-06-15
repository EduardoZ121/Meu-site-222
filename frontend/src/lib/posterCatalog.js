/**
 * Catálogo Posters — ordem de tabs, templates ocultos e ordenação na grelha.
 */

/** Tabs na ordem desejada (só aparecem se tiverem templates visíveis). */
export const POSTER_CAT_ORDER = [
  "social",
  "automotive",
  "beauty",
  "retail",
  "gaming",
  "youtube",
  "business",
  "dj",
  "concert",
  "barber",
  "carousel",
  "editorial",
  "fashion",
  "music",
  "food",
  "fitness",
  "motivational",
  "flyers",
];

/**
 * Templates antigos substituídos pelas famílias premium (evita 2× DJ, Night Vibes, etc.).
 */
export const HIDDEN_POSTER_TEMPLATE_IDS = new Set([
  "music_night_vibes",
  "music_night_frequency",
  "music_night_frequency_2",
  "music_club_night",
]);

/** Premium / famílias com variantes aparecem primeiro na respetiva categoria. */
export const POSTER_TEMPLATE_SORT_RANK = {
  business_executive: 0,
  dj_nightlife: 0,
  concert_live: 0,
  fitness_premium: 0,
  barber_luxury: 0,
  carousel_psychology: 0,
  carousel_marketing: 0,
  carousel_wellness: 0,
  editorial_street: 0,
  editorial_fighter: 0,
  editorial_basketball: 0,
  editorial_shadow: 0,
  fashion_character_showcase: 0,
  fashion_portfolio_sheet: 1,
  fashion_editorial: 0,
  fashion_ig_shop: 0,
  social_typo_hero: 0,
  automotive_showroom: 0,
  beauty_glow: 0,
  retail_product_3d: 0,
  gaming_stream: 0,
  youtube_creator: 0,
  ig_ref_cosmic_wave: 0,
  ig_ref_galaxy: 0,
  ig_ref_chaos_theory: 0,
  ig_ref_friday_vibes: 0,
  ig_ref_focus: 0,
  ig_ref_fashion_putra: 0,
  ig_ref_art_exhibition: 0,
  ig_ref_beast_mode: 0,
  promo_flyer_3d: 0,
  music_artist: 0,
  music_nightlife: 1,
  motivational_impact: 0,
  food_signature: 0,
  fitness_gym: 1,
};

export function isPosterTemplateHidden(template) {
  return Boolean(template?.hidden) || HIDDEN_POSTER_TEMPLATE_IDS.has(String(template?.id || ""));
}

export function normalizePosterTemplates(templates = []) {
  const seen = new Set();
  const out = [];

  for (const tpl of templates) {
    const id = String(tpl?.id || "");
    if (!id || seen.has(id) || isPosterTemplateHidden(tpl)) continue;
    seen.add(id);
    out.push(tpl);
  }

  return out.sort((a, b) => {
    const ra = POSTER_TEMPLATE_SORT_RANK[a.id] ?? 100;
    const rb = POSTER_TEMPLATE_SORT_RANK[b.id] ?? 100;
    if (ra !== rb) return ra - rb;
    return String(a.label || a.id).localeCompare(String(b.label || b.id), "pt");
  });
}

export function visiblePosterCategories(templates = []) {
  const counts = new Set();
  for (const t of templates) counts.add(t.category);
  return POSTER_CAT_ORDER.filter((c) => counts.has(c));
}

export function defaultPosterCategory(templates = []) {
  return visiblePosterCategories(templates)[0] || "music";
}
