"""33 Artistic styles (Flux 2 Klein)."""

ARTISTIC_STYLES = [
    {"id": "anime",        "label": "Anime",        "suffix": "transform into vibrant anime cover art, cel-shading, dynamic line work"},
    {"id": "ghibli",       "label": "Ghibli",       "suffix": "Studio Ghibli watercolor, soft pastel palette, lush atmosphere"},
    {"id": "disney_2d",    "label": "Disney 2D",    "suffix": "classic Disney 2D animation, expressive eyes, polished line art"},
    {"id": "disney_3d",    "label": "Disney 3D",    "suffix": "Disney Pixar 3D animation, charming character design, soft cinematic lighting"},
    {"id": "cartoon",      "label": "Cartoon",      "suffix": "modern cartoon style, bold flat colors, simplified shapes"},
    {"id": "comic",        "label": "Comic Book",   "suffix": "American comic book art, halftone shading, bold ink lines, dynamic composition"},
    {"id": "manga",        "label": "Manga",        "suffix": "japanese manga panel, screentones, ink hatching, expressive eyes"},
    {"id": "cyberpunk",    "label": "Cyberpunk",    "suffix": "cyberpunk neon city aesthetic, holographic reflections, blade runner feel"},
    {"id": "retrowave",    "label": "Retrowave",    "suffix": "1980s retrowave synthwave, magenta and cyan neon, sun grid horizon"},
    {"id": "fantasy",      "label": "Fantasy",      "suffix": "epic fantasy concept art, dramatic atmosphere, painterly textures"},
    {"id": "pixel_art",    "label": "Pixel Art",    "suffix": "16-bit pixel art game character, limited palette, sharp pixels"},
    {"id": "watercolor",   "label": "Watercolor",   "suffix": "loose watercolor painting, soft bleeds, expressive paper texture"},
    {"id": "oil_paint",    "label": "Oil Painting", "suffix": "classical oil painting, visible brush strokes, rich impasto, museum quality"},
    {"id": "digital_art",  "label": "Digital Art",  "suffix": "premium digital painting, artstation top trending, finely rendered"},
    {"id": "concept_art",  "label": "Concept Art",  "suffix": "professional game concept art, atmospheric perspective, painterly detail"},
    {"id": "sketch",       "label": "Pencil Sketch","suffix": "expressive graphite pencil sketch on paper, dynamic shading, hand drawn"},
    {"id": "realistic",    "label": "Photorealism", "suffix": "ultra-photorealistic 8k photograph, professional studio lighting"},
    {"id": "render_3d",    "label": "3D Render",    "suffix": "high-end 3D render, octane / unreal engine quality, cinematic light"},
    {"id": "cute_3d",      "label": "Cute 3D",      "suffix": "cute chibi 3D character, kawaii style, soft toy aesthetic"},
    {"id": "claymation",   "label": "Claymation",   "suffix": "claymation stop-motion character, hand-sculpted texture, soft lighting"},
    {"id": "ukiyoe",       "label": "Ukiyo-e",      "suffix": "japanese ukiyo-e woodblock print, flat color planes, refined linework"},
    {"id": "art_nouveau",  "label": "Art Nouveau",  "suffix": "art nouveau ornate style, Mucha-inspired flowing lines, decorative motifs"},
    {"id": "tattoo",       "label": "Tattoo",       "suffix": "neo-traditional tattoo design, bold black outlines, vibrant ink fills"},
    {"id": "vintage",      "label": "Vintage Photo","suffix": "1970s vintage film photograph, faded colors, light leaks, nostalgic"},
    {"id": "splatter",     "label": "Splatter",     "suffix": "abstract paint splatter art, vibrant chromatic explosions, expressive"},
    {"id": "gothic",       "label": "Gothic",       "suffix": "gothic dark art, moody atmosphere, baroque ornament, candlelight"},
    {"id": "steampunk",    "label": "Steampunk",    "suffix": "steampunk victorian aesthetic, brass mechanics, intricate gears, sepia tone"},
    {"id": "pop_art",      "label": "Pop Art",      "suffix": "Warhol pop art, halftone dots, bold flat primary colors"},
    {"id": "renaissance",  "label": "Renaissance",  "suffix": "renaissance oil painting, chiaroscuro lighting, baroque drapery"},
    {"id": "film_noir",    "label": "Film Noir",    "suffix": "1940s film noir, hard shadows, smoky atmosphere, monochrome grade"},
    {"id": "minimalist",   "label": "Minimalist",   "suffix": "minimalist line art, single color accent, abundant white space"},
    {"id": "low_poly",     "label": "Low Poly",     "suffix": "low-poly geometric art, faceted color planes, simple gradient"},
    {"id": "ink_wash",     "label": "Ink Wash",     "suffix": "asian sumi-e ink wash painting, expressive brush strokes, refined minimalism"},
]


def get_artistic(style_id: str):
    for s in ARTISTIC_STYLES:
        if s["id"] == style_id:
            return s
    return None
