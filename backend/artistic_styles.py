"""Curated artistic style catalogue — 50 styles across 8 categories.
Each entry: id, label, cat, suffix (prompt fragment).
"""

ARTISTIC_STYLES = [
    # ─── Anime & Manga ─────────────────────────────────────────────
    {"id": "anime",            "label": "Anime",                "cat": "anime", "suffix": "transform into vibrant anime art, cel-shading, dynamic line work, expressive eyes"},
    {"id": "drawn_anime",      "label": "Drawn Anime",          "cat": "anime", "suffix": "hand-drawn anime sketch, pencil-like inking, painterly anime style"},
    {"id": "manga",            "label": "Manga",                "cat": "anime", "suffix": "japanese manga panel, screentones, ink hatching, dramatic motion lines"},
    {"id": "ghibli",           "label": "Studio Ghibli",        "cat": "anime", "suffix": "Studio Ghibli watercolor, soft pastel palette, lush atmosphere, Miyazaki style"},
    {"id": "waifu",            "label": "Waifu",                "cat": "anime", "suffix": "kawaii waifu illustration, soft shading, big expressive eyes, anime girl art"},
    {"id": "vintage_anime",    "label": "Vintage Anime",        "cat": "anime", "suffix": "1980s 1990s vintage anime cel, retro animation, grainy film texture"},
    {"id": "neon_vintage_anime","label": "Neon Vintage Anime",  "cat": "anime", "suffix": "1990s neon vintage anime aesthetic, magenta cyan, retro shading"},
    {"id": "anime_50s_info",   "label": "50s Infomercial Anime","cat": "anime", "suffix": "1950s infomercial cartoon-anime hybrid, halftone print, vintage broadcast"},

    # ─── Realism & Photo ───────────────────────────────────────────
    {"id": "realistic",        "label": "Photorealism",         "cat": "real", "suffix": "ultra-photorealistic 8k photograph, professional studio lighting, sharp focus"},
    {"id": "pro_photo",        "label": "Professional Photo",   "cat": "real", "suffix": "professional photography, editorial composition, perfect lighting"},
    {"id": "cinematic_photo",  "label": "Cinematic Photo",      "cat": "real", "suffix": "cinematic film photo, anamorphic lens, color graded like a movie still"},
    {"id": "1920s_photo",      "label": "1920s Photo",          "cat": "real", "suffix": "1920s sepia photograph, vintage film grain, antique camera quality"},
    {"id": "polaroid",         "label": "Polaroid",             "cat": "real", "suffix": "Polaroid instant photograph, soft flash, square crop, faded colors"},
    {"id": "render_3d",        "label": "3D Render",            "cat": "real", "suffix": "high-end 3D render, octane / unreal engine quality, cinematic light"},

    # ─── Traditional Painting ──────────────────────────────────────
    {"id": "oil_paint",        "label": "Oil Painting",         "cat": "paint", "suffix": "classical oil painting, visible brush strokes, rich impasto, museum quality"},
    {"id": "oil_realism",      "label": "Oil Painting - Realism","cat": "paint", "suffix": "photorealistic oil painting, fine detail, masterful brushwork, gallery piece"},
    {"id": "oil_old",          "label": "Oil Painting - Old",   "cat": "paint", "suffix": "antique oil painting, aged varnish, dark earth tones, 17th century style"},
    {"id": "watercolor",       "label": "Watercolor",           "cat": "paint", "suffix": "loose watercolor painting, soft bleeds, expressive paper texture"},
    {"id": "ink_wash",         "label": "Ink Wash (Sumi-e)",    "cat": "paint", "suffix": "asian sumi-e ink wash painting, expressive brush strokes, refined minimalism"},
    {"id": "nihonga",          "label": "Nihonga Painting",     "cat": "paint", "suffix": "Japanese Nihonga painting, mineral pigments, gold leaf, refined elegance"},
    {"id": "ukiyoe",           "label": "Ukiyo-e",              "cat": "paint", "suffix": "japanese ukiyo-e woodblock print, flat color planes, refined linework"},
    {"id": "renaissance",      "label": "Renaissance",          "cat": "paint", "suffix": "renaissance oil painting, chiaroscuro lighting, baroque drapery, Vermeer style"},
    {"id": "painterly",        "label": "Painterly",            "cat": "paint", "suffix": "painterly digital art, expressive impasto strokes, gallery quality"},
    {"id": "splatter",         "label": "Splatter",             "cat": "paint", "suffix": "abstract paint splatter art, vibrant chromatic explosions, expressive"},

    # ─── Cartoon & Disney ──────────────────────────────────────────
    {"id": "disney_2d",        "label": "Disney 2D",            "cat": "cartoon", "suffix": "classic Disney 2D animation, expressive eyes, polished line art, family-friendly"},
    {"id": "disney_3d",        "label": "Disney / Pixar 3D",    "cat": "cartoon", "suffix": "Disney Pixar 3D animation, charming character design, soft cinematic lighting"},
    {"id": "disney_sketch",    "label": "Disney Sketch",        "cat": "cartoon", "suffix": "Disney concept sketch, loose pencil lines, animation studio rough"},
    {"id": "cartoon",          "label": "Modern Cartoon",       "cat": "cartoon", "suffix": "modern cartoon style, bold flat colors, simplified shapes, vector look"},
    {"id": "cute_3d",          "label": "Cute Chibi 3D",        "cat": "cartoon", "suffix": "cute chibi 3D character, kawaii style, soft toy aesthetic"},
    {"id": "claymation",       "label": "Claymation",           "cat": "cartoon", "suffix": "claymation stop-motion character, hand-sculpted texture, soft lighting"},
    {"id": "pokemon_3d",       "label": "3D Pokemon",           "cat": "cartoon", "suffix": "3D Pokemon trading card render, glossy plastic toy aesthetic"},

    # ─── Comic & Illustration ──────────────────────────────────────
    {"id": "comic",            "label": "Comic Book",           "cat": "comic", "suffix": "American comic book art, halftone shading, bold ink lines, dynamic composition"},
    {"id": "vintage_comic",    "label": "Vintage Comic",        "cat": "comic", "suffix": "1960s vintage comic book, faded inks, dot screen printing, retro action"},
    {"id": "franco_belge",     "label": "Franco-Belgian Comic", "cat": "comic", "suffix": "franco-belgian comic style, Tintin / Asterix line art, clear ligne claire"},
    {"id": "tintin",           "label": "Tintin Style",         "cat": "comic", "suffix": "Hergé Tintin style, ligne claire, flat colors, classic European comic"},
    {"id": "mtg_card",         "label": "MTG Card Art",         "cat": "comic", "suffix": "Magic the Gathering card illustration, fantasy painted style, dramatic"},
    {"id": "concept_sketch",   "label": "Concept Sketch",       "cat": "comic", "suffix": "professional concept sketch, loose construction lines, design exploration"},
    {"id": "sketch",           "label": "Pencil Sketch",        "cat": "comic", "suffix": "expressive graphite pencil sketch on paper, dynamic shading, hand drawn"},
    {"id": "crayon",           "label": "Crayon Drawing",       "cat": "comic", "suffix": "crayon drawing on paper, childlike texture, waxy stroke, playful"},
    {"id": "tattoo",           "label": "Tattoo Design",        "cat": "comic", "suffix": "neo-traditional tattoo design, bold black outlines, vibrant ink fills"},

    # ─── Fantasy & Sci-Fi ──────────────────────────────────────────
    {"id": "fantasy_landscape","label": "Fantasy Landscape",    "cat": "fantasy", "suffix": "epic fantasy landscape, dramatic vista, painterly atmosphere"},
    {"id": "fantasy_portrait", "label": "Fantasy Portrait",     "cat": "fantasy", "suffix": "fantasy character portrait, ornate costume, ethereal lighting"},
    {"id": "concept_art",      "label": "Concept Art",          "cat": "fantasy", "suffix": "professional game concept art, atmospheric perspective, painterly detail"},
    {"id": "medieval",         "label": "Medieval Illumination","cat": "fantasy", "suffix": "medieval illuminated manuscript, gold leaf, intricate borders"},
    {"id": "cyberpunk",        "label": "Cyberpunk",            "cat": "fantasy", "suffix": "cyberpunk neon city aesthetic, holographic reflections, blade runner feel"},
    {"id": "retrowave",        "label": "Retrowave / Synthwave","cat": "fantasy", "suffix": "1980s retrowave synthwave, magenta and cyan neon, sun grid horizon"},
    {"id": "steampunk",        "label": "Steampunk",            "cat": "fantasy", "suffix": "steampunk victorian aesthetic, brass mechanics, intricate gears, sepia tone"},
    {"id": "pixel_art",        "label": "Pixel Art",            "cat": "fantasy", "suffix": "16-bit pixel art game character, limited palette, sharp pixels"},
    {"id": "low_poly",         "label": "Low Poly",             "cat": "fantasy", "suffix": "low-poly geometric art, faceted color planes, simple gradient"},

    # ─── Vintage & Retro ───────────────────────────────────────────
    {"id": "vintage_photo",    "label": "Vintage Film Photo",   "cat": "vintage", "suffix": "1970s vintage film photograph, faded colors, light leaks, nostalgic"},
    {"id": "vintage_pulp",     "label": "Vintage Pulp Art",     "cat": "vintage", "suffix": "1950s pulp novel cover art, dramatic lighting, painted illustration"},
    {"id": "enamel_50s",       "label": "50s Enamel Sign",      "cat": "vintage", "suffix": "1950s enamel advertising sign, glossy enamel paint, retro typography"},
    {"id": "pop_art",          "label": "Pop Art",              "cat": "vintage", "suffix": "Warhol pop art, halftone dots, bold flat primary colors"},
    {"id": "art_nouveau",      "label": "Art Nouveau",          "cat": "vintage", "suffix": "art nouveau ornate style, Mucha-inspired flowing lines, decorative motifs"},
    {"id": "film_noir",        "label": "Film Noir",            "cat": "vintage", "suffix": "1940s film noir, hard shadows, smoky atmosphere, monochrome grade"},
    {"id": "gothic",           "label": "Gothic",               "cat": "vintage", "suffix": "gothic dark art, moody atmosphere, baroque ornament, candlelight"},
    {"id": "cursed",           "label": "Cursed Photo",         "cat": "vintage", "suffix": "cursed surreal lo-fi photo, uncanny atmosphere, unsettling aesthetic"},

    # ─── Other / Experimental ─────────────────────────────────────
    {"id": "digital_art",      "label": "Digital Art",          "cat": "other", "suffix": "premium digital painting, artstation top trending, finely rendered"},
    {"id": "minimalist",       "label": "Minimalist",           "cat": "other", "suffix": "minimalist line art, single color accent, abundant white space"},
    {"id": "furry_oil",        "label": "Furry - Oil",          "cat": "other", "suffix": "anthropomorphic character oil painting, detailed fur, painterly"},
    {"id": "furry_cinematic",  "label": "Furry - Cinematic",    "cat": "other", "suffix": "anthropomorphic character cinematic still, dramatic light"},
    {"id": "yugioh",           "label": "YuGiOh Card Art",      "cat": "other", "suffix": "Yu-Gi-Oh trading card illustration, holographic foil, dramatic pose"},
]

CATEGORIES = {
    "anime":   "Anime & Manga",
    "real":    "Realismo & Foto",
    "paint":   "Pintura Tradicional",
    "cartoon": "Cartoon & Disney",
    "comic":   "Comic & Ilustração",
    "fantasy": "Fantasy & Sci-Fi",
    "vintage": "Vintage & Retro",
    "other":   "Outros",
}


def get_artistic(style_id: str):
    for s in ARTISTIC_STYLES:
        if s["id"] == style_id:
            return s
    return None
