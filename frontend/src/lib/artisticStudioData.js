/**
 * Estúdio Artístico — estilos e efeitos (inspirado em Perchance / mega-lens).
 * `adminOnly` — visível só para admin (ex.: estilos NSFW experimentais).
 */

export const ARTISTIC_STYLE_CATEGORIES = [
  { id: "photography", label: "Fotografia", labelEn: "Photography" },
  { id: "anime_manga", label: "Anime & Manga", labelEn: "Anime & Manga" },
  { id: "cartoon", label: "Cartoon & 3D", labelEn: "Cartoon & 3D" },
  { id: "illustration", label: "Ilustração & Comic", labelEn: "Illustration & Comic" },
  { id: "digital", label: "Digital & Sci-Fi", labelEn: "Digital & Sci-Fi" },
  { id: "classic", label: "Pintura Clássica", labelEn: "Classic Painting" },
  { id: "modern", label: "Design Moderno", labelEn: "Modern Design" },
  { id: "fantasy", label: "Fantasia & Épico", labelEn: "Fantasy & Epic" },
  { id: "vintage", label: "Vintage & Retro", labelEn: "Vintage & Retro" },
  { id: "nsfw", label: "AI Lab (Admin)", labelEn: "AI Lab (Admin)", adminOnly: true, labCategory: true },
];

const NSFW_ADMIN_EMAILS = new Set(["eduardozola1998@gmail.com"]);

export function canAccessNsfwArtisticStyles(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return NSFW_ADMIN_EMAILS.has(String(user.email || "").trim().toLowerCase());
}

export const ARTISTIC_STUDIO_STYLES = [
  // —— Fotografia ——
  { id: "photo_classic_portrait", cat: "photography", label: "Retrato Clássico", labelEn: "Classic Portrait", desc: "Iluminação suave, pele natural, fundo desfocado", descEn: "Soft light, natural skin, blurred background", suffix: "classic portrait photography, soft natural lighting, natural skin texture, shallow depth of field, creamy bokeh background, timeless editorial portrait", gradient: ["#1a1a2e", "#4a5568", "#e2e8f0"], icon: "camera" },
  { id: "photo_editorial", cat: "photography", label: "Retrato Editorial", labelEn: "Editorial Portrait", desc: "Alto contraste, fashion, poses dramáticas", descEn: "High contrast, fashion, dramatic poses", suffix: "high-fashion editorial portrait, dramatic contrast, bold posing, magazine cover quality, sharp styling, professional studio fashion photography", gradient: ["#0f0f0f", "#7c3aed", "#f4f1ea"], icon: "sparkles" },
  { id: "photo_lifestyle", cat: "photography", label: "Lifestyle", labelEn: "Lifestyle", desc: "Natural, candid, luz do dia", descEn: "Natural, candid, daylight", suffix: "authentic lifestyle photography, candid natural moment, soft daylight, relaxed atmosphere, documentary feel, real-world environment", gradient: ["#fef3c7", "#f59e0b", "#78350f"], icon: "sun" },
  { id: "photo_documentary", cat: "photography", label: "Documental", labelEn: "Documentary", desc: "Preto e branco granulado, momentos reais", descEn: "Grainy B&W, real moments", suffix: "documentary black and white photography, visible film grain, raw honest moment, photojournalistic composition, high contrast monochrome", gradient: ["#171717", "#525252", "#a3a3a3"], icon: "aperture" },
  { id: "photo_fine_art", cat: "photography", label: "Fine Art", labelEn: "Fine Art", desc: "Composição pictórica, textura de tela", descEn: "Painterly composition, canvas texture", suffix: "fine art photographic print, painterly composition, canvas texture overlay, gallery-worthy framing, artistic stillness, museum quality", gradient: ["#292524", "#a8a29e", "#fafaf9"], icon: "frame" },
  { id: "photo_glamour", cat: "photography", label: "Glamour", labelEn: "Glamour", desc: "Iluminação de estúdio, pele perfeita, brilho", descEn: "Studio light, flawless skin, shine", suffix: "glamour studio portrait, flawless skin retouch, beauty dish lighting, luminous highlights, elegant shine, luxury beauty campaign", gradient: ["#1e1b4b", "#c084fc", "#fdf4ff"], icon: "gem" },
  { id: "photo_street", cat: "photography", label: "Street", labelEn: "Street", desc: "Urbano, espontâneo, energia da cidade", descEn: "Urban, spontaneous, city energy", suffix: "street photography, candid urban moment, gritty city atmosphere, natural available light, Henri Cartier-Bresson inspired framing", gradient: ["#1f2937", "#6b7280", "#fbbf24"], icon: "camera" },
  { id: "photo_fashion", cat: "photography", label: "Fashion Runway", labelEn: "Fashion Runway", desc: "Passarela, movimento, alta costura", descEn: "Runway, motion, haute couture", suffix: "high fashion runway photography, dynamic motion, designer clothing, sharp flash, Vogue editorial energy", gradient: ["#000000", "#ffffff", "#dc2626"], icon: "sparkles" },
  { id: "photo_cinematic", cat: "photography", label: "Cinematográfico", labelEn: "Cinematic", desc: "Widescreen, grading de filme, drama", descEn: "Widescreen, film grading, drama", suffix: "cinematic still frame, anamorphic widescreen composition, movie color grading, dramatic storytelling lighting, blockbuster film still", gradient: ["#0f172a", "#1e40af", "#f59e0b"], icon: "camera" },
  { id: "photo_noir", cat: "photography", label: "Film Noir", labelEn: "Film Noir", desc: "Sombras duras, mistério, preto e branco", descEn: "Hard shadows, mystery, monochrome", suffix: "film noir photography, hard shadows, venetian blind light patterns, mysterious mood, high contrast black and white", gradient: ["#0a0a0a", "#374151", "#d1d5db"], icon: "moon" },
  { id: "photo_hdr", cat: "photography", label: "HDR Premium", labelEn: "HDR Premium", desc: "Detalhe extremo, cores ricas, impacto", descEn: "Extreme detail, rich colors, impact", suffix: "HDR photography, rich tonal range, hyper-detailed textures, vibrant but natural colors, premium commercial look", gradient: ["#064e3b", "#10b981", "#fef08a"], icon: "sun" },
  { id: "photo_casual", cat: "photography", label: "Casual Photo", labelEn: "Casual Photo", desc: "Estilo rede social, natural e acessível", descEn: "Social-style, natural and approachable", suffix: "casual smartphone-quality photo aesthetic, natural relaxed pose, everyday authentic vibe, soft indoor light", gradient: ["#f3f4f6", "#9ca3af", "#4b5563"], icon: "camera" },

  // —— Anime & Manga ——
  { id: "dig_anime", cat: "anime_manga", label: "Anime", labelEn: "Anime", desc: "Olhos grandes, linhas limpas, cores vibrantes", descEn: "Large eyes, clean lines, vibrant colors", suffix: "anime illustration style, large expressive eyes, clean line art, vibrant cel shading, Japanese animation aesthetic", gradient: ["#312e81", "#ec4899", "#67e8f9"], icon: "star" },
  { id: "anime_ghibli", cat: "anime_manga", label: "Studio Ghibli", labelEn: "Studio Ghibli", desc: "Suave, pastoral, Miyazaki", descEn: "Soft, pastoral, Miyazaki", suffix: "Studio Ghibli anime style, soft watercolor backgrounds, warm gentle colors, Miyazaki aesthetic, hand-painted animation feel", gradient: ["#86efac", "#38bdf8", "#fef9c3"], icon: "cloud" },
  { id: "anime_manga_bw", cat: "anime_manga", label: "Manga P&B", labelEn: "B&W Manga", desc: "Tinta, screentone, painéis", descEn: "Ink, screentone, panels", suffix: "black and white manga illustration, detailed ink lines, screentone shading, Japanese manga panel aesthetic", gradient: ["#fafafa", "#525252", "#0a0a0a"], icon: "pencil" },
  { id: "anime_manhwa", cat: "anime_manga", label: "Manhwa", labelEn: "Manhwa", desc: "Webtoon coreano, cores digitais", descEn: "Korean webtoon, digital colors", suffix: "Korean manhwa webtoon style, clean digital coloring, soft gradients, romantic manhwa character art", gradient: ["#fce7f3", "#a78bfa", "#38bdf8"], icon: "star" },
  { id: "anime_chibi", cat: "anime_manga", label: "Chibi", labelEn: "Chibi", desc: "Super-deformado, kawaii", descEn: "Super-deformed, kawaii", suffix: "chibi anime style, super-deformed cute proportions, kawaii expression, simple bold outlines", gradient: ["#fbcfe8", "#f472b6", "#c084fc"], icon: "circle" },
  { id: "anime_shonen", cat: "anime_manga", label: "Shonen", labelEn: "Shonen", desc: "Ação, dinâmica, herói", descEn: "Action, dynamic, heroic", suffix: "shonen anime style, dynamic action pose, speed lines, intense expression, battle manga energy", gradient: ["#dc2626", "#f97316", "#1d4ed8"], icon: "zap" },
  { id: "anime_soft", cat: "anime_manga", label: "Soft Anime", labelEn: "Soft Anime", desc: "Pastel, romântico, suave", descEn: "Pastel, romantic, soft", suffix: "soft anime illustration, pastel palette, gentle shading, romantic slice-of-life aesthetic", gradient: ["#fce7f3", "#ddd6fe", "#bfdbfe"], icon: "cloud" },
  { id: "anime_vintage", cat: "anime_manga", label: "Anime Vintage 80s", labelEn: "Vintage 80s Anime", desc: "Retro cel, VHS, nostalgia", descEn: "Retro cel, VHS, nostalgia", suffix: "1980s vintage anime style, retro cel animation, muted VHS colors, classic OVA aesthetic", gradient: ["#7c2d12", "#ea580c", "#4338ca"], icon: "waves" },
  { id: "anime_webtoon", cat: "anime_manga", label: "Webtoon Color", labelEn: "Webtoon Color", desc: "Vertical scroll, cores vivas", descEn: "Vertical scroll, vivid colors", suffix: "full color webtoon illustration, vertical scroll comic style, vivid digital painting, modern online comic", gradient: ["#22d3ee", "#a855f7", "#f472b6"], icon: "star" },
  { id: "anime_mecha", cat: "anime_manga", label: "Mecha", labelEn: "Mecha", desc: "Robôs, sci-fi anime, detalhe", descEn: "Robots, sci-fi anime, detail", suffix: "mecha anime illustration, detailed giant robot, sci-fi mechanical design, Gundam-inspired aesthetic", gradient: ["#1e3a8a", "#64748b", "#ef4444"], icon: "shapes" },
  { id: "anime_vtuber", cat: "anime_manga", label: "VTuber", labelEn: "VTuber", desc: "Avatar live2D, brilho digital", descEn: "Live2D avatar, digital shine", suffix: "VTuber character illustration, Live2D style, glossy anime eyes, streaming avatar aesthetic", gradient: ["#ec4899", "#8b5cf6", "#22d3ee"], icon: "gem" },

  // —— Cartoon & 3D ——
  { id: "toon_disney_2d", cat: "cartoon", label: "Disney 2D", labelEn: "Disney 2D", desc: "Animação clássica 2D", descEn: "Classic 2D animation", suffix: "Disney 2D animation style character, classic hand-drawn princess or hero aesthetic, expressive features", gradient: ["#1e40af", "#f472b6", "#fef08a"], icon: "star" },
  { id: "toon_disney_3d", cat: "cartoon", label: "Disney / Pixar 3D", labelEn: "Disney / Pixar 3D", desc: "3D fofo, render cinematográfico", descEn: "Cute 3D, cinematic render", suffix: "Disney Pixar 3D character style, cute stylized 3D render, subsurface scattering skin, family film quality", gradient: ["#0ea5e9", "#f59e0b", "#f472b6"], icon: "gem" },
  { id: "toon_cartoon", cat: "cartoon", label: "Cartoon TV", labelEn: "TV Cartoon", desc: "Linhas bold, cores chapadas", descEn: "Bold lines, flat colors", suffix: "modern TV cartoon style, bold outlines, flat vibrant colors, exaggerated fun proportions", gradient: ["#facc15", "#22c55e", "#3b82f6"], icon: "circle" },
  { id: "toon_pokemon_2d", cat: "cartoon", label: "Pokémon 2D", labelEn: "Pokémon 2D", desc: "Estilo jogo Nintendo 2D", descEn: "Nintendo 2D game style", suffix: "Pokemon 2D official art style, Nintendo creature design, clean cel shading", gradient: ["#fbbf24", "#3b82f6", "#ef4444"], icon: "star" },
  { id: "toon_pokemon_3d", cat: "cartoon", label: "Pokémon 3D", labelEn: "Pokémon 3D", desc: "Render 3D Nintendo", descEn: "Nintendo 3D render", suffix: "Pokemon 3D render style, Nintendo 3D creature, glossy cute 3D model", gradient: ["#fde047", "#2563eb", "#dc2626"], icon: "shapes" },
  { id: "toon_claymation", cat: "cartoon", label: "Claymation", labelEn: "Claymation", desc: "Stop-motion em barro", descEn: "Clay stop-motion", suffix: "claymation stop motion style, handmade clay texture, Wallace and Gromit aesthetic", gradient: ["#a16207", "#ca8a04", "#fef3c7"], icon: "brush" },
  { id: "toon_cute_3d", cat: "cartoon", label: "Cute 3D Chibi", labelEn: "Cute 3D Chibi", desc: "Kawaii 3D, collectible", descEn: "Kawaii 3D, collectible", suffix: "cute 3D chibi character render, kawaii collectible figurine, soft plastic toy aesthetic", gradient: ["#fbcfe8", "#c4b5fd", "#67e8f9"], icon: "gem" },
  { id: "toon_figurine", cat: "cartoon", label: "Cute Figurine", labelEn: "Cute Figurine", desc: "Figura de coleção fotoreal", descEn: "Photoreal collectible figure", suffix: "cute figurine product photography, collectible toy render, studio product lighting, vinyl figure aesthetic", gradient: ["#f8fafc", "#cbd5e1", "#f472b6"], icon: "gem" },

  // —— Ilustração & Comic ——
  { id: "ill_comic", cat: "illustration", label: "Comic Book", labelEn: "Comic Book", desc: "HQ americana, cores bold", descEn: "American comics, bold colors", suffix: "American comic book style, bold ink outlines, vibrant superhero comic colors, dynamic composition", gradient: ["#dc2626", "#2563eb", "#facc15"], icon: "zap" },
  { id: "ill_graphic_novel", cat: "illustration", label: "Graphic Novel", labelEn: "Graphic Novel", desc: "Narrativa visual madura", descEn: "Mature visual storytelling", suffix: "graphic novel illustration, painterly comic art, mature narrative visual style, detailed sequential art", gradient: ["#1c1917", "#78716c", "#dc2626"], icon: "brush" },
  { id: "ill_tintin", cat: "illustration", label: "Ligne Claire", labelEn: "Ligne Claire", desc: "Tintin / Franco-Belga", descEn: "Tintin / Franco-Belgian", suffix: "ligne claire comic style, Tintin Franco-Belgian comic, clean uniform outlines, flat colors", gradient: ["#38bdf8", "#fbbf24", "#ef4444"], icon: "lines" },
  { id: "ill_vector", cat: "illustration", label: "Vector Flat", labelEn: "Vector Flat", desc: "Ilustração vetorial limpa", descEn: "Clean vector illustration", suffix: "flat vector illustration, clean geometric shapes, modern editorial vector art", gradient: ["#22c55e", "#3b82f6", "#f97316"], icon: "square" },
  { id: "ill_ink", cat: "illustration", label: "Ink Illustration", labelEn: "Ink Illustration", desc: "Tinta, hachura, editorial", descEn: "Ink, hatching, editorial", suffix: "pen and ink illustration, detailed cross-hatching, editorial ink drawing style", gradient: ["#fafaf9", "#525252", "#0a0a0a"], icon: "pencil" },
  { id: "ill_concept", cat: "illustration", label: "Concept Sketch", labelEn: "Concept Sketch", desc: "Rascunho profissional rápido", descEn: "Quick professional sketch", suffix: "professional concept art sketch, loose confident lines, entertainment industry previs", gradient: ["#374151", "#9ca3af", "#f59e0b"], icon: "pencil" },
  { id: "ill_tattoo", cat: "illustration", label: "Tattoo Flash", labelEn: "Tattoo Flash", desc: "Tinta, contornos bold", descEn: "Ink, bold outlines", suffix: "tattoo flash design style, bold black outlines, traditional tattoo art, ink on skin aesthetic", gradient: ["#0a0a0a", "#f8fafc", "#dc2626"], icon: "lines" },
  { id: "ill_sticker", cat: "illustration", label: "Sticker / Emoji", labelEn: "Sticker / Emoji", desc: "Contorno branco, cute", descEn: "White outline, cute", suffix: "cute sticker illustration, white die-cut border, emoji pack style, kawaii sticker art", gradient: ["#fef08a", "#f472b6", "#22d3ee"], icon: "circle" },
  { id: "ill_pop", cat: "illustration", label: "Pop Art Comic", labelEn: "Pop Art Comic", desc: "Warhol, halftone, saturação", descEn: "Warhol, halftone, saturation", suffix: "pop art comic style, Ben-Day halftone dots, Andy Warhol screen print, bold primary colors", gradient: ["#dc2626", "#2563eb", "#facc15"], icon: "circle" },

  // —— Digital & Sci-Fi ——
  { id: "dig_concept_art", cat: "digital", label: "Concept Art", labelEn: "Concept Art", desc: "Ambientes épicos, cinematográfico", descEn: "Epic environments, cinematic", suffix: "epic concept art, cinematic environment, highly detailed digital painting, matte painting quality, blockbuster film previsualization", gradient: ["#0c4a6e", "#0369a1", "#fbbf24"], icon: "mountain" },
  { id: "dig_pixel_art", cat: "digital", label: "Pixel Art", labelEn: "Pixel Art", desc: "Retro 8-bit/16-bit", descEn: "Retro 8-bit/16-bit", suffix: "retro pixel art, 16-bit game aesthetic, limited color palette, crisp pixel grid, nostalgic arcade style", gradient: ["#14532d", "#22c55e", "#86efac"], icon: "grid" },
  { id: "dig_low_poly", cat: "digital", label: "Low Poly", labelEn: "Low Poly", desc: "Geométrico 3D minimalista", descEn: "Minimalist geometric 3D", suffix: "low poly 3D render, geometric faceted surfaces, minimalist stylized forms, soft gradient lighting, modern 3D illustration", gradient: ["#4c1d95", "#a78bfa", "#06b6d4"], icon: "shapes" },
  { id: "dig_vaporwave", cat: "digital", label: "Vaporwave", labelEn: "Vaporwave", desc: "Neon rosa/azul, glitch 80s", descEn: "Pink/cyan neon, 80s glitch", suffix: "vaporwave aesthetic, pink and cyan neon, 80s retro grid, glitch artifacts, nostalgic synthwave mood", gradient: ["#ec4899", "#8b5cf6", "#06b6d4"], icon: "waves" },
  { id: "dig_cyberpunk", cat: "digital", label: "Cyberpunk", labelEn: "Cyberpunk", desc: "Neon, chuva, distopia", descEn: "Neon, rain, dystopia", suffix: "cyberpunk dystopian city, neon rain, high technology, blade runner atmosphere, futuristic noir lighting", gradient: ["#0f172a", "#7c3aed", "#22d3ee"], icon: "zap" },
  { id: "dig_synthwave", cat: "digital", label: "Synthwave", labelEn: "Synthwave", desc: "Pôr do sol retro, grid neon", descEn: "Retro sunset, neon grid", suffix: "synthwave retrowave style, neon pink purple sunset, 80s outrun grid, chrome reflections", gradient: ["#581c87", "#ec4899", "#f97316"], icon: "waves" },
  { id: "dig_glitch", cat: "digital", label: "Glitch Art", labelEn: "Glitch Art", desc: "Distorção digital, RGB split", descEn: "Digital distortion, RGB split", suffix: "glitch art aesthetic, RGB channel split, digital corruption, cyber error visual", gradient: ["#0f172a", "#22d3ee", "#f43f5e"], icon: "zap" },
  { id: "dig_holographic", cat: "digital", label: "Holographic", labelEn: "Holographic", desc: "Iridescente, futurista", descEn: "Iridescent, futuristic", suffix: "holographic iridescent effect, futuristic hologram projection, prismatic rainbow shimmer", gradient: ["#6366f1", "#22d3ee", "#f472b6"], icon: "sparkles" },
  { id: "dig_isometric", cat: "digital", label: "Isometric Icon", labelEn: "Isometric Icon", desc: "3D isométrico, app/game", descEn: "Isometric 3D, app/game", suffix: "3D isometric icon illustration, clean game art icon, soft shadows, mobile game asset style", gradient: ["#38bdf8", "#a78bfa", "#34d399"], icon: "shapes" },
  { id: "dig_photoreal", cat: "digital", label: "Photoreal Digital", labelEn: "Photoreal Digital", desc: "Pintura digital ultra real", descEn: "Ultra-real digital painting", suffix: "photorealistic digital painting, ArtStation quality, hyperrealistic details, professional digital art", gradient: ["#1e293b", "#64748b", "#f1f5f9"], icon: "camera" },

  // —— Pintura Clássica ——
  { id: "cls_oil", cat: "classic", label: "Óleo", labelEn: "Oil Painting", desc: "Pinceladas visíveis, mestres", descEn: "Visible brushstrokes, old masters", suffix: "classical oil painting, visible brushstrokes, rich impasto texture, old masters technique, museum oil on canvas", gradient: ["#451a03", "#b45309", "#fde68a"], icon: "brush" },
  { id: "cls_watercolor", cat: "classic", label: "Aquarela", labelEn: "Watercolor", desc: "Fluido, transparente, suave", descEn: "Fluid, transparent, soft", suffix: "delicate watercolor painting, fluid transparent washes, soft bleeding edges, paper texture, airy luminous pigments", gradient: ["#dbeafe", "#60a5fa", "#1d4ed8"], icon: "droplet" },
  { id: "cls_charcoal", cat: "classic", label: "Carvão", labelEn: "Charcoal", desc: "P&B, textura áspera", descEn: "B&W, rough texture", suffix: "charcoal sketch drawing, rough textured strokes, dramatic black and white, artistic study on toned paper", gradient: ["#0a0a0a", "#404040", "#d4d4d4"], icon: "pencil" },
  { id: "cls_pastel", cat: "classic", label: "Pastel", labelEn: "Pastel", desc: "Cores em pó, sonho", descEn: "Powder colors, dreamy", suffix: "soft pastel artwork, powdery delicate colors, dreamy gentle atmosphere, chalk pastel texture", gradient: ["#fce7f3", "#f9a8d4", "#c4b5fd"], icon: "cloud" },
  { id: "cls_engraving", cat: "classic", label: "Gravura", labelEn: "Engraving", desc: "Linhas finas, técnica antiga", descEn: "Fine lines, antique technique", suffix: "fine line engraving illustration, black and white hatching, antique print technique, detailed etching style", gradient: ["#fafaf9", "#78716c", "#1c1917"], icon: "lines" },
  { id: "cls_mosaic", cat: "classic", label: "Mosaico", labelEn: "Mosaic", desc: "Azulejos, bizantino", descEn: "Tiles, Byzantine", suffix: "Byzantine mosaic art, small colorful tiles, ornate decorative pattern, historic sacred aesthetic", gradient: ["#1e3a8a", "#eab308", "#dc2626"], icon: "tiles" },
  { id: "cls_acrylic", cat: "classic", label: "Acrílico", labelEn: "Acrylic", desc: "Cores vivas, textura moderna", descEn: "Vivid colors, modern texture", suffix: "acrylic painting on canvas, bold vivid brushstrokes, contemporary fine art acrylic texture", gradient: ["#f97316", "#eab308", "#22c55e"], icon: "brush" },
  { id: "cls_gouache", cat: "classic", label: "Gouache", labelEn: "Gouache", desc: "Opaco, ilustração editorial", descEn: "Opaque, editorial illustration", suffix: "gouache painting illustration, opaque matte pigments, editorial children's book aesthetic", gradient: ["#fef08a", "#86efac", "#38bdf8"], icon: "brush" },
  { id: "cls_ukiyoe", cat: "classic", label: "Ukiyo-e", labelEn: "Ukiyo-e", desc: "Gravura japonesa tradicional", descEn: "Traditional Japanese woodblock", suffix: "Japanese ukiyo-e woodblock print style, flat colors, traditional waves and patterns", gradient: ["#1e3a8a", "#f8fafc", "#dc2626"], icon: "frame" },
  { id: "cls_nihonga", cat: "classic", label: "Nihonga", labelEn: "Nihonga", desc: "Pintura japonesa clássica", descEn: "Classical Japanese painting", suffix: "traditional Nihonga Japanese painting, mineral pigments, elegant classical Japanese art", gradient: ["#fef3c7", "#fca5a5", "#1e40af"], icon: "frame" },

  // —— Design Moderno ——
  { id: "mod_minimal", cat: "modern", label: "Minimalista", labelEn: "Minimalist", desc: "Linhas limpas, espaço negativo", descEn: "Clean lines, negative space", suffix: "minimalist design, clean lines, generous negative space, restrained composition, modern simplicity", gradient: ["#f8fafc", "#94a3b8", "#0f172a"], icon: "minus" },
  { id: "mod_flat", cat: "modern", label: "Flat Design", labelEn: "Flat Design", desc: "Cores sólidas, 2D UI", descEn: "Solid colors, 2D UI", suffix: "flat design illustration, solid colors, no shadows, clean 2D vector shapes, modern UI illustration style", gradient: ["#ef4444", "#3b82f6", "#22c55e"], icon: "square" },
  { id: "mod_brutalist", cat: "modern", label: "Brutalismo", labelEn: "Brutalism", desc: "Tipografia áspera, anti-design", descEn: "Harsh type, anti-design", suffix: "brutalist graphic design, harsh typography, raw unpolished colors, anti-design poster aesthetic", gradient: ["#000000", "#facc15", "#ffffff"], icon: "type" },
  { id: "mod_art_deco", cat: "modern", label: "Art Déco", labelEn: "Art Deco", desc: "Geométrico, dourado, anos 20", descEn: "Geometric, gold, 1920s", suffix: "Art Deco style, geometric symmetry, gold accents, elegant 1920s luxury, decorative geometric patterns", gradient: ["#0f0f0f", "#ca8a04", "#fef9c3"], icon: "diamond" },
  { id: "mod_pop_art", cat: "modern", label: "Pop Art", labelEn: "Pop Art", desc: "Warhol, Ben-Day dots", descEn: "Warhol, Ben-Day dots", suffix: "pop art style, saturated primary colors, Ben-Day dots, Andy Warhol screen print aesthetic, bold graphic contrast", gradient: ["#dc2626", "#2563eb", "#facc15"], icon: "circle" },
  { id: "mod_surreal", cat: "modern", label: "Surrealismo", labelEn: "Surrealism", desc: "Sonho, objetos impossíveis", descEn: "Dream, impossible objects", suffix: "surrealist dreamscape, floating impossible objects, subconscious symbolic imagery, Salvador Dalí inspired atmosphere", gradient: ["#1e1b4b", "#f97316", "#a5f3fc"], icon: "moon" },
  { id: "mod_art_nouveau", cat: "modern", label: "Art Nouveau", labelEn: "Art Nouveau", desc: "Linhas orgânicas decorativas", descEn: "Organic decorative lines", suffix: "Art Nouveau illustration, ornate flowing organic lines, decorative floral patterns, Alphonse Mucha inspired", gradient: ["#065f46", "#a16207", "#fef3c7"], icon: "diamond" },
  { id: "mod_y2k", cat: "modern", label: "Y2K Aesthetic", labelEn: "Y2K Aesthetic", desc: "Chrome, bubble, anos 2000", descEn: "Chrome, bubbles, 2000s", suffix: "Y2K aesthetic, chrome textures, iridescent bubbles, early 2000s digital nostalgia", gradient: ["#c084fc", "#67e8f9", "#f9a8d4"], icon: "sparkles" },

  // —— Fantasia & Épico ——
  { id: "fan_epic", cat: "fantasy", label: "Epic Fantasy", labelEn: "Epic Fantasy", desc: "Pintura épica, magia", descEn: "Epic painting, magic", suffix: "epic fantasy digital painting, magical atmosphere, heroic fantasy art, Lord of the Rings illustration quality", gradient: ["#1e3a8a", "#7c3aed", "#fbbf24"], icon: "mountain" },
  { id: "fan_dark", cat: "fantasy", label: "Dark Fantasy", labelEn: "Dark Fantasy", desc: "Sombrio, gótico, moody", descEn: "Dark, gothic, moody", suffix: "dark fantasy art, gothic atmosphere, moody shadows, sinister magical realism", gradient: ["#0a0a0a", "#4c1d95", "#7f1d1d"], icon: "moon" },
  { id: "fan_steampunk", cat: "fantasy", label: "Steampunk", labelEn: "Steampunk", desc: "Vitoriano, engrenagens, brass", descEn: "Victorian, gears, brass", suffix: "steampunk style, Victorian mechanical aesthetic, brass gears and copper pipes, retro-futuristic invention", gradient: ["#78350f", "#ca8a04", "#57534e"], icon: "shapes" },
  { id: "fan_dnd", cat: "fantasy", label: "D&D Character", labelEn: "D&D Character", desc: "RPG tabletop, ficha de personagem", descEn: "Tabletop RPG character", suffix: "Dungeons and Dragons character portrait, tabletop RPG fantasy art, detailed character sheet illustration", gradient: ["#7f1d1d", "#a16207", "#1e40af"], icon: "star" },
  { id: "fan_space", cat: "fantasy", label: "Space Opera", labelEn: "Space Opera", desc: "Sci-fi épico, naves, nebulosas", descEn: "Epic sci-fi, ships, nebulae", suffix: "space opera sci-fi illustration, epic starships, cosmic nebula background, Star Wars concept art energy", gradient: ["#0f172a", "#6366f1", "#22d3ee"], icon: "mountain" },
  { id: "fan_ethereal", cat: "fantasy", label: "Ethereal Fantasy", labelEn: "Ethereal Fantasy", desc: "Luz suave, fadas, sonho", descEn: "Soft light, fairies, dream", suffix: "ethereal fantasy illustration, soft glowing light, fairy tale magical forest, dreamy otherworldly beauty", gradient: ["#ddd6fe", "#a5f3fc", "#fce7f3"], icon: "cloud" },
  { id: "fan_gothic", cat: "fantasy", label: "Gothic", labelEn: "Gothic", desc: "Arquitetura gótica, sombras", descEn: "Gothic architecture, shadows", suffix: "gothic dark art style, cathedral shadows, moody dark romantic atmosphere, dark fantasy aesthetic", gradient: ["#0a0a0a", "#312e81", "#991b1b"], icon: "moon" },
  { id: "fan_neon", cat: "fantasy", label: "Neon Glow", labelEn: "Neon Glow", desc: "Bordas luminosas, fundo escuro", descEn: "Glowing edges, dark background", suffix: "neon glow effect art, glowing edges on dark background, vibrant neon outlines, electric fantasy", gradient: ["#0f172a", "#d946ef", "#22d3ee"], icon: "zap" },

  // —— Vintage & Retro ——
  { id: "vin_pulp", cat: "vintage", label: "Pulp Art", labelEn: "Pulp Art", desc: "Capa retro, cores saturadas", descEn: "Retro cover, saturated colors", suffix: "vintage pulp magazine cover art, saturated retro illustration, 1950s adventure poster style", gradient: ["#dc2626", "#fbbf24", "#1e3a8a"], icon: "frame" },
  { id: "vin_pinup_art", cat: "vintage", label: "Pin-up Vintage", labelEn: "Vintage Pin-up", desc: "Ilustração retro glam (SFW)", descEn: "Retro glam illustration (SFW)", suffix: "vintage pin-up illustration style, 1940s retro glamour poster, tasteful classic Americana art", gradient: ["#be123c", "#fbbf24", "#1e3a8a"], icon: "sparkles" },
  { id: "vin_1920s", cat: "vintage", label: "Anos 1920", labelEn: "1920s Photo", desc: "Sépia, art déco, charleston", descEn: "Sepia, art deco, Charleston", suffix: "1920s vintage photograph aesthetic, sepia tones, art deco era fashion, flapper era atmosphere", gradient: ["#78716c", "#d6d3d1", "#1c1917"], icon: "camera" },
  { id: "vin_1990s", cat: "vintage", label: "Anos 90 Photo", labelEn: "1990s Photo", desc: "Flash direto, cores datadas", descEn: "Direct flash, dated colors", suffix: "1990s photograph aesthetic, direct flash, slightly faded colors, nostalgic 90s snapshot", gradient: ["#f472b6", "#38bdf8", "#facc15"], icon: "camera" },
  { id: "vin_vhs", cat: "vintage", label: "VHS / Camcorder", labelEn: "VHS / Camcorder", desc: "Scanlines, data, noise", descEn: "Scanlines, date stamp, noise", suffix: "VHS camcorder footage aesthetic, scanlines, date stamp overlay, analog video noise, retro home video", gradient: ["#1f2937", "#6b7280", "#f43f5e"], icon: "waves" },
  { id: "vin_polaroid", cat: "vintage", label: "Polaroid", labelEn: "Polaroid", desc: "Instantâneo, bordas, nostalgia", descEn: "Instant film, borders, nostalgia", suffix: "Polaroid instant film photograph, white frame border, faded warm analog colors, nostalgic snapshot", gradient: ["#fef3c7", "#d6d3d1", "#78716c"], icon: "camera" },
  { id: "vin_film_grain", cat: "vintage", label: "Film Grain Analog", labelEn: "Analog Film Grain", desc: "Grão de filme, analógico", descEn: "Film grain, analog look", suffix: "analog film photography, heavy authentic film grain, Kodak Portra color science, nostalgic celluloid", gradient: ["#422006", "#a8a29e", "#ecfccb"], icon: "aperture" },
  { id: "vin_retro_comic", cat: "vintage", label: "Vintage Comic", labelEn: "Vintage Comic", desc: "HQ antiga, papel amarelado", descEn: "Old comic, yellowed paper", suffix: "vintage comic book print, aged yellowed newsprint, retro halftone printing, golden age comic", gradient: ["#fef08a", "#f97316", "#1d4ed8"], icon: "lines" },

  // —— AI Lab experimental (admin only) — presets edit rápido / Qwen-style ——
  { id: "lab_qwen_edit", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "QWEN", label: "Qwen Edit Rapid", labelEn: "Qwen Edit Rapid", desc: "Edição rápida IA, identidade preservada", descEn: "Rapid AI edit, identity preserved", suffix: "Qwen-style rapid image edit, high fidelity transformation, preserve subject identity and pose, intelligent inpainting quality, photorealistic edit pass, mature artistic edit", gradient: ["#0c0a1f", "#6366f1", "#22d3ee"], icon: "zap" },
  { id: "lab_ai_rapid", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "RAPID", label: "AI Rapid", labelEn: "AI Rapid", desc: "Preset ultra-rápido, look cinematográfico", descEn: "Ultra-fast preset, cinematic look", suffix: "rapid AI image generation edit, fast inference aesthetic, sharp details, cinematic color grade, professional finish, cohesive lighting", gradient: ["#1e1b4b", "#ec4899", "#f97316"], icon: "zap" },
  { id: "lab_cinematic_edit", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "CINE", label: "Cinematic Edit", labelEn: "Cinematic Edit", desc: "Edição moody, luz de filme, drama", descEn: "Moody film lighting, drama", suffix: "cinematic AI image edit, anamorphic mood, dramatic rim lighting, teal orange grade, blockbuster still quality, mature atmospheric edit", gradient: ["#0f172a", "#7c3aed", "#f59e0b"], icon: "camera" },
  { id: "lab_advanced_prompt", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "PROMPT", label: "Advanced Prompt Edit", labelEn: "Advanced Prompt Edit", desc: "Segue prompt complexo com precisão", descEn: "Follows complex prompts precisely", suffix: "advanced prompt-driven image edit, precise instruction following, layered semantic edit, high coherence, studio-grade refinement, detail preservation", gradient: ["#312e81", "#a855f7", "#38bdf8"], icon: "sparkles" },
  { id: "lab_experimental_ai", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "EXP", label: "Experimental AI", labelEn: "Experimental AI", desc: "Look laboratório, cores neon suaves", descEn: "Lab look, soft neon colors", suffix: "experimental AI art lab aesthetic, soft neon accents, futuristic edit pipeline, hyper-clean edges, gallery experimental style", gradient: ["#4c0519", "#db2777", "#67e8f9"], icon: "sparkles" },
  { id: "lab_ultra_style", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "ULTRA", label: "Ultra Style", labelEn: "Ultra Style", desc: "Máximo detalhe e nitidez premium", descEn: "Maximum detail and premium sharpness", suffix: "ultra high definition AI style transfer, 8K micro-detail, premium skin texture, crisp edges, luxury editorial finish", gradient: ["#0a0a0a", "#52525b", "#fafafa"], icon: "gem" },
  { id: "lab_flux_edit", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "FLUX", label: "Flux Edit", labelEn: "Flux Edit", desc: "Estética Flux — cores ricas e fluidez", descEn: "Flux aesthetic — rich colors and flow", suffix: "Flux model aesthetic image edit, rich color depth, smooth gradients, modern diffusion quality, polished commercial edit", gradient: ["#172554", "#7c3aed", "#f472b6"], icon: "waves" },
  { id: "lab_realistic_edit", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "REAL", label: "Realistic Edit", labelEn: "Realistic Edit", desc: "Fotorrealismo extremo pós-edição", descEn: "Extreme photorealism after edit", suffix: "photorealistic AI image edit, natural skin tones, accurate lighting physics, DSLR quality, believable materials, mature realistic portrait edit", gradient: ["#1c1917", "#78716c", "#fde68a"], icon: "camera" },
  { id: "lab_hybrid_nsfw", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "AIO", label: "Rapid AIO Blend", labelEn: "Rapid AIO Blend", desc: "Preset all-in-one estilo HF rapid", descEn: "All-in-one rapid HF-style preset", suffix: "all-in-one rapid image edit pipeline, blended diffusion edit, identity-locked transformation, mature editorial artistic edit, high coherence rapid pass", gradient: ["#831843", "#9333ea", "#06b6d4"], icon: "zap" },
  { id: "nsfw_boudoir", cat: "nsfw", adminOnly: true, label: "Boudoir", labelEn: "Boudoir", desc: "Retrato íntimo artístico", descEn: "Artistic intimate portrait", suffix: "artistic boudoir photography style, intimate mood, soft romantic lighting, elegant sensual atmosphere, mature artistic portrait", gradient: ["#1e1b4b", "#be185d", "#fce7f3"], icon: "gem" },
  { id: "nsfw_pinup", cat: "nsfw", adminOnly: true, label: "Pin-up Glam", labelEn: "Pin-up Glam", desc: "Glamour retro sensual", descEn: "Sensual retro glam", suffix: "glamorous pin-up photography style, retro sensual pose, studio beauty lighting, mature editorial glamour", gradient: ["#9f1239", "#fbbf24", "#1e3a8a"], icon: "sparkles" },
  { id: "nsfw_dark", cat: "nsfw", adminOnly: true, label: "Dark Sensual", labelEn: "Dark Sensual", desc: "Mood sombrio sensual", descEn: "Dark sensual mood", suffix: "dark sensual artistic photography, moody shadows, mysterious mature atmosphere, cinematic intimate drama", gradient: ["#0a0a0a", "#4c0519", "#7c3aed"], icon: "moon" },
  { id: "nsfw_fantasy", cat: "nsfw", adminOnly: true, label: "Fantasy Pin-up", labelEn: "Fantasy Pin-up", desc: "Fantasia mature ilustrada", descEn: "Mature fantasy illustration", suffix: "fantasy pin-up illustration, heroic mature fantasy character, stylized sensual fantasy art, digital painting", gradient: ["#312e81", "#ec4899", "#fbbf24"], icon: "star" },
];

export const ARTISTIC_EFFECT_SECTIONS = [
  {
    id: "lighting",
    title: "Iluminação",
    titleEn: "Lighting",
    type: "radio",
    icon: "light",
    options: [
      { id: "natural", label: "Luz Natural", labelEn: "Natural Light", prompt: "natural daylight illumination" },
      { id: "studio", label: "Luz de Estúdio", labelEn: "Studio Light", prompt: "professional studio lighting setup" },
      { id: "golden", label: "Luz Dourada (Golden Hour)", labelEn: "Golden Hour", prompt: "warm golden hour sunlight" },
      { id: "blue", label: "Luz Azul (Blue Hour)", labelEn: "Blue Hour", prompt: "cool blue hour ambient light" },
      { id: "backlit", label: "Contraluz", labelEn: "Backlight", prompt: "strong backlight rim glow" },
      { id: "rembrandt", label: "Rembrandt", labelEn: "Rembrandt", prompt: "Rembrandt triangle lighting on face" },
      { id: "split", label: "Split Lighting", labelEn: "Split Lighting", prompt: "dramatic split lighting half face in shadow" },
      { id: "butterfly", label: "Butterfly Lighting", labelEn: "Butterfly Lighting", prompt: "butterfly lighting from above" },
      { id: "rim", label: "Rim Light", labelEn: "Rim Light", prompt: "pronounced rim light edge separation" },
      { id: "silhouette", label: "Silhueta", labelEn: "Silhouette", prompt: "silhouette against bright background" },
    ],
  },
  {
    id: "lens",
    title: "Lente / Câmara",
    titleEn: "Lens / Camera",
    type: "radio",
    icon: "lens",
    options: [
      { id: "35mm", label: "35mm (ampla)", labelEn: "35mm (wide)", prompt: "shot on 35mm wide angle lens perspective" },
      { id: "50mm", label: "50mm (padrão)", labelEn: "50mm (standard)", prompt: "shot on 50mm standard lens natural perspective" },
      { id: "85mm", label: "85mm (retrato)", labelEn: "85mm (portrait)", prompt: "shot on 85mm portrait lens shallow depth" },
      { id: "135mm", label: "135mm (tele)", labelEn: "135mm (telephoto)", prompt: "shot on 135mm telephoto compressed perspective" },
      { id: "macro", label: "Macro", labelEn: "Macro", prompt: "macro lens extreme close-up detail" },
      { id: "fisheye", label: "Fisheye", labelEn: "Fisheye", prompt: "fisheye lens distortion" },
      { id: "tilt", label: "Tilt-Shift", labelEn: "Tilt-Shift", prompt: "tilt-shift miniature effect" },
      { id: "lensbaby", label: "Lensbaby", labelEn: "Lensbaby", prompt: "Lensbaby selective focus swirl" },
      { id: "polaroid", label: "Polaroid/Vintage", labelEn: "Polaroid/Vintage", prompt: "vintage Polaroid instant film look" },
      { id: "anamorphic", label: "Anamórfico", labelEn: "Anamorphic", prompt: "anamorphic cinematic lens flares and bokeh" },
    ],
  },
  {
    id: "atmosphere",
    title: "Atmosfera",
    titleEn: "Atmosphere",
    type: "checkbox",
    icon: "cloud",
    options: [
      { id: "mist_light", label: "Névoa/Leve", labelEn: "Light Mist", prompt: "light atmospheric mist" },
      { id: "fog_dense", label: "Neblina Densa", labelEn: "Dense Fog", prompt: "dense fog atmosphere" },
      { id: "rain", label: "Chuva", labelEn: "Rain", prompt: "rain droplets and wet surfaces" },
      { id: "snow", label: "Neve", labelEn: "Snow", prompt: "falling snow winter atmosphere" },
      { id: "dust", label: "Poeira/Partículas", labelEn: "Dust/Particles", prompt: "floating dust particles in light beams" },
      { id: "godrays", label: "Raios de Luz (God Rays)", labelEn: "God Rays", prompt: "volumetric god rays through atmosphere" },
      { id: "bokeh_circle", label: "Bokeh Circular", labelEn: "Circular Bokeh", prompt: "circular bokeh highlights in background" },
      { id: "bokeh_hex", label: "Bokeh Hexagonal", labelEn: "Hexagonal Bokeh", prompt: "hexagonal bokeh highlights" },
      { id: "vignette_soft", label: "Vignette Suave", labelEn: "Soft Vignette", prompt: "soft subtle vignette" },
      { id: "vignette_strong", label: "Vignette Forte", labelEn: "Strong Vignette", prompt: "strong dark vignette corners" },
      { id: "grain", label: "Film Grain", labelEn: "Film Grain", prompt: "authentic film grain texture" },
      { id: "leaks", label: "Light Leaks", labelEn: "Light Leaks", prompt: "analog light leak overlays" },
      { id: "ca", label: "Chromatic Aberration", labelEn: "Chromatic Aberration", prompt: "subtle chromatic aberration fringing" },
      { id: "flare", label: "Lens Flare", labelEn: "Lens Flare", prompt: "cinematic lens flare" },
    ],
  },
  {
    id: "color",
    title: "Cor / Mood",
    titleEn: "Color / Mood",
    type: "radio",
    icon: "palette",
    options: [
      { id: "warm", label: "Warm (quente)", labelEn: "Warm", prompt: "warm color grading" },
      { id: "cool", label: "Cool (frio)", labelEn: "Cool", prompt: "cool color grading" },
      { id: "desat", label: "Desaturado", labelEn: "Desaturated", prompt: "desaturated muted tones" },
      { id: "vibrant", label: "Saturado Vibrante", labelEn: "Vibrant Saturated", prompt: "highly saturated vibrant colors" },
      { id: "mono", label: "Monocromático", labelEn: "Monochrome", prompt: "monochromatic color scheme" },
      { id: "duotone", label: "Duotone", labelEn: "Duotone", prompt: "stylized duotone color treatment" },
      { id: "pastel_mood", label: "Pastel", labelEn: "Pastel", prompt: "soft pastel color mood" },
      { id: "neon_mood", label: "Neon", labelEn: "Neon", prompt: "neon saturated color mood" },
      { id: "sepia", label: "Sepia", labelEn: "Sepia", prompt: "sepia vintage tone" },
      { id: "teal_orange", label: "Teal/Orange Cinema", labelEn: "Teal/Orange Cinema", prompt: "teal and orange cinematic color grade" },
    ],
  },
];

export function filterArtisticCategories(categories, includeNsfw) {
  return categories.filter((c) => !c.adminOnly || includeNsfw);
}

export function filterArtisticStyles(styles, includeNsfw) {
  return styles.filter((s) => !s.adminOnly || includeNsfw);
}
