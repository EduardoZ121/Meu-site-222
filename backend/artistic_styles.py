"""Artistic style catalog — categorized presets for the AI Artistic Studio.

This module exposes:
  ARTISTIC_STYLES : list[dict]  — items with {id, label, category, suffix}
  CATEGORIES      : list[str]   — category ids in display order
  get_artistic(slug) -> dict|None

The catalog mirrors the curated artistic looks used in the frontend
studio. It is intentionally compact so it can be extended without
breaking the public schema.
"""

CATEGORIES = [
    "photography",
    "anime_manga",
    "cartoon_3d",
    "painting",
    "illustration",
    "concept",
]

_STYLES_RAW = [
    # Photography — editorial / cinematic
    ("ph_classic", "Classic Portrait",     "photography", "soft natural light, neutral background, shallow depth of field, magazine portrait"),
    ("ph_editorial", "Editorial Portrait", "photography", "high contrast editorial fashion shot, dramatic poses, magazine editorial styling"),
    ("ph_film_35", "35mm Film",            "photography", "grainy 35mm film photograph, warm vintage tones, analog imperfections"),
    ("ph_cinematic", "Cinematic",          "photography", "cinematic still, anamorphic lens, teal-and-orange grade, film grain"),
    ("ph_studio", "Studio Light",          "photography", "studio strobes, seamless backdrop, crisp commercial finish"),
    ("ph_golden", "Golden Hour",           "photography", "warm golden hour light, soft sun flare, long shadows"),
    ("ph_blue_hour", "Blue Hour",          "photography", "blue hour twilight, cool tones, neon city lights in background"),
    ("ph_documentary", "Documentary",      "photography", "candid documentary photograph, available light, photojournalistic tone"),

    # Anime & Manga
    ("an_modern",  "Modern Anime",         "anime_manga", "modern anime illustration, crisp cel shading, vibrant colors, expressive eyes"),
    ("an_ghibli",  "Studio Vibes",         "anime_manga", "soft watercolor anime, gentle lighting, dreamy pastoral mood"),
    ("an_manga_bw","Manga B&W",            "anime_manga", "black and white manga panel, hatching shadows, dynamic linework"),
    ("an_shounen", "Shounen Action",       "anime_manga", "high energy shounen anime, motion lines, dramatic sky"),
    ("an_webtoon", "Webtoon",              "anime_manga", "modern webtoon vertical illustration, clean digital coloring"),

    # Cartoon & 3D
    ("c3_pixar",   "3D Animated",          "cartoon_3d",  "cute 3D animated character, soft global illumination, expressive features"),
    ("c3_cgi",     "CGI Realistic",        "cartoon_3d",  "photoreal CGI render, ray-traced lighting, high subsurface detail"),
    ("c3_lowpoly", "Low Poly",             "cartoon_3d",  "stylized low poly 3D render, flat shading, geometric facets"),
    ("c3_toon",    "Toon Shaded",          "cartoon_3d",  "toon-shaded 3D, bold outlines, comic-book color blocks"),

    # Painting
    ("pa_oil",     "Oil Painting",         "painting",    "classical oil painting, thick brush strokes, museum-quality finish"),
    ("pa_water",   "Watercolor",           "painting",    "loose watercolor painting, bleeding edges, pastel washes"),
    ("pa_renaissance", "Renaissance",      "painting",    "Renaissance oil portrait, chiaroscuro lighting, ornate composition"),
    ("pa_impression", "Impressionism",     "painting",    "impressionist brushwork, vibrant dappled light, painterly atmosphere"),
    ("pa_gouache", "Gouache",              "painting",    "matte gouache illustration, flat textured strokes, mid-century palette"),
    ("pa_ink",     "Ink Wash",             "painting",    "Asian ink wash painting, minimal sumi-e brushstrokes, white space"),

    # Illustration / Graphic
    ("il_comic",   "Comic Book",           "illustration","Western comic book panel, bold inks, halftone shading, vibrant flats"),
    ("il_vector",  "Vector Flat",          "illustration","clean vector illustration, flat colors, minimal geometric shapes"),
    ("il_riso",    "Risograph",            "illustration","risograph print, two-tone overprint, paper grain texture"),
    ("il_pixel",   "Pixel Art",            "illustration","16-bit pixel art, limited palette, crisp pixel boundaries"),
    ("il_storybook","Storybook",           "illustration","children's storybook illustration, soft textures, charming whimsy"),

    # Concept / Mood
    ("cn_cyberpunk", "Cyberpunk",          "concept",     "cyberpunk neon noir, rain-soaked streets, holographic signage"),
    ("cn_fantasy", "Epic Fantasy",         "concept",     "epic fantasy concept art, mythic landscape, volumetric god-rays"),
    ("cn_scifi",   "Sci-Fi Concept",       "concept",     "futuristic sci-fi concept art, sleek surfaces, atmospheric haze"),
    ("cn_noir",    "Film Noir",            "concept",     "1940s film noir, hard shadows, smoky black-and-white atmosphere"),
    ("cn_vaporwave","Vaporwave",           "concept",     "vaporwave aesthetic, pastel sunset gradients, retro 80s grid"),
]

CATEGORY_LABELS = {
    "photography":  "Photography",
    "anime_manga":  "Anime & Manga",
    "cartoon_3d":   "Cartoon & 3D",
    "painting":     "Painting",
    "illustration": "Illustration",
    "concept":      "Concept & Mood",
}

ARTISTIC_STYLES = [
    {
        "id":       sid,
        "label":    label,
        "category": cat,
        "suffix":   suffix,
    }
    for sid, label, cat, suffix in _STYLES_RAW
]


def get_artistic(slug: str):
    """Return a single artistic style dict by id, or None."""
    for s in ARTISTIC_STYLES:
        if s["id"] == slug:
            return s
    return None
