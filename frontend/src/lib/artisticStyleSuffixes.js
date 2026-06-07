/**
 * Prompts visíveis do Estúdio Artístico — só descrevem o ESTILO.
 * Identidade / anti-idade vêm de buildArtisticStudioPrompt + servidor.
 */

const STYLIZED_CATEGORIES = new Set([
  "anime_manga",
  "cartoon",
  "illustration",
  "digital",
  "classic",
  "modern",
  "fantasy",
]);

/** Sufixo puro do estilo (sem locks — aplicados no builder). */
export const ARTISTIC_STYLE_SUFFIX = {
  // —— Fotografia ——
  photo_classic_portrait:
    "Classic editorial portrait photography: soft key light, natural skin, shallow depth of field, creamy bokeh background",
  photo_editorial:
    "High-fashion editorial portrait: bold contrast, magazine styling, dramatic studio fashion lighting",
  photo_lifestyle:
    "Authentic lifestyle photography: candid daylight moment, relaxed documentary framing",
  photo_documentary:
    "Documentary monochrome photography: honest moment, photojournalistic framing (grain on image only, not on face age)",
  photo_fine_art:
    "Fine-art photographic print: painterly composition, subtle canvas texture in background",
  photo_glamour:
    "Glamour beauty portrait: beauty-dish lighting, polished skin highlights, luxury campaign look (no age change)",
  photo_street:
    "Street photography: candid urban scene, available light, Henri Cartier-Bresson energy",
  photo_fashion:
    "Runway fashion photography: dynamic pose, sharp flash, haute couture energy",
  photo_cinematic:
    "Cinematic film still: anamorphic framing, movie color grade, dramatic story lighting",
  photo_noir:
    "Film noir photography: high-contrast black and white, hard shadows, mystery mood",
  photo_hdr:
    "HDR commercial photography: rich tonal range, vibrant natural colors, punchy clarity",
  photo_casual:
    "Casual social photo aesthetic: relaxed pose, soft indoor natural light",

  // —— Anime & Manga ——
  dig_anime:
    "Japanese anime illustration: clean line art, large expressive eyes, vibrant cel shading",
  anime_ghibli:
    "Studio Ghibli anime painting: soft watercolor backgrounds, warm gentle palette, hand-painted feel",
  anime_manga_bw:
    "Black-and-white manga ink art: screentone shading, panel illustration style",
  anime_manhwa:
    "Korean manhwa webtoon: clean digital color, soft gradients, romantic character art",
  anime_chibi:
    "Chibi anime: super-deformed cute proportions, bold simple outlines",
  anime_shonen:
    "Shonen anime: dynamic action pose, speed lines, intense heroic energy",
  anime_soft:
    "Soft anime illustration: pastel palette, gentle romantic slice-of-life mood",
  anime_vintage:
    "1980s retro anime cel style: muted retro palette and cel outlines (nostalgic look on art, not aging the person)",
  anime_webtoon:
    "Full-color webtoon illustration: vivid digital painting, vertical-scroll comic style",
  anime_mecha:
    "Mecha anime illustration: detailed robot sci-fi, Gundam-inspired mechanical design",
  anime_vtuber:
    "VTuber character art: Live2D-inspired glossy anime avatar illustration",

  // —— Cartoon & 3D ——
  toon_disney_2d:
    "Classic Disney 2D animation: hand-drawn character design, expressive features",
  toon_disney_3d:
    "Disney Pixar 3D character render: stylized 3D, soft subsurface skin, family-film quality",
  toon_cartoon:
    "Modern TV cartoon: bold outlines, flat vibrant colors, fun exaggerated shapes",
  toon_pokemon_2d:
    "Pokémon-style 2D creature art: Nintendo cel shading, official game illustration look",
  toon_pokemon_3d:
    "Pokémon-style 3D render: glossy cute Nintendo 3D model",
  toon_claymation:
    "Claymation stop-motion: handmade clay texture, Wallace and Gromit charm",
  toon_cute_3d:
    "Cute 3D chibi figurine render: kawaii collectible toy aesthetic",
  toon_figurine:
    "Collectible vinyl figurine product shot: studio product lighting on toy sculpt",

  // —— Ilustração ——
  ill_comic:
    "American superhero comic book: bold ink outlines, vibrant comic colors",
  ill_graphic_novel:
    "Graphic novel illustration: painterly sequential art, mature visual storytelling",
  ill_tintin:
    "Ligne claire Franco-Belgian comic: uniform clean outlines, flat colors",
  ill_vector:
    "Flat vector editorial illustration: geometric shapes, clean modern design",
  ill_ink:
    "Pen-and-ink editorial illustration: cross-hatching, ink drawing style",
  ill_concept:
    "Entertainment concept art sketch: loose confident previs lines",
  ill_tattoo:
    "Tattoo flash design: bold black outlines, traditional tattoo art",
  ill_sticker:
    "Kawaii sticker pack art: white die-cut border, emoji-style cute",
  ill_pop:
    "Pop art screen print: Ben-Day halftone dots, bold primary colors",

  // —— Digital ——
  dig_concept_art:
    "Epic concept art matte painting: cinematic environment, blockbuster previs quality",
  dig_pixel_art:
    "16-bit pixel art: crisp pixel grid, limited retro palette",
  dig_low_poly:
    "Low-poly 3D illustration: faceted geometric forms, soft gradient lighting",
  dig_vaporwave:
    "Vaporwave aesthetic: pink-cyan neon, retro 80s grid, glitch accents",
  dig_cyberpunk:
    "Cyberpunk city scene: neon rain, dystopian futuristic noir",
  dig_synthwave:
    "Synthwave outrun: neon sunset, chrome reflections, 80s grid horizon",
  dig_glitch:
    "Glitch art: RGB split, digital corruption aesthetic",
  dig_holographic:
    "Holographic iridescent effect: prismatic futuristic shimmer",
  dig_isometric:
    "Isometric game icon art: clean mobile-game asset style",
  dig_photoreal:
    "Digital painting with photoreal materials: ArtStation-quality rendering (stylized scene, not face retouch)",

  // —— Clássico ——
  cls_oil:
    "Classical oil painting on canvas: visible brushstrokes, old-masters texture",
  cls_watercolor:
    "Watercolor painting: transparent washes, soft bleeding edges, paper texture",
  cls_charcoal:
    "Charcoal drawing on toned paper: dramatic black-and-white sketch",
  cls_pastel:
    "Soft pastel artwork: powdery delicate colors, dreamy atmosphere",
  cls_engraving:
    "Fine-line engraving print: antique etching hatching style",
  cls_mosaic:
    "Byzantine mosaic art: small colorful tiles, ornate decorative pattern",
  cls_acrylic:
    "Acrylic painting on canvas: bold vivid brushstrokes, contemporary fine art",
  cls_gouache:
    "Gouache editorial illustration: opaque matte pigments, children's-book feel",
  cls_ukiyoe:
    "Japanese ukiyo-e woodblock print: flat colors, traditional wave patterns",
  cls_nihonga:
    "Traditional Nihonga painting: mineral pigments, classical Japanese elegance",

  // —— Moderno ——
  mod_minimal:
    "Minimalist graphic design: clean lines, generous negative space",
  mod_flat:
    "Flat UI illustration: solid colors, no shadows, modern 2D shapes",
  mod_brutalist:
    "Brutalist poster design: harsh typography, raw unpolished layout",
  mod_art_deco:
    "Art Deco graphic design: geometric symmetry, gold accents, 1920s luxury pattern",
  mod_pop_art:
    "Pop art screen print: saturated primaries, Ben-Day dots, Warhol energy",
  mod_surreal:
    "Surrealist dreamscape: impossible objects, Dalí-inspired atmosphere",
  mod_art_nouveau:
    "Art Nouveau illustration: flowing organic lines, Mucha-inspired ornament",
  mod_y2k:
    "Y2K aesthetic: chrome textures, iridescent bubbles, early-2000s digital nostalgia",

  // —— Fantasia ——
  fan_epic:
    "Epic fantasy digital painting: magical heroic atmosphere, LOTR illustration energy",
  fan_dark:
    "Dark fantasy art: gothic shadows, sinister magical mood",
  fan_steampunk:
    "Steampunk illustration: Victorian brass gears, retro-futuristic invention",
  fan_dnd:
    "Tabletop RPG character portrait: D&D fantasy character sheet art",
  fan_space:
    "Space opera sci-fi: epic starships, cosmic nebula backdrop",
  fan_ethereal:
    "Ethereal fantasy: soft glowing fairy-tale forest light",
  fan_gothic:
    "Gothic dark romantic art: cathedral shadows, moody atmosphere",
  fan_neon:
    "Neon glow fantasy art: luminous edges on dark background",

  // —— Vintage (grão/cor no filme, NÃO envelhecer rosto) ——
  vin_pulp:
    "1950s pulp magazine cover illustration: saturated retro print colors",
  vin_pinup_art:
    "1940s vintage pin-up illustration: retro glamour poster (SFW)",
  vin_1920s:
    "1920s photo look: sepia wash and art-deco mood on the whole image only — same face age as reference",
  vin_1990s:
    "1990s snapshot look: direct-flash color cast and faded print — same face age as reference",
  vin_vhs:
    "VHS camcorder look: scanlines and analog noise on the image — same face age as reference",
  vin_polaroid:
    "Polaroid instant film: white frame border, warm faded analog colors — same face age as reference",
  vin_film_grain:
    "Analog film stock color science and grain on the photograph — same face age as reference",
  vin_retro_comic:
    "Golden-age comic print: yellowed newsprint halftone",

  // —— AI Lab (tratamento visual apenas) ——
  lab_qwen_edit:
    "Light polish pass: balanced exposure, clean color grade, natural skin texture",
  lab_ai_rapid:
    "Fast cinematic color grade: cohesive lighting, sharp but natural detail",
  lab_cinematic_edit:
    "Cinematic grade: teal-orange balance, dramatic rim light, film-still mood",
  lab_advanced_prompt:
    "Precise edit following user instructions: coherent lighting and color only",
  lab_experimental_ai:
    "Experimental gallery look: soft neon accents, clean edges",
  lab_ultra_style:
    "Crisp commercial finish: sharp edges, balanced contrast (no face restructuring)",
  lab_flux_edit:
    "Rich color depth: smooth gradients, polished commercial grade",
  lab_realistic_edit:
    "Natural photoreal finish: believable light and materials (same person, same age)",
  lab_hybrid_nsfw:
    "All-in-one rapid edit: follow user prompt on lighting, wardrobe, and background only",

  nsfw_swimwear:
    "Swimwear editorial: beach fashion lighting, sun-kissed skin tone (wardrobe per user prompt)",
  nsfw_beach:
    "Beach lifestyle: golden-hour sand and waves, vacation atmosphere",
  nsfw_lingerie_soft:
    "Soft boudoir editorial: delicate lace, romantic window light",
  nsfw_fitness_glam:
    "Fitness glamour: athletic editorial, gym or studio light",
  nsfw_boudoir:
    "Artistic boudoir portrait: intimate soft romantic light",
  nsfw_pinup:
    "Retro pin-up glamour: studio beauty lighting, classic pose",
  nsfw_dark:
    "Dark sensual editorial: moody shadows, cinematic intimacy",
  nsfw_fantasy:
    "Fantasy pin-up illustration: stylized heroic fantasy character art",
  nsfw_sheer:
    "High-fashion sheer editorial: dramatic studio light on fabrics",
  nsfw_figure_study:
    "Classical figure study fine art: museum lighting on form",
  nsfw_explicit_art:
    "Fine-art adult composition: follow user pose and framing",
  nsfw_intimate_couple:
    "Intimate couple editorial: warm romantic cinematic mood",
  nsfw_cosplay:
    "Cosplay portrait: detailed costume, convention or studio light",
  nsfw_wet_look:
    "Wet-look editorial: water droplets and glistening skin highlights (same face)",
  nsfw_stockings:
    "Fashion legs editorial: stockings and heels styling per user",
  nsfw_oil_body:
    "Glossy skin sheen on body with specular highlights; same face and body structure",
  nsfw_oil_render:
    "Semi-realistic 3D character render: glossy skin material and cinematic studio light on the scene (stylized body render, same identity)",
  nsfw_explicit_pose:
    "Adult editorial pose per user instructions; same identity",
};

export function isStylizedArtCategory(cat) {
  return STYLIZED_CATEGORIES.has(cat);
}

export function resolveArtisticStyleSuffix(style) {
  if (!style) return "";
  return ARTISTIC_STYLE_SUFFIX[style.id] || String(style.suffix || "").trim();
}
