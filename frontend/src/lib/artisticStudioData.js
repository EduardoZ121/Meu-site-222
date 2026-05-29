/**
 * Estúdio Artístico — metadados UI (labels, categorias, gradientes).
 * Prompts ocultos: artisticStylePrompts.js + buildArtisticStudioPrompt.js
 * (campo suffix legado removido — não usar)
 */
import { isAdminUser } from "./isAdmin";

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
  { id: "nsfw", label: "AI Lab", labelEn: "AI Lab", labCategory: true },
];

export function canAccessNsfwArtisticStyles(user) {
  return isAdminUser(user);
}

export const ARTISTIC_STUDIO_STYLES = [
  // —— Fotografia ——
  { id: "photo_classic_portrait", cat: "photography", label: "Retrato Clássico", labelEn: "Classic Portrait", desc: "Iluminação suave, pele natural, fundo desfocado", descEn: "Soft light, natural skin, blurred background", gradient: ["#1a1a2e", "#4a5568", "#e2e8f0"], icon: "camera" },
  { id: "photo_editorial", cat: "photography", label: "Retrato Editorial", labelEn: "Editorial Portrait", desc: "Alto contraste, fashion, poses dramáticas", descEn: "High contrast, fashion, dramatic poses", gradient: ["#0f0f0f", "#7c3aed", "#f4f1ea"], icon: "sparkles" },
  { id: "photo_lifestyle", cat: "photography", label: "Lifestyle", labelEn: "Lifestyle", desc: "Natural, candid, luz do dia", descEn: "Natural, candid, daylight", gradient: ["#fef3c7", "#f59e0b", "#78350f"], icon: "sun" },
  { id: "photo_documentary", cat: "photography", label: "Documental", labelEn: "Documentary", desc: "Preto e branco granulado, momentos reais", descEn: "Grainy B&W, real moments", gradient: ["#171717", "#525252", "#a3a3a3"], icon: "aperture" },
  { id: "photo_fine_art", cat: "photography", label: "Fine Art", labelEn: "Fine Art", desc: "Composição pictórica, textura de tela", descEn: "Painterly composition, canvas texture", gradient: ["#292524", "#a8a29e", "#fafaf9"], icon: "frame" },
  { id: "photo_glamour", cat: "photography", label: "Glamour", labelEn: "Glamour", desc: "Iluminação de estúdio, pele perfeita, brilho", descEn: "Studio light, flawless skin, shine", gradient: ["#1e1b4b", "#c084fc", "#fdf4ff"], icon: "gem" },
  { id: "photo_street", cat: "photography", label: "Street", labelEn: "Street", desc: "Urbano, espontâneo, energia da cidade", descEn: "Urban, spontaneous, city energy", gradient: ["#1f2937", "#6b7280", "#fbbf24"], icon: "camera" },
  { id: "photo_fashion", cat: "photography", label: "Fashion Runway", labelEn: "Fashion Runway", desc: "Passarela, movimento, alta costura", descEn: "Runway, motion, haute couture", gradient: ["#000000", "#ffffff", "#dc2626"], icon: "sparkles" },
  { id: "photo_cinematic", cat: "photography", label: "Cinematográfico", labelEn: "Cinematic", desc: "Widescreen, grading de filme, drama", descEn: "Widescreen, film grading, drama", gradient: ["#0f172a", "#1e40af", "#f59e0b"], icon: "camera" },
  { id: "photo_noir", cat: "photography", label: "Film Noir", labelEn: "Film Noir", desc: "Sombras duras, mistério, preto e branco", descEn: "Hard shadows, mystery, monochrome", gradient: ["#0a0a0a", "#374151", "#d1d5db"], icon: "moon" },
  { id: "photo_hdr", cat: "photography", label: "HDR Premium", labelEn: "HDR Premium", desc: "Detalhe extremo, cores ricas, impacto", descEn: "Extreme detail, rich colors, impact", gradient: ["#064e3b", "#10b981", "#fef08a"], icon: "sun" },
  { id: "photo_casual", cat: "photography", label: "Casual Photo", labelEn: "Casual Photo", desc: "Estilo rede social, natural e acessível", descEn: "Social-style, natural and approachable", gradient: ["#f3f4f6", "#9ca3af", "#4b5563"], icon: "camera" },

  // —— Anime & Manga ——
  { id: "dig_anime", cat: "anime_manga", label: "Anime", labelEn: "Anime", desc: "Olhos grandes, linhas limpas, cores vibrantes", descEn: "Large eyes, clean lines, vibrant colors", gradient: ["#312e81", "#ec4899", "#67e8f9"], icon: "star" },
  { id: "anime_ghibli", cat: "anime_manga", label: "Studio Ghibli", labelEn: "Studio Ghibli", desc: "Suave, pastoral, Miyazaki", descEn: "Soft, pastoral, Miyazaki", gradient: ["#86efac", "#38bdf8", "#fef9c3"], icon: "cloud" },
  { id: "anime_manga_bw", cat: "anime_manga", label: "Manga P&B", labelEn: "B&W Manga", desc: "Tinta, screentone, painéis", descEn: "Ink, screentone, panels", gradient: ["#fafafa", "#525252", "#0a0a0a"], icon: "pencil" },
  { id: "anime_manhwa", cat: "anime_manga", label: "Manhwa", labelEn: "Manhwa", desc: "Webtoon coreano, cores digitais", descEn: "Korean webtoon, digital colors", gradient: ["#fce7f3", "#a78bfa", "#38bdf8"], icon: "star" },
  { id: "anime_chibi", cat: "anime_manga", label: "Chibi", labelEn: "Chibi", desc: "Super-deformado, kawaii", descEn: "Super-deformed, kawaii", gradient: ["#fbcfe8", "#f472b6", "#c084fc"], icon: "circle" },
  { id: "anime_shonen", cat: "anime_manga", label: "Shonen", labelEn: "Shonen", desc: "Ação, dinâmica, herói", descEn: "Action, dynamic, heroic", gradient: ["#dc2626", "#f97316", "#1d4ed8"], icon: "zap" },
  { id: "anime_soft", cat: "anime_manga", label: "Soft Anime", labelEn: "Soft Anime", desc: "Pastel, romântico, suave", descEn: "Pastel, romantic, soft", gradient: ["#fce7f3", "#ddd6fe", "#bfdbfe"], icon: "cloud" },
  { id: "anime_vintage", cat: "anime_manga", label: "Anime Vintage 80s", labelEn: "Vintage 80s Anime", desc: "Retro cel, VHS, nostalgia", descEn: "Retro cel, VHS, nostalgia", gradient: ["#7c2d12", "#ea580c", "#4338ca"], icon: "waves" },
  { id: "anime_webtoon", cat: "anime_manga", label: "Webtoon Color", labelEn: "Webtoon Color", desc: "Vertical scroll, cores vivas", descEn: "Vertical scroll, vivid colors", gradient: ["#22d3ee", "#a855f7", "#f472b6"], icon: "star" },
  { id: "anime_mecha", cat: "anime_manga", label: "Mecha", labelEn: "Mecha", desc: "Robôs, sci-fi anime, detalhe", descEn: "Robots, sci-fi anime, detail", gradient: ["#1e3a8a", "#64748b", "#ef4444"], icon: "shapes" },
  { id: "anime_vtuber", cat: "anime_manga", label: "VTuber", labelEn: "VTuber", desc: "Avatar live2D, brilho digital", descEn: "Live2D avatar, digital shine", gradient: ["#ec4899", "#8b5cf6", "#22d3ee"], icon: "gem" },

  // —— Cartoon & 3D ——
  { id: "toon_disney_2d", cat: "cartoon", label: "Disney 2D", labelEn: "Disney 2D", desc: "Animação clássica 2D", descEn: "Classic 2D animation", gradient: ["#1e40af", "#f472b6", "#fef08a"], icon: "star" },
  { id: "toon_disney_3d", cat: "cartoon", label: "Disney / Pixar 3D", labelEn: "Disney / Pixar 3D", desc: "3D fofo, render cinematográfico", descEn: "Cute 3D, cinematic render", gradient: ["#0ea5e9", "#f59e0b", "#f472b6"], icon: "gem" },
  { id: "toon_cartoon", cat: "cartoon", label: "Cartoon TV", labelEn: "TV Cartoon", desc: "Linhas bold, cores chapadas", descEn: "Bold lines, flat colors", gradient: ["#facc15", "#22c55e", "#3b82f6"], icon: "circle" },
  { id: "toon_pokemon_2d", cat: "cartoon", label: "Pokémon 2D", labelEn: "Pokémon 2D", desc: "Estilo jogo Nintendo 2D", descEn: "Nintendo 2D game style", gradient: ["#fbbf24", "#3b82f6", "#ef4444"], icon: "star" },
  { id: "toon_pokemon_3d", cat: "cartoon", label: "Pokémon 3D", labelEn: "Pokémon 3D", desc: "Render 3D Nintendo", descEn: "Nintendo 3D render", gradient: ["#fde047", "#2563eb", "#dc2626"], icon: "shapes" },
  { id: "toon_claymation", cat: "cartoon", label: "Claymation", labelEn: "Claymation", desc: "Stop-motion em barro", descEn: "Clay stop-motion", gradient: ["#a16207", "#ca8a04", "#fef3c7"], icon: "brush" },
  { id: "toon_cute_3d", cat: "cartoon", label: "Cute 3D Chibi", labelEn: "Cute 3D Chibi", desc: "Kawaii 3D, collectible", descEn: "Kawaii 3D, collectible", gradient: ["#fbcfe8", "#c4b5fd", "#67e8f9"], icon: "gem" },
  { id: "toon_figurine", cat: "cartoon", label: "Cute Figurine", labelEn: "Cute Figurine", desc: "Figura de coleção fotoreal", descEn: "Photoreal collectible figure", gradient: ["#f8fafc", "#cbd5e1", "#f472b6"], icon: "gem" },

  // —— Ilustração & Comic ——
  { id: "ill_comic", cat: "illustration", label: "Comic Book", labelEn: "Comic Book", desc: "HQ americana, cores bold", descEn: "American comics, bold colors", gradient: ["#dc2626", "#2563eb", "#facc15"], icon: "zap" },
  { id: "ill_graphic_novel", cat: "illustration", label: "Graphic Novel", labelEn: "Graphic Novel", desc: "Narrativa visual madura", descEn: "Mature visual storytelling", gradient: ["#1c1917", "#78716c", "#dc2626"], icon: "brush" },
  { id: "ill_tintin", cat: "illustration", label: "Ligne Claire", labelEn: "Ligne Claire", desc: "Tintin / Franco-Belga", descEn: "Tintin / Franco-Belgian", gradient: ["#38bdf8", "#fbbf24", "#ef4444"], icon: "lines" },
  { id: "ill_vector", cat: "illustration", label: "Vector Flat", labelEn: "Vector Flat", desc: "Ilustração vetorial limpa", descEn: "Clean vector illustration", gradient: ["#22c55e", "#3b82f6", "#f97316"], icon: "square" },
  { id: "ill_ink", cat: "illustration", label: "Ink Illustration", labelEn: "Ink Illustration", desc: "Tinta, hachura, editorial", descEn: "Ink, hatching, editorial", gradient: ["#fafaf9", "#525252", "#0a0a0a"], icon: "pencil" },
  { id: "ill_concept", cat: "illustration", label: "Concept Sketch", labelEn: "Concept Sketch", desc: "Rascunho profissional rápido", descEn: "Quick professional sketch", gradient: ["#374151", "#9ca3af", "#f59e0b"], icon: "pencil" },
  { id: "ill_tattoo", cat: "illustration", label: "Tattoo Flash", labelEn: "Tattoo Flash", desc: "Tinta, contornos bold", descEn: "Ink, bold outlines", gradient: ["#0a0a0a", "#f8fafc", "#dc2626"], icon: "lines" },
  { id: "ill_sticker", cat: "illustration", label: "Sticker / Emoji", labelEn: "Sticker / Emoji", desc: "Contorno branco, cute", descEn: "White outline, cute", gradient: ["#fef08a", "#f472b6", "#22d3ee"], icon: "circle" },
  { id: "ill_pop", cat: "illustration", label: "Pop Art Comic", labelEn: "Pop Art Comic", desc: "Warhol, halftone, saturação", descEn: "Warhol, halftone, saturation", gradient: ["#dc2626", "#2563eb", "#facc15"], icon: "circle" },

  // —— Digital & Sci-Fi ——
  { id: "dig_concept_art", cat: "digital", label: "Concept Art", labelEn: "Concept Art", desc: "Ambientes épicos, cinematográfico", descEn: "Epic environments, cinematic", gradient: ["#0c4a6e", "#0369a1", "#fbbf24"], icon: "mountain" },
  { id: "dig_pixel_art", cat: "digital", label: "Pixel Art", labelEn: "Pixel Art", desc: "Retro 8-bit/16-bit", descEn: "Retro 8-bit/16-bit", gradient: ["#14532d", "#22c55e", "#86efac"], icon: "grid" },
  { id: "dig_low_poly", cat: "digital", label: "Low Poly", labelEn: "Low Poly", desc: "Geométrico 3D minimalista", descEn: "Minimalist geometric 3D", gradient: ["#4c1d95", "#a78bfa", "#06b6d4"], icon: "shapes" },
  { id: "dig_vaporwave", cat: "digital", label: "Vaporwave", labelEn: "Vaporwave", desc: "Neon rosa/azul, glitch 80s", descEn: "Pink/cyan neon, 80s glitch", gradient: ["#ec4899", "#8b5cf6", "#06b6d4"], icon: "waves" },
  { id: "dig_cyberpunk", cat: "digital", label: "Cyberpunk", labelEn: "Cyberpunk", desc: "Neon, chuva, distopia", descEn: "Neon, rain, dystopia", gradient: ["#0f172a", "#7c3aed", "#22d3ee"], icon: "zap" },
  { id: "dig_synthwave", cat: "digital", label: "Synthwave", labelEn: "Synthwave", desc: "Pôr do sol retro, grid neon", descEn: "Retro sunset, neon grid", gradient: ["#581c87", "#ec4899", "#f97316"], icon: "waves" },
  { id: "dig_glitch", cat: "digital", label: "Glitch Art", labelEn: "Glitch Art", desc: "Distorção digital, RGB split", descEn: "Digital distortion, RGB split", gradient: ["#0f172a", "#22d3ee", "#f43f5e"], icon: "zap" },
  { id: "dig_holographic", cat: "digital", label: "Holographic", labelEn: "Holographic", desc: "Iridescente, futurista", descEn: "Iridescent, futuristic", gradient: ["#6366f1", "#22d3ee", "#f472b6"], icon: "sparkles" },
  { id: "dig_isometric", cat: "digital", label: "Isometric Icon", labelEn: "Isometric Icon", desc: "3D isométrico, app/game", descEn: "Isometric 3D, app/game", gradient: ["#38bdf8", "#a78bfa", "#34d399"], icon: "shapes" },
  { id: "dig_photoreal", cat: "digital", label: "Photoreal Digital", labelEn: "Photoreal Digital", desc: "Pintura digital ultra real", descEn: "Ultra-real digital painting", gradient: ["#1e293b", "#64748b", "#f1f5f9"], icon: "camera" },

  // —— Pintura Clássica ——
  { id: "cls_oil", cat: "classic", label: "Óleo", labelEn: "Oil Painting", desc: "Pinceladas visíveis, mestres", descEn: "Visible brushstrokes, old masters", gradient: ["#451a03", "#b45309", "#fde68a"], icon: "brush" },
  { id: "cls_watercolor", cat: "classic", label: "Aquarela", labelEn: "Watercolor", desc: "Fluido, transparente, suave", descEn: "Fluid, transparent, soft", gradient: ["#dbeafe", "#60a5fa", "#1d4ed8"], icon: "droplet" },
  { id: "cls_charcoal", cat: "classic", label: "Carvão", labelEn: "Charcoal", desc: "P&B, textura áspera", descEn: "B&W, rough texture", gradient: ["#0a0a0a", "#404040", "#d4d4d4"], icon: "pencil" },
  { id: "cls_pastel", cat: "classic", label: "Pastel", labelEn: "Pastel", desc: "Cores em pó, sonho", descEn: "Powder colors, dreamy", gradient: ["#fce7f3", "#f9a8d4", "#c4b5fd"], icon: "cloud" },
  { id: "cls_engraving", cat: "classic", label: "Gravura", labelEn: "Engraving", desc: "Linhas finas, técnica antiga", descEn: "Fine lines, antique technique", gradient: ["#fafaf9", "#78716c", "#1c1917"], icon: "lines" },
  { id: "cls_mosaic", cat: "classic", label: "Mosaico", labelEn: "Mosaic", desc: "Azulejos, bizantino", descEn: "Tiles, Byzantine", gradient: ["#1e3a8a", "#eab308", "#dc2626"], icon: "tiles" },
  { id: "cls_acrylic", cat: "classic", label: "Acrílico", labelEn: "Acrylic", desc: "Cores vivas, textura moderna", descEn: "Vivid colors, modern texture", gradient: ["#f97316", "#eab308", "#22c55e"], icon: "brush" },
  { id: "cls_gouache", cat: "classic", label: "Gouache", labelEn: "Gouache", desc: "Opaco, ilustração editorial", descEn: "Opaque, editorial illustration", gradient: ["#fef08a", "#86efac", "#38bdf8"], icon: "brush" },
  { id: "cls_ukiyoe", cat: "classic", label: "Ukiyo-e", labelEn: "Ukiyo-e", desc: "Gravura japonesa tradicional", descEn: "Traditional Japanese woodblock", gradient: ["#1e3a8a", "#f8fafc", "#dc2626"], icon: "frame" },
  { id: "cls_nihonga", cat: "classic", label: "Nihonga", labelEn: "Nihonga", desc: "Pintura japonesa clássica", descEn: "Classical Japanese painting", gradient: ["#fef3c7", "#fca5a5", "#1e40af"], icon: "frame" },

  // —— Design Moderno ——
  { id: "mod_minimal", cat: "modern", label: "Minimalista", labelEn: "Minimalist", desc: "Linhas limpas, espaço negativo", descEn: "Clean lines, negative space", gradient: ["#f8fafc", "#94a3b8", "#0f172a"], icon: "minus" },
  { id: "mod_flat", cat: "modern", label: "Flat Design", labelEn: "Flat Design", desc: "Cores sólidas, 2D UI", descEn: "Solid colors, 2D UI", gradient: ["#ef4444", "#3b82f6", "#22c55e"], icon: "square" },
  { id: "mod_brutalist", cat: "modern", label: "Brutalismo", labelEn: "Brutalism", desc: "Tipografia áspera, anti-design", descEn: "Harsh type, anti-design", gradient: ["#000000", "#facc15", "#ffffff"], icon: "type" },
  { id: "mod_art_deco", cat: "modern", label: "Art Déco", labelEn: "Art Deco", desc: "Geométrico, dourado, anos 20", descEn: "Geometric, gold, 1920s", gradient: ["#0f0f0f", "#ca8a04", "#fef9c3"], icon: "diamond" },
  { id: "mod_pop_art", cat: "modern", label: "Pop Art", labelEn: "Pop Art", desc: "Warhol, Ben-Day dots", descEn: "Warhol, Ben-Day dots", gradient: ["#dc2626", "#2563eb", "#facc15"], icon: "circle" },
  { id: "mod_surreal", cat: "modern", label: "Surrealismo", labelEn: "Surrealism", desc: "Sonho, objetos impossíveis", descEn: "Dream, impossible objects", gradient: ["#1e1b4b", "#f97316", "#a5f3fc"], icon: "moon" },
  { id: "mod_art_nouveau", cat: "modern", label: "Art Nouveau", labelEn: "Art Nouveau", desc: "Linhas orgânicas decorativas", descEn: "Organic decorative lines", gradient: ["#065f46", "#a16207", "#fef3c7"], icon: "diamond" },
  { id: "mod_y2k", cat: "modern", label: "Y2K Aesthetic", labelEn: "Y2K Aesthetic", desc: "Chrome, bubble, anos 2000", descEn: "Chrome, bubbles, 2000s", gradient: ["#c084fc", "#67e8f9", "#f9a8d4"], icon: "sparkles" },

  // —— Fantasia & Épico ——
  { id: "fan_epic", cat: "fantasy", label: "Epic Fantasy", labelEn: "Epic Fantasy", desc: "Pintura épica, magia", descEn: "Epic painting, magic", gradient: ["#1e3a8a", "#7c3aed", "#fbbf24"], icon: "mountain" },
  { id: "fan_dark", cat: "fantasy", label: "Dark Fantasy", labelEn: "Dark Fantasy", desc: "Sombrio, gótico, moody", descEn: "Dark, gothic, moody", gradient: ["#0a0a0a", "#4c1d95", "#7f1d1d"], icon: "moon" },
  { id: "fan_steampunk", cat: "fantasy", label: "Steampunk", labelEn: "Steampunk", desc: "Vitoriano, engrenagens, brass", descEn: "Victorian, gears, brass", gradient: ["#78350f", "#ca8a04", "#57534e"], icon: "shapes" },
  { id: "fan_dnd", cat: "fantasy", label: "D&D Character", labelEn: "D&D Character", desc: "RPG tabletop, ficha de personagem", descEn: "Tabletop RPG character", gradient: ["#7f1d1d", "#a16207", "#1e40af"], icon: "star" },
  { id: "fan_space", cat: "fantasy", label: "Space Opera", labelEn: "Space Opera", desc: "Sci-fi épico, naves, nebulosas", descEn: "Epic sci-fi, ships, nebulae", gradient: ["#0f172a", "#6366f1", "#22d3ee"], icon: "mountain" },
  { id: "fan_ethereal", cat: "fantasy", label: "Ethereal Fantasy", labelEn: "Ethereal Fantasy", desc: "Luz suave, fadas, sonho", descEn: "Soft light, fairies, dream", gradient: ["#ddd6fe", "#a5f3fc", "#fce7f3"], icon: "cloud" },
  { id: "fan_gothic", cat: "fantasy", label: "Gothic", labelEn: "Gothic", desc: "Arquitetura gótica, sombras", descEn: "Gothic architecture, shadows", gradient: ["#0a0a0a", "#312e81", "#991b1b"], icon: "moon" },
  { id: "fan_neon", cat: "fantasy", label: "Neon Glow", labelEn: "Neon Glow", desc: "Bordas luminosas, fundo escuro", descEn: "Glowing edges, dark background", gradient: ["#0f172a", "#d946ef", "#22d3ee"], icon: "zap" },

  // —— Vintage & Retro ——
  { id: "vin_pulp", cat: "vintage", label: "Pulp Art", labelEn: "Pulp Art", desc: "Capa retro, cores saturadas", descEn: "Retro cover, saturated colors", gradient: ["#dc2626", "#fbbf24", "#1e3a8a"], icon: "frame" },
  { id: "vin_pinup_art", cat: "vintage", label: "Pin-up Vintage", labelEn: "Vintage Pin-up", desc: "Ilustração retro glam (SFW)", descEn: "Retro glam illustration (SFW)", gradient: ["#be123c", "#fbbf24", "#1e3a8a"], icon: "sparkles" },
  { id: "vin_1920s", cat: "vintage", label: "Anos 1920", labelEn: "1920s Photo", desc: "Sépia, art déco, charleston", descEn: "Sepia, art deco, Charleston", gradient: ["#78716c", "#d6d3d1", "#1c1917"], icon: "camera" },
  { id: "vin_1990s", cat: "vintage", label: "Anos 90 Photo", labelEn: "1990s Photo", desc: "Flash direto, cores datadas", descEn: "Direct flash, dated colors", gradient: ["#f472b6", "#38bdf8", "#facc15"], icon: "camera" },
  { id: "vin_vhs", cat: "vintage", label: "VHS / Camcorder", labelEn: "VHS / Camcorder", desc: "Scanlines, data, noise", descEn: "Scanlines, date stamp, noise", gradient: ["#1f2937", "#6b7280", "#f43f5e"], icon: "waves" },
  { id: "vin_polaroid", cat: "vintage", label: "Polaroid", labelEn: "Polaroid", desc: "Instantâneo, bordas, nostalgia", descEn: "Instant film, borders, nostalgia", gradient: ["#fef3c7", "#d6d3d1", "#78716c"], icon: "camera" },
  { id: "vin_film_grain", cat: "vintage", label: "Film Grain Analog", labelEn: "Analog Film Grain", desc: "Grão de filme, analógico", descEn: "Film grain, analog look", gradient: ["#422006", "#a8a29e", "#ecfccb"], icon: "aperture" },
  { id: "vin_retro_comic", cat: "vintage", label: "Vintage Comic", labelEn: "Vintage Comic", desc: "HQ antiga, papel amarelado", descEn: "Old comic, yellowed paper", gradient: ["#fef08a", "#f97316", "#1d4ed8"], icon: "lines" },

  // —— AI Lab experimental (admin only) — presets edit rápido / Qwen-style ——
  { id: "lab_qwen_edit", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "QWEN", label: "Qwen Edit Rapid", labelEn: "Qwen Edit Rapid", desc: "Edição rápida IA, identidade preservada", descEn: "Rapid AI edit, identity preserved", gradient: ["#0c0a1f", "#6366f1", "#22d3ee"], icon: "zap" },
  { id: "lab_ai_rapid", cat: "nsfw", adminOnly: true, labPreset: true, textEngine: "flux", editEngine: "kontext", labBadge: "RAPID", label: "AI Rapid", labelEn: "AI Rapid", desc: "Preset ultra-rápido, look cinematográfico", descEn: "Ultra-fast preset, cinematic look", gradient: ["#1e1b4b", "#ec4899", "#f97316"], icon: "zap" },
  { id: "lab_cinematic_edit", cat: "nsfw", adminOnly: true, labPreset: true, textEngine: "flux", editEngine: "kontext", labBadge: "CINE", label: "Cinematic Edit", labelEn: "Cinematic Edit", desc: "Edição moody, luz de filme, drama", descEn: "Moody film lighting, drama", gradient: ["#0f172a", "#7c3aed", "#f59e0b"], icon: "camera" },
  { id: "lab_advanced_prompt", cat: "nsfw", adminOnly: true, labPreset: true, textEngine: "flux", editEngine: "kontext", labBadge: "PROMPT", label: "Advanced Prompt Edit", labelEn: "Advanced Prompt Edit", desc: "Segue prompt complexo com precisão", descEn: "Follows complex prompts precisely", gradient: ["#312e81", "#a855f7", "#38bdf8"], icon: "sparkles" },
  { id: "lab_experimental_ai", cat: "nsfw", adminOnly: true, labPreset: true, textEngine: "flux", editEngine: "kontext", labBadge: "EXP", label: "Experimental AI", labelEn: "Experimental AI", desc: "Look laboratório, cores neon suaves", descEn: "Lab look, soft neon colors", gradient: ["#4c0519", "#db2777", "#67e8f9"], icon: "sparkles" },
  { id: "lab_ultra_style", cat: "nsfw", adminOnly: true, labPreset: true, textEngine: "flux", editEngine: "kontext", labBadge: "ULTRA", label: "Ultra Style", labelEn: "Ultra Style", desc: "Máximo detalhe e nitidez premium", descEn: "Maximum detail and premium sharpness", gradient: ["#0a0a0a", "#52525b", "#fafafa"], icon: "gem" },
  { id: "lab_flux_edit", cat: "nsfw", adminOnly: true, labPreset: true, textEngine: "flux", editEngine: "kontext", labBadge: "FLUX", label: "Flux Edit", labelEn: "Flux Edit", desc: "Estética Flux — cores ricas e fluidez", descEn: "Flux aesthetic — rich colors and flow", gradient: ["#172554", "#7c3aed", "#f472b6"], icon: "waves" },
  { id: "lab_realistic_edit", cat: "nsfw", adminOnly: true, labPreset: true, textEngine: "flux", editEngine: "kontext", labBadge: "REAL", label: "Realistic Edit", labelEn: "Realistic Edit", desc: "Fotorrealismo extremo pós-edição", descEn: "Extreme photorealism after edit", gradient: ["#1c1917", "#78716c", "#fde68a"], icon: "camera" },
  { id: "lab_hybrid_nsfw", cat: "nsfw", adminOnly: true, labPreset: true, labBadge: "AIO", label: "Rapid AIO Blend", labelEn: "Rapid AIO Blend", desc: "Preset all-in-one estilo HF rapid", descEn: "All-in-one rapid HF-style preset", gradient: ["#831843", "#9333ea", "#06b6d4"], icon: "zap" },
  // —— AI Lab leve (texto ou foto) ——
  { id: "nsfw_swimwear", cat: "nsfw", adminOnly: true, tier: "light", textEngine: "flux", editEngine: "kontext", label: "Bikini Editorial", labelEn: "Swimwear Editorial", desc: "Praia, bikini, moda swim — segue o teu prompt", descEn: "Beach, bikini, swim fashion — follows your prompt", gradient: ["#0ea5e9", "#f472b6", "#fef08a"], icon: "sun" },
  { id: "nsfw_beach", cat: "nsfw", adminOnly: true, tier: "light", textEngine: "flux", editEngine: "kontext", label: "Beach Lifestyle", labelEn: "Beach Lifestyle", desc: "Areia, ondas, golden hour na praia", descEn: "Sand, waves, beach golden hour", gradient: ["#fbbf24", "#38bdf8", "#fef3c7"], icon: "sun" },
  { id: "nsfw_lingerie_soft", cat: "nsfw", adminOnly: true, tier: "light", textEngine: "flux", editEngine: "kontext", label: "Lingerie Soft", labelEn: "Soft Lingerie", desc: "Renda suave, luz romântica, editorial", descEn: "Soft lace, romantic light, editorial", gradient: ["#fce7f3", "#f9a8d4", "#831843"], icon: "gem" },
  { id: "nsfw_fitness_glam", cat: "nsfw", adminOnly: true, tier: "light", textEngine: "flux", editEngine: "kontext", label: "Fitness Glam", labelEn: "Fitness Glam", desc: "Sporty, corpo atlético, activewear", descEn: "Sporty, athletic body, activewear", gradient: ["#dc2626", "#1e293b", "#f97316"], icon: "zap" },
  { id: "nsfw_boudoir", cat: "nsfw", adminOnly: true, tier: "light", textEngine: "flux", editEngine: "kontext", label: "Boudoir", labelEn: "Boudoir", desc: "Retrato íntimo artístico", descEn: "Artistic intimate portrait", gradient: ["#1e1b4b", "#be185d", "#fce7f3"], icon: "gem" },
  { id: "nsfw_pinup", cat: "nsfw", adminOnly: true, tier: "light", textEngine: "flux", editEngine: "kontext", label: "Pin-up Glam", labelEn: "Pin-up Glam", desc: "Glamour retro sensual", descEn: "Sensual retro glam", gradient: ["#9f1239", "#fbbf24", "#1e3a8a"], icon: "sparkles" },
  { id: "nsfw_dark", cat: "nsfw", adminOnly: true, tier: "light", textEngine: "flux", editEngine: "kontext", label: "Dark Sensual", labelEn: "Dark Sensual", desc: "Mood sombrio sensual", descEn: "Dark sensual mood", gradient: ["#0a0a0a", "#4c0519", "#7c3aed"], icon: "moon" },
  { id: "nsfw_fantasy", cat: "nsfw", adminOnly: true, tier: "light", textEngine: "flux", editEngine: "kontext", label: "Fantasy Pin-up", labelEn: "Fantasy Pin-up", desc: "Fantasia mature ilustrada", descEn: "Mature fantasy illustration", gradient: ["#312e81", "#ec4899", "#fbbf24"], icon: "star" },
  // —— AI Lab pesado (admin) ——
  { id: "nsfw_sheer", cat: "nsfw", adminOnly: true, tier: "heavy", textEngine: "flux", editEngine: "kontext", label: "Sheer Editorial", labelEn: "Sheer Editorial", desc: "Tecidos transparentes, luz dramática", descEn: "Sheer fabrics, dramatic light", gradient: ["#1e1b4b", "#a855f7", "#fdf4ff"], icon: "sparkles" },
  { id: "nsfw_figure_study", cat: "nsfw", adminOnly: true, tier: "heavy", textEngine: "flux", editEngine: "kontext", label: "Figure Study", labelEn: "Figure Study", desc: "Nu artístico clássico, estudo de luz", descEn: "Classical artistic nude, light study", gradient: ["#292524", "#78716c", "#fef3c7"], icon: "frame" },
  { id: "nsfw_explicit_art", cat: "nsfw", adminOnly: true, tier: "heavy", textEngine: "flux", editEngine: "kontext", label: "Explicit Art", labelEn: "Explicit Art", desc: "Arte adulta explícita controlada", descEn: "Controlled explicit adult art", gradient: ["#450a0a", "#be123c", "#0a0a0a"], icon: "gem" },
  { id: "nsfw_intimate_couple", cat: "nsfw", adminOnly: true, tier: "heavy", label: "Intimate Couple", labelEn: "Intimate Couple", desc: "Casal íntimo, mood cinematográfico", descEn: "Intimate couple, cinematic mood", gradient: ["#4c0519", "#7c2d12", "#fbbf24"], icon: "sparkles" },
  { id: "nsfw_cosplay", cat: "nsfw", adminOnly: true, tier: "light", label: "Cosplay Mature", labelEn: "Mature Cosplay", desc: "Personagem sensual, fantasia", descEn: "Sensual character cosplay", gradient: ["#312e81", "#ec4899", "#22d3ee"], icon: "star" },
  { id: "nsfw_wet_look", cat: "nsfw", adminOnly: true, tier: "light", label: "Wet Look", labelEn: "Wet Look", desc: "Pele molhada, shower ou piscina", descEn: "Wet skin, shower or pool", gradient: ["#0c4a6e", "#38bdf8", "#1e293b"], icon: "droplet" },
  { id: "nsfw_stockings", cat: "nsfw", adminOnly: true, tier: "light", label: "Stockings & Heels", labelEn: "Stockings & Heels", desc: "Meias, ligas, salto alto", descEn: "Stockings, garters, heels", gradient: ["#1e1b4b", "#f472b6", "#0a0a0a"], icon: "gem" },
  { id: "nsfw_oil_body", cat: "nsfw", adminOnly: true, tier: "heavy", label: "Oil & Gloss Body", labelEn: "Oil & Gloss Body", desc: "Óleo na pele, brilho corporal", descEn: "Oiled glossy skin", gradient: ["#422006", "#fbbf24", "#1c1917"], icon: "sun" },
  {
    id: "nsfw_oil_render",
    cat: "nsfw",
    adminOnly: true,
    tier: "heavy",
    labBadge: "OIL",
    label: "Oil 3D Masterpiece",
    labelEn: "Oil 3D Masterpiece",
    desc: "Pele óleo ultra detalhada, render 3D cinematográfico",
    descEn: "Ultra detailed oily skin, cinematic 3D render",
    gradient: ["#422006", "#fbbf24", "#78716c"],
    icon: "gem",
  },
  { id: "nsfw_explicit_pose", cat: "nsfw", adminOnly: true, tier: "heavy", label: "Explicit Pose", labelEn: "Explicit Pose", desc: "Pose adulta explícita — segue prompt", descEn: "Explicit adult pose — follows prompt", gradient: ["#450a0a", "#1e1b4b", "#f43f5e"], icon: "camera" },
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
      { id: "rembrandt", label: "Rembrandt", labelEn: "Rembrandt", prompt: "Rembrandt lighting on scene, soft shadows without aging the face" },
      { id: "split", label: "Split Lighting", labelEn: "Split Lighting", prompt: "dramatic split lighting on scene, do not add wrinkles" },
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
      { id: "macro", label: "Macro", labelEn: "Macro", prompt: "macro detail on background props only" },
      { id: "fisheye", label: "Fisheye", labelEn: "Fisheye", prompt: "fisheye lens distortion" },
      { id: "tilt", label: "Tilt-Shift", labelEn: "Tilt-Shift", prompt: "tilt-shift miniature effect" },
      { id: "lensbaby", label: "Lensbaby", labelEn: "Lensbaby", prompt: "Lensbaby selective focus swirl" },
      { id: "polaroid", label: "Polaroid/Vintage", labelEn: "Polaroid/Vintage", prompt: "Polaroid color grade on scene edges only" },
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
      { id: "grain", label: "Film Grain", labelEn: "Film Grain", prompt: "film grain on image grade only, not on face aging" },
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
      { id: "sepia", label: "Sepia", labelEn: "Sepia", prompt: "sepia color grade only, same subject age as reference" },
      { id: "teal_orange", label: "Teal/Orange Cinema", labelEn: "Teal/Orange Cinema", prompt: "teal and orange cinematic color grade" },
    ],
  },
];

export function filterArtisticCategories(categories, includeNsfw) {
  return categories.filter((c) => {
    if (c.id === "nsfw" || c.labCategory) return includeNsfw;
    return !c.adminOnly || includeNsfw;
  });
}

export function filterArtisticStyles(styles, includeNsfw) {
  return styles.filter((s) => !s.adminOnly || includeNsfw);
}

export function isPhotographyStyleId(styleId) {
  return String(styleId || "").trim().startsWith("photo_");
}
