/**
 * Capas JPG para a grelha do Estúdio Artístico.
 * AI Lab: `node scripts/download-artistic-covers-nsfw.mjs` (prompts únicos por card)
 * Fotografia (12 estilos): `node scripts/generate-artistic-covers-photography.mjs` — ref mulher + homem (Pollinations Flux)
 * Anime & Manga: `node scripts/generate-artistic-covers-anime.mjs` — ref mulher estilizada por card
 * Cartoon & 3D: `node scripts/generate-artistic-covers-cartoon.mjs` — ref mulher estilizada por card
 * Ilustração & Comic: `node scripts/generate-artistic-covers-illustration.mjs`
 * Digital & Sci-Fi: `node scripts/generate-artistic-covers-digital.mjs`
 * Pintura Clássica: `node scripts/generate-artistic-covers-classic.mjs`
 * Design Moderno: `node scripts/generate-artistic-covers-modern.mjs`
 * Fantasia: `node scripts/generate-artistic-covers-fantasy.mjs`
 * Vintage & Retro: `node scripts/generate-artistic-covers-vintage.mjs`
 * Capas 4:5 (640×800) — alinhadas ao aspect-[4/5] dos cards
 * Outros: `node scripts/generate-artistic-covers.mjs`
 */
export const ARTISTIC_STYLE_COVER_BY_ID = {
  // —— AI Lab (Admin) previews ——
  lab_qwen_edit: "/images/artistic-covers/lab_qwen_edit.jpg",
  lab_ai_rapid: "/images/artistic-covers/lab_ai_rapid.jpg",
  lab_cinematic_edit: "/images/artistic-covers/lab_cinematic_edit.jpg",
  lab_advanced_prompt: "/images/artistic-covers/lab_advanced_prompt.jpg",
  lab_experimental_ai: "/images/artistic-covers/lab_experimental_ai.jpg",
  lab_ultra_style: "/images/artistic-covers/lab_ultra_style.jpg",
  lab_flux_edit: "/images/artistic-covers/lab_flux_edit.jpg",
  lab_realistic_edit: "/images/artistic-covers/lab_realistic_edit.jpg",
  lab_hybrid_nsfw: "/images/artistic-covers/lab_hybrid_nsfw.jpg",
  nsfw_swimwear: "/images/artistic-covers/nsfw_swimwear.jpg",
  nsfw_beach: "/images/artistic-covers/nsfw_beach.jpg",
  nsfw_lingerie_soft: "/images/artistic-covers/nsfw_lingerie_soft.jpg",
  nsfw_fitness_glam: "/images/artistic-covers/nsfw_fitness_glam.jpg",
  nsfw_boudoir: "/images/artistic-covers/nsfw_boudoir.jpg",
  nsfw_pinup: "/images/artistic-covers/nsfw_pinup.jpg",
  nsfw_dark: "/images/artistic-covers/nsfw_dark.jpg",
  nsfw_fantasy: "/images/artistic-covers/nsfw_fantasy.jpg",
  nsfw_sheer: "/images/artistic-covers/nsfw_sheer.jpg",
  nsfw_figure_study: "/images/artistic-covers/nsfw_figure_study.jpg",
  nsfw_explicit_art: "/images/artistic-covers/nsfw_explicit_art.jpg",
  nsfw_intimate_couple: "/images/artistic-covers/nsfw_intimate_couple.jpg",
  nsfw_cosplay: "/images/artistic-covers/nsfw_cosplay.jpg",
  nsfw_wet_look: "/images/artistic-covers/nsfw_wet_look.jpg",
  nsfw_stockings: "/images/artistic-covers/nsfw_stockings.jpg",
  nsfw_oil_body: "/images/artistic-covers/nsfw_oil_body.jpg",
  nsfw_oil_render: "/images/artistic-covers/nsfw_oil_render.jpg",
  nsfw_explicit_pose: "/images/artistic-covers/nsfw_explicit_pose.jpg",
  photo_classic_portrait: "/images/artistic-covers/photo_classic_portrait.jpg",
  photo_editorial: "/images/artistic-covers/photo_editorial.jpg",
  photo_lifestyle: "/images/artistic-covers/photo_lifestyle.jpg",
  photo_documentary: "/images/artistic-covers/photo_documentary.jpg",
  photo_fine_art: "/images/artistic-covers/photo_fine_art.jpg",
  photo_glamour: "/images/artistic-covers/photo_glamour.jpg",
  // —— Fotografia ——
  photo_street: "/images/artistic-covers/photo_street.jpg",
  photo_fashion: "/images/artistic-covers/photo_fashion.jpg",
  photo_cinematic: "/images/artistic-covers/photo_cinematic.jpg",
  photo_noir: "/images/artistic-covers/photo_noir.jpg",
  photo_hdr: "/images/artistic-covers/photo_hdr.jpg",
  photo_casual: "/images/artistic-covers/photo_casual.jpg",
  // —— Anime & Manga ——
  dig_anime: "/images/artistic-covers/dig_anime.jpg",
  anime_ghibli: "/images/artistic-covers/anime_ghibli.jpg",
  anime_manga_bw: "/images/artistic-covers/anime_manga_bw.jpg",
  anime_manhwa: "/images/artistic-covers/anime_manhwa.jpg",
  anime_chibi: "/images/artistic-covers/anime_chibi.jpg",
  anime_shonen: "/images/artistic-covers/anime_shonen.jpg",
  anime_soft: "/images/artistic-covers/anime_soft.jpg",
  anime_vintage: "/images/artistic-covers/anime_vintage.jpg",
  anime_webtoon: "/images/artistic-covers/anime_webtoon.jpg",
  anime_mecha: "/images/artistic-covers/anime_mecha.jpg",
  anime_vtuber: "/images/artistic-covers/anime_vtuber.jpg",
  // —— Cartoon & 3D ——
  toon_disney_2d: "/images/artistic-covers/toon_disney_2d.jpg",
  toon_disney_3d: "/images/artistic-covers/toon_disney_3d.jpg",
  toon_cartoon: "/images/artistic-covers/toon_cartoon.jpg",
  toon_pokemon_2d: "/images/artistic-covers/toon_pokemon_2d.jpg",
  toon_pokemon_3d: "/images/artistic-covers/toon_pokemon_3d.jpg",
  toon_claymation: "/images/artistic-covers/toon_claymation.jpg",
  toon_cute_3d: "/images/artistic-covers/toon_cute_3d.jpg",
  toon_figurine: "/images/artistic-covers/toon_figurine.jpg",
  // —— Ilustração & Comic ——
  ill_comic: "/images/artistic-covers/ill_comic.jpg",
  ill_graphic_novel: "/images/artistic-covers/ill_graphic_novel.jpg",
  ill_tintin: "/images/artistic-covers/ill_tintin.jpg",
  ill_vector: "/images/artistic-covers/ill_vector.jpg",
  ill_ink: "/images/artistic-covers/ill_ink.jpg",
  ill_concept: "/images/artistic-covers/ill_concept.jpg",
  ill_tattoo: "/images/artistic-covers/ill_tattoo.jpg",
  ill_sticker: "/images/artistic-covers/ill_sticker.jpg",
  ill_pop: "/images/artistic-covers/ill_pop.jpg",
  // —— Digital & Sci-Fi ——
  dig_concept_art: "/images/artistic-covers/dig_concept_art.jpg",
  dig_pixel_art: "/images/artistic-covers/dig_pixel_art.jpg",
  dig_low_poly: "/images/artistic-covers/dig_low_poly.jpg",
  dig_vaporwave: "/images/artistic-covers/dig_vaporwave.jpg",
  dig_cyberpunk: "/images/artistic-covers/dig_cyberpunk.jpg",
  dig_synthwave: "/images/artistic-covers/dig_synthwave.jpg",
  dig_glitch: "/images/artistic-covers/dig_glitch.jpg",
  dig_holographic: "/images/artistic-covers/dig_holographic.jpg",
  dig_isometric: "/images/artistic-covers/dig_isometric.jpg",
  dig_photoreal: "/images/artistic-covers/dig_photoreal.jpg",
  // —— Pintura Clássica ——
  cls_oil: "/images/artistic-covers/cls_oil.jpg",
  cls_watercolor: "/images/artistic-covers/cls_watercolor.jpg",
  cls_charcoal: "/images/artistic-covers/cls_charcoal.jpg",
  cls_pastel: "/images/artistic-covers/cls_pastel.jpg",
  cls_engraving: "/images/artistic-covers/cls_engraving.jpg",
  cls_mosaic: "/images/artistic-covers/cls_mosaic.jpg",
  cls_acrylic: "/images/artistic-covers/cls_acrylic.jpg",
  cls_gouache: "/images/artistic-covers/cls_gouache.jpg",
  cls_ukiyoe: "/images/artistic-covers/cls_ukiyoe.jpg",
  cls_nihonga: "/images/artistic-covers/cls_nihonga.jpg",
  // —— Design Moderno ——
  mod_minimal: "/images/artistic-covers/mod_minimal.jpg",
  mod_flat: "/images/artistic-covers/mod_flat.jpg",
  mod_brutalist: "/images/artistic-covers/mod_brutalist.jpg",
  mod_art_deco: "/images/artistic-covers/mod_art_deco.jpg",
  mod_pop_art: "/images/artistic-covers/mod_pop_art.jpg",
  mod_surreal: "/images/artistic-covers/mod_surreal.jpg",
  mod_art_nouveau: "/images/artistic-covers/mod_art_nouveau.jpg",
  mod_y2k: "/images/artistic-covers/mod_y2k.jpg",
  // —— Fantasia & Épico ——
  fan_epic: "/images/artistic-covers/fan_epic.jpg",
  fan_dark: "/images/artistic-covers/fan_dark.jpg",
  fan_steampunk: "/images/artistic-covers/fan_steampunk.jpg",
  fan_dnd: "/images/artistic-covers/fan_dnd.jpg",
  fan_space: "/images/artistic-covers/fan_space.jpg",
  fan_ethereal: "/images/artistic-covers/fan_ethereal.jpg",
  fan_gothic: "/images/artistic-covers/fan_gothic.jpg",
  fan_neon: "/images/artistic-covers/fan_neon.jpg",
  // —— Vintage & Retro ——
  vin_pulp: "/images/artistic-covers/vin_pulp.jpg",
  vin_pinup_art: "/images/artistic-covers/vin_pinup_art.jpg",
  vin_1920s: "/images/artistic-covers/vin_1920s.jpg",
  vin_1990s: "/images/artistic-covers/vin_1990s.jpg",
  vin_vhs: "/images/artistic-covers/vin_vhs.jpg",
  vin_polaroid: "/images/artistic-covers/vin_polaroid.jpg",
  vin_film_grain: "/images/artistic-covers/vin_film_grain.jpg",
  vin_retro_comic: "/images/artistic-covers/vin_retro_comic.jpg",
};

/** Increment when Fotografia grid JPGs change — forces CDN/browser refresh. */
export const ARTISTIC_PHOTO_COVER_VERSION = "20260528-1";

export function artisticStyleCoverSrc(styleId) {
  const path = ARTISTIC_STYLE_COVER_BY_ID[styleId];
  if (!path) return "";
  if (String(styleId).startsWith("photo_")) {
    return `${path}?v=${ARTISTIC_PHOTO_COVER_VERSION}`;
  }
  return path;
}
