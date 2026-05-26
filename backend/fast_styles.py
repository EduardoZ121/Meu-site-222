"""Fast mode styles — 65+ ready-made prompts mapped to model keys."""

# Each style: id, label, category, prompt_suffix, model (standard|pro|artistic)
FAST_STYLES = [
    # === MEN ===
    {"id": "men_ceo", "label": "CEO Portrait", "category": "men", "model": "pro",
     "suffix": "professional CEO portrait, sharp suit, executive lighting, leather chair, ultra-realistic"},
    {"id": "men_athlete", "label": "Athlete", "category": "men", "model": "pro",
     "suffix": "athletic body in studio lighting, gym setting, dramatic shadows, magazine cover"},
    {"id": "men_warrior", "label": "Cinematic Warrior", "category": "men", "model": "artistic",
     "suffix": "cinematic warrior, leather armor, dramatic backlight, smoke, 35mm film grain"},
    {"id": "men_streetwear", "label": "Streetwear", "category": "men", "model": "standard",
     "suffix": "streetwear fashion shoot, tokyo neon backdrop, oversized hoodie, candid pose"},
    {"id": "men_classic_bw", "label": "Classic B&W", "category": "men", "model": "pro",
     "suffix": "classic black and white portrait, soft window light, editorial magazine style"},
    {"id": "men_rockstar", "label": "Rock Star", "category": "men", "model": "artistic",
     "suffix": "rock star on stage, spotlight, leather jacket, vintage tone, motion blur"},
    # === WOMEN ===
    {"id": "women_editorial", "label": "Editorial Vogue", "category": "women", "model": "pro",
     "suffix": "vogue editorial portrait, soft beauty lighting, designer wardrobe, magazine quality"},
    {"id": "women_french", "label": "French Elegance", "category": "women", "model": "pro",
     "suffix": "parisian elegance, beige trench coat, blurred haussmann street, golden hour"},
    {"id": "women_film_noir", "label": "Film Noir", "category": "women", "model": "artistic",
     "suffix": "1940s film noir, shadow stripes, smoke, red lips, dramatic monochrome"},
    {"id": "women_natural", "label": "Natural Beauty", "category": "women", "model": "pro",
     "suffix": "natural beauty, sun-drenched skin, freckles, linen dress, meadow at golden hour"},
    {"id": "women_runway", "label": "Runway Model", "category": "women", "model": "standard",
     "suffix": "high fashion runway photography, ethereal pose, couture, dark catwalk"},
    {"id": "women_renaissance", "label": "Renaissance Painting", "category": "women", "model": "artistic",
     "suffix": "renaissance oil painting style, chiaroscuro lighting, baroque drapery, museum quality"},
    # === UNISEX ===
    {"id": "uni_anime", "label": "Anime Cover", "category": "unisex", "model": "artistic",
     "suffix": "modern anime cover art, cel-shading, dynamic composition, key visual"},
    {"id": "uni_ghibli", "label": "Ghibli Style", "category": "unisex", "model": "artistic",
     "suffix": "Studio Ghibli inspired, soft pastel watercolor, lush nature, miyazaki vibes"},
    {"id": "uni_cyberpunk", "label": "Cyberpunk", "category": "unisex", "model": "artistic",
     "suffix": "cyberpunk neon city, rain reflections, holograms, blade runner aesthetic"},
    {"id": "uni_oil_paint", "label": "Oil Painting", "category": "unisex", "model": "artistic",
     "suffix": "classical oil painting, visible brush strokes, rich impasto texture, museum piece"},
    {"id": "uni_polaroid", "label": "Polaroid 70s", "category": "unisex", "model": "standard",
     "suffix": "1970s polaroid photograph, faded colors, light leaks, nostalgic, scan grain"},
    {"id": "uni_yearbook", "label": "90s Yearbook", "category": "unisex", "model": "standard",
     "suffix": "1990s school yearbook photo, soft pastel backdrop, flash lighting, retro charm"},
    {"id": "uni_statue", "label": "Marble Statue", "category": "unisex", "model": "artistic",
     "suffix": "carved white marble statue, classical greek sculpture, museum lighting"},
    {"id": "uni_ink_sketch", "label": "Ink Sketch", "category": "unisex", "model": "artistic",
     "suffix": "monochrome ink sketch, expressive strokes, white paper texture, hand drawn"},
    # === COUPLES ===
    {"id": "couples_engagement", "label": "Engagement Shoot", "category": "couples", "model": "pro",
     "suffix": "romantic engagement photoshoot, golden hour countryside, intimate embrace, soft focus"},
    {"id": "couples_wedding", "label": "Wedding Editorial", "category": "couples", "model": "pro",
     "suffix": "editorial wedding portrait, candle-lit chapel, elegant gowns, cinematic"},
    {"id": "couples_dance", "label": "Tango Dance", "category": "couples", "model": "artistic",
     "suffix": "tango dancers, sharp shadows, polished wood floor, theatrical lighting"},
    # === FLYERS ===
    {"id": "flyers_concert", "label": "Concert Flyer", "category": "flyers", "model": "standard",
     "suffix": "concert poster design, bold typography placeholder, stage lights, festival energy"},
    {"id": "flyers_corporate", "label": "Corporate Flyer", "category": "flyers", "model": "standard",
     "suffix": "minimalist corporate flyer design, clean grid, premium typography, brand mockup"},
    {"id": "flyers_party", "label": "Club Night", "category": "flyers", "model": "standard",
     "suffix": "club night flyer, neon typography, dancers silhouettes, energetic vibe"},
    # === COMICS ===
    {"id": "comics_marvel", "label": "Marvel Cover", "category": "comics", "model": "artistic",
     "suffix": "marvel comic book cover, dynamic pose, halftone shading, bold ink outlines"},
    {"id": "comics_manga", "label": "Manga Page", "category": "comics", "model": "artistic",
     "suffix": "japanese manga panel, screentones, dynamic angles, ink illustration"},
    {"id": "comics_dc_dark", "label": "DC Noir", "category": "comics", "model": "artistic",
     "suffix": "dc comics noir style, gritty city, heavy black shadows, single light source"},
    {"id": "comics_pop_art", "label": "Pop Art", "category": "comics", "model": "artistic",
     "suffix": "lichtenstein pop art, ben-day dots, bold primary colors, comic balloon"},
    # === STYLES (extra quick) ===
    {"id": "style_pixar", "label": "Pixar Toon", "category": "styles", "model": "artistic",
     "suffix": "pixar 3d animation, bright cinematic lighting, charming character design"},
    {"id": "style_low_poly", "label": "Low Poly", "category": "styles", "model": "artistic",
     "suffix": "low poly geometric art, faceted color planes, simple gradient background"},
    {"id": "style_watercolor", "label": "Watercolor", "category": "styles", "model": "artistic",
     "suffix": "loose watercolor painting, paper texture, soft color bleeds, expressive"},
]


def get_style(style_id: str):
    for s in FAST_STYLES:
        if s["id"] == style_id:
            return s
    return None
