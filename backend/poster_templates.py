"""50 Poster templates organized in 6 categories.

Each template has:
- placeholders → fields the user fills in the editor
- prompt → instruction with {placeholder} slots that gets formatted
- aspect → preferred output aspect ratio

Each generated poster is wrapped in POSTER_DIRECTOR (universal art-direction)
so the chosen model (Grok / Flux 2 / GPT Image 1) renders professional
print-quality output with legible typography.
"""

# ------------------------------------------------------------------
# Universal art-direction prefix injected before every template prompt.
# Crucial because Grok / Flux render typography unevenly without
# explicit instructions about quality, hierarchy and finish.
# ------------------------------------------------------------------
POSTER_DIRECTOR = (
    "Professional design poster, 8K resolution, magazine print quality, "
    "perfectly legible typography rendered as crisp vector-like text, "
    "strong typographic hierarchy with clear primary/secondary/tertiary text levels, "
    "balanced composition with intentional negative space, "
    "premium graphic design, art-directed by a senior creative director. "
)

# ------------------------------------------------------------------
# Mood UI choices → expanded visual descriptors that actually steer
# the model. A user picking "Cinematográfico" should get cinematic
# grading, not just the word "cinematic" appended.
# ------------------------------------------------------------------
MOOD_EXPANSIONS = {
    "Cinematográfico": "Cinematic teal-and-orange color grading, anamorphic shallow depth of field, dramatic backlit subject, atmospheric haze, film grain, 2.39:1 widescreen feel.",
    "Neon":             "Saturated neon magenta and electric cyan, glossy reflections, dark mirror floor, dramatic rim light, cyberpunk aesthetic, halated glow on type.",
    "Minimal":          "Minimalist Swiss-grid design, ample negative space, single accent color, refined sans-serif type, no ornaments, gallery-quality restraint.",
    "Vintage":          "Vintage analog feel — soft halation, mild paper bleed, off-set CMYK misregistration, faded sun-warmed palette, retro 70s typography.",
    "Bold":             "Bold high-contrast layout, oversized condensed display type, primary-color blocks, strong diagonal composition, attention-grabbing.",
    "Luxury":           "Luxury editorial aesthetic — embossed gold foil accents, deep matte black, refined didone serif, monogram-level restraint, Hermès / Chanel level taste.",
    "Editorial":        "Editorial magazine layout — modular grid, mixed serif headline + sans body, considered hierarchy, Vogue / The New Yorker quality.",
    "Brutalist":        "Brutalist graphic design — raw typographic stacks, exposed grid, harsh contrast, oversized helvetica, off-balance composition, 90s anti-design.",
    "Pastel":           "Pastel palette of dusty rose, butter, lavender and seafoam, soft diffuse light, fine rounded sans-serif, dreamy and gentle.",
    "Y2K":              "Y2K aesthetic — chrome 3D type, candy color gradients, lens flares, bubbly forms, early-2000s tech-glam revival.",
    "Mono":             "Strict monochrome palette in a single hue, photographic duotone treatment, refined museum-poster feel.",
    "Sun-warm":         "Sun-warmed palette of amber, terracotta and ochre, golden-hour light, gentle film grain, optimistic mood.",
}


POSTER_TEMPLATES = [ { 'id': 'fl_general',
    'category': 'flyer',
    'label': "💼 Flyer Geral 'WE WANT YOU'",
    'placeholders': ['headline', 'subtitle', 'positions', 'contact_email'],
    'prompt': 'Edit this image into a creative recruitment poster featuring the person positioned on the right side, arms crossed, smiling '
              'naturally while facing slightly to the left. Radiating confidence and warmth, wearing a stylish red blazer over a white '
              'blouse. Maintain a red, black, and white geometric background, with circular and linear design elements framing the figure. '
              "On the left, display the bold headline: 'WE WANT YOU!' with 'WE' in white on a red block, 'WANT' in black on white, and "
              "'YOU!' in red. Beneath that 'Join Our Professionals Team.' Add a 'WE'RE HIRING' section with: Graphic Designer, Marketing "
              "Staff, Finance Accountant, Operational Staff. Include an 'Apply Now!' button. Contact: company@gmail.com. Energetic, "
              'professional, inviting design. preserve identity, keep same face, keep facial structure, keep skin tone, maintain original '
              'identity, do not change person, realistic face consistency, preserve original facial expression, keep same emotion, keep '
              'same eye expression, keep same pose',
    'aspect': '4:5',
    'replacements': { 'headline': 'WE WANT YOU!',
                      'subtitle': 'Join Our Professionals Team.',
                      'positions': 'Graphic Designer, Marketing Staff, Finance Accountant, Operational Staff',
                      'contact_email': 'company@gmail.com'},
    'optional': ['headline', 'subtitle', 'positions', 'contact_email']},
  { 'id': 'fl_tech',
    'category': 'flyer',
    'label': '💻 Flyer Tech Futurista',
    'placeholders': ['headline', 'subtitle', 'positions', 'contact_email'],
    'prompt': 'Edit this image into a modern tech recruitment poster featuring the person standing confidently slightly to the left side, '
              'holding a tablet, with a focused and professional expression. Wearing a smart casual outfit (dark blazer over a neutral '
              'shirt). Background with futuristic blue and purple gradient, subtle grid lines and glowing UI elements. Headline on the '
              "right: 'JOIN OUR TEAM' in bold futuristic font. Subtext: 'Build the Future With Us.' Add: 'WE'RE HIRING' - Software "
              "Engineer - UI/UX Designer - Data Analyst - Product Manager. Glowing 'Apply Now' button. Contact: careers@techvision.com. "
              'Lighting slightly neon, high contrast, modern startup aesthetic. preserve identity, keep same face, keep facial structure, '
              'keep skin tone, maintain original identity, do not change person, realistic face consistency, preserve original facial '
              'expression, keep same emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'replacements': { 'headline': 'JOIN OUR TEAM',
                      'subtitle': 'Build the Future With Us.',
                      'positions': 'Software Engineer - UI/UX Designer - Data Analyst - Product Manager',
                      'contact_email': 'careers@techvision.com'},
    'optional': ['headline', 'subtitle', 'positions', 'contact_email']},
  { 'id': 'fl_corporate',
    'category': 'flyer',
    'label': '🏢 Flyer Corporativo Limpo',
    'placeholders': ['headline', 'subtitle', 'positions', 'contact_email'],
    'prompt': 'Edit this image into a corporate recruitment flyer featuring the person seated at a desk, hands gently crossed, calm and '
              'confident expression. Wearing formal attire (blazer or suit). Background clean white with subtle grey lines and minimal '
              "design. Headline: 'WE ARE HIRING'. Subtext: 'Join Our Professional Team'. Open roles: Administrative Assistant, HR Manager, "
              "Accountant, Office Coordinator. 'Apply Today' button in blue. Contact: hr@companygroup.com. Soft studio lighting, clean "
              'layout, professional and trustworthy feel. preserve identity, keep same face, keep facial structure, keep skin tone, '
              'maintain original identity, do not change person, realistic face consistency, preserve original facial expression, keep '
              'same emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'replacements': { 'headline': 'WE ARE HIRING',
                      'subtitle': 'Join Our Professional Team',
                      'positions': 'Administrative Assistant, HR Manager, Accountant, Office Coordinator',
                      'contact_email': 'hr@companygroup.com'},
    'optional': ['headline', 'subtitle', 'positions', 'contact_email']},
  { 'id': 'fl_fitness',
    'category': 'flyer',
    'label': '💪 Flyer Fitness Power',
    'placeholders': ['headline', 'subtitle', 'positions', 'contact_email'],
    'prompt': 'Edit this image into a fitness recruitment poster featuring the person in a strong confident pose, arms slightly flexed or '
              'hands on hips, energetic expression. Wearing athletic outfit (gym wear). Background dark with red and black tones, smoke '
              "effects and light streaks. Headline: 'WE'RE BUILDING CHAMPIONS'. Subtext: 'Join Our Fitness Team'. Hiring: Personal "
              "Trainer, Fitness Coach, Nutrition Specialist, Gym Assistant. Bold 'JOIN NOW' button. Contact: fitness@powergym.com. High "
              'contrast lighting, dramatic shadows, intense gym vibe. preserve identity, keep same face, keep facial structure, keep skin '
              'tone, maintain original identity, do not change person, realistic face consistency, preserve original facial expression, '
              'keep same emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'replacements': { 'headline': "WE'RE BUILDING CHAMPIONS",
                      'subtitle': 'Join Our Fitness Team',
                      'positions': 'Personal Trainer, Fitness Coach, Nutrition Specialist, Gym Assistant',
                      'contact_email': 'fitness@powergym.com'},
    'optional': ['headline', 'subtitle', 'positions', 'contact_email']},
  { 'id': 'fl_restaurant',
    'category': 'flyer',
    'label': '🍷 Flyer Restaurante Acolhedor',
    'placeholders': ['headline', 'subtitle', 'positions', 'contact_email'],
    'prompt': 'Edit this image into a restaurant hiring flyer featuring the person standing slightly sideways holding a tray or menu, '
              'friendly and welcoming smile. Wearing hospitality uniform or elegant outfit. Warm background with golden lighting, '
              "restaurant ambiance blur. Headline: 'JOIN OUR TEAM'. Subtext: 'We're Hiring Passionate People'. Positions: Waiter / "
              "Waitress, Chef Assistant, Bartender, Kitchen Staff. 'Apply Now' button. Contact: jobs@finebistro.com. Warm lighting, "
              'inviting atmosphere, soft glow. preserve identity, keep same face, keep facial structure, keep skin tone, maintain original '
              'identity, do not change person, realistic face consistency, preserve original facial expression, keep same emotion, keep '
              'same eye expression, keep same pose',
    'aspect': '4:5',
    'replacements': { 'headline': 'JOIN OUR TEAM',
                      'subtitle': "We're Hiring Passionate People",
                      'positions': 'Waiter / Waitress, Chef Assistant, Bartender, Kitchen Staff',
                      'contact_email': 'jobs@finebistro.com'},
    'optional': ['headline', 'subtitle', 'positions', 'contact_email']},
  { 'id': 'fl_creative',
    'category': 'flyer',
    'label': '🎨 Flyer Agência Criativa',
    'placeholders': ['headline', 'subtitle', 'positions', 'contact_email'],
    'prompt': 'Edit this image into a creative agency recruitment poster featuring the person in a relaxed artistic pose, slightly '
              'leaning, confident and creative expression. Wearing stylish modern outfit. Background with abstract shapes, colorful '
              "gradients (purple, orange, blue), paint strokes and design elements. Headline: 'CREATIVITY WANTED'. Subtext: 'Join Our "
              "Creative Studio'. Hiring: Graphic Designer, Video Editor, Social Media Manager, Content Creator. 'Let's Work Together' "
              'button. Contact: hello@creativelab.com. Vibrant colors, artistic layout, modern design style. preserve identity, keep same '
              'face, keep facial structure, keep skin tone, maintain original identity, do not change person, realistic face consistency, '
              'preserve original facial expression, keep same emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'replacements': { 'headline': 'CREATIVITY WANTED',
                      'subtitle': 'Join Our Creative Studio',
                      'positions': 'Graphic Designer, Video Editor, Social Media Manager, Content Creator',
                      'contact_email': 'hello@creativelab.com'},
    'optional': ['headline', 'subtitle', 'positions', 'contact_email']},
  { 'id': 'u_ed_future',
    'category': 'editorial',
    'label': '🌸 Future Vision Pôster',
    'placeholders': ['extra_text'],
    'prompt': 'Fashion editorial poster featuring the person in modern Japanese streetwear, standing against a minimal gradient '
              "background. Oversized typography at the top spells 'FUTURE VISION' in English, with smaller Japanese katakana characters "
              'beneath. Monochrome palette in neon pink. Ultra-modern, high-fashion poster design. preserve identity, keep same face, keep '
              'facial structure, keep skin tone, maintain original identity, do not change person, realistic face consistency, preserve '
              'original facial expression, keep same emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_ed_modern',
    'category': 'editorial',
    'label': '🌷 Modern Edge Pôster',
    'placeholders': ['extra_text'],
    'prompt': 'Fashion editorial poster featuring the person in modern streetwear with a luxury minimalist approach, standing against a '
              "soft neutral gradient background. Clean oversized typography reading 'MODERN EDGE' with subtle Japanese characters. Soft "
              'monochrome tones with light pink accents. Clean and elegant composition. preserve identity, keep same face, keep facial '
              'structure, keep skin tone, maintain original identity, do not change person, realistic face consistency, preserve original '
              'facial expression, keep same emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_ep_sorcerer',
    'category': 'epic',
    'label': '🔮 Fantasy Sorcerer Poster',
    'placeholders': ['extra_text'],
    'prompt': 'Hyper-realistic cinematic movie poster of the person as a powerful sorcerer bursting through a cracked Queen of Spades '
              'playing card. The card explodes outward with stone fragments, dust, and debris frozen mid-air. Wearing an ornate royal '
              'maroon and gold embroidered medieval fantasy jacket, rich fabric textures, intricate detailing, regal and mystical. The '
              'subject extends one hand forward, fingers glowing with intense magical energy, subtle golden sparks and dark arcane aura. '
              'Intense piercing gaze, confident dominant expression, cinematic hero framing. Dramatic chiaroscuro lighting, dark moody '
              'background, volumetric light rays, ultra-detailed textures, photorealistic face, epic fantasy realism, movie poster '
              'composition, high contrast, dynamic motion, dust particles, 8K. preserve identity, keep same face, keep facial structure, '
              'keep skin tone, maintain original identity, do not change person, realistic face consistency, preserve original facial '
              'expression, keep same emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'locked': True,
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_ep_grid_classic',
    'category': 'epic',
    'label': '🎬 Editorial Grid — Classic',
    'placeholders': ['extra_text'],
    'prompt': 'Professional studio fashion photoshoot in a 2×2 grid collage showing four poses of the person wearing black sunglasses. '
              'Outfit: deep emerald green tailored blazer, cream/off-white dress shirt, black slim trousers, burgundy tie, silver watch. '
              'Blazer appears differently across frames (worn, draped over shoulder, partially removed, held). Background: clean '
              'teal-to-turquoise gradient studio. Poses: 1. Close portrait adjusting tie. 2. Seated editorial pose leaning forward elbow '
              'on knee. 3. Relaxed pose with vintage camera around neck. 4. Stylish pose running hand through hair while holding blazer. '
              'Lighting: three-point studio lighting — softbox key 45° camera left, soft fill camera right, subtle rim light. 85mm f/2.2 '
              'ISO 100 1/160s. Ultra-realistic GQ/Vogue editorial, sharp 4K, clean 2×2 grid. preserve identity, keep same face, keep '
              'facial structure, keep skin tone, maintain original identity, do not change person, realistic face consistency, preserve '
              'original facial expression, keep same emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'locked': True,
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_ep_grid_dark',
    'category': 'epic',
    'label': '🎬 Editorial Grid — Dark Mode',
    'placeholders': ['extra_text'],
    'prompt': 'Same 2×2 grid editorial of the person with sunglasses, identical outfit and poses, but darker teal gradient with subtle '
              'vignette, stronger contrast, deeper shadows, cinematic moody tone. Editorial high contrast, 4K, 2×2 grid. preserve '
              'identity, keep same face, keep facial structure, keep skin tone, maintain original identity, do not change person, '
              'realistic face consistency, preserve original facial expression, keep same emotion, keep same eye expression, keep same '
              'pose',
    'aspect': '4:5',
    'locked': True,
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_ep_grid_lux',
    'category': 'epic',
    'label': '🎬 Editorial Grid — Soft Luxury',
    'placeholders': ['extra_text'],
    'prompt': 'Same 2×2 grid editorial of the person with sunglasses, identical outfit and poses, but soft pastel teal gradient cleaner '
              'luxury look, softer diffusion, more even highlights, luxury fashion tone. Clean Vogue-style, 4K, 2×2 grid. preserve '
              'identity, keep same face, keep facial structure, keep skin tone, maintain original identity, do not change person, '
              'realistic face consistency, preserve original facial expression, keep same emotion, keep same eye expression, keep same '
              'pose',
    'aspect': '4:5',
    'locked': True,
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_ep_grid_street',
    'category': 'epic',
    'label': '🎬 Editorial Grid — Street Edge',
    'placeholders': ['extra_text'],
    'prompt': 'Same 2×2 grid editorial of the person with sunglasses, identical outfit and poses, but teal gradient with subtle texture, '
              'slightly harsher lighting, sharper shadows, street-fashion tone. Edgy editorial sharper contrast, 4K, 2×2 grid. preserve '
              'identity, keep same face, keep facial structure, keep skin tone, maintain original identity, do not change person, '
              'realistic face consistency, preserve original facial expression, keep same emotion, keep same eye expression, keep same '
              'pose',
    'aspect': '4:5',
    'locked': True,
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_sf_cyber',
    'category': 'scifi',
    'label': '🔬 Cyber Science Portrait',
    'placeholders': ['extra_text'],
    'prompt': 'Cinematic close-up portrait of the person in side profile, wet hair strands on the skin, intense reflective eyes, '
              'mathematical formulas and scientific equations projected across the face and neck, glowing white handwritten symbols, '
              'physics diagrams and abstract calculations overlay, futuristic holographic projection, dark moody background, dramatic '
              'lighting, high contrast, detailed skin texture, cyberpunk science aesthetic, shallow depth of field, volumetric lighting, '
              'photorealistic, 8k, film still, sci-fi atmosphere. preserve identity, keep same face, keep facial structure, keep skin '
              'tone, maintain original identity, do not change person, realistic face consistency, preserve original facial expression, '
              'keep same emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'locked': True,
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_sf_cybergoth',
    'category': 'scifi',
    'label': '💜 Cybergoth Neon Portrait',
    'placeholders': ['extra_text'],
    'prompt': 'Cyberpunk portrait of the person with pale synthetic complexion, dark metallic lipstick, intense gaze directed at viewer. '
              'Vivid holographic glow with magenta and cyan edge lighting. Captured on a mirrorless 85mm f/1.2, deep atmospheric bokeh. '
              'Cyberpunk portraiture, techno-goth aesthetic, high-contrast digital realism, ultra high resolution, hyper-detailed '
              'textures, cinematic sci-fi realism. preserve identity, keep same face, keep facial structure, keep skin tone, maintain '
              'original identity, do not change person, realistic face consistency, preserve original facial expression, keep same '
              'emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'locked': True,
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_he_cine',
    'category': 'hero',
    'label': '🎥 Frame Cinematográfico Herói',
    'placeholders': ['extra_text'],
    'prompt': 'Retrato editorial cinematográfico em 8K apresentando the person com estética de super-herói moderno. Fundo vermelho com luz '
              'difusa e partículas leves. Iluminação suave porém dramática com highlights no rosto e traje. Pose firme com braços cruzados '
              'e expressão determinada. Estilo realista próximo de filme. preserve identity, keep same face, keep facial structure, keep '
              'skin tone, maintain original identity, do not change person, realistic face consistency, preserve original facial '
              'expression, keep same emotion, keep same eye expression, keep same pose',
    'aspect': '4:5',
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_phone_spotify',
    'category': 'phone',
    'label': '🎧 Spotify Gigante',
    'placeholders': ['extra_text'],
    'prompt': 'Create a stylish, modern photo in vertical 9:16 format using the reference image, featuring the person standing confidently '
              "on the giant screen of an iPhone 16 lying on the floor. The screen displays a Spotify playlist with the song 'Enter Sandman "
              "- Metallica.' Wearing AirPods Max, an oversized white hoodie, black pants, and crisp white Air Jordans. The scene is shot "
              'from a high angle, top-down, to emphasize the scale of the phone. Minimalist, stylish, futuristic vibe. preserve identity, '
              'keep same face, keep facial structure, keep skin tone, maintain original identity, do not change person, realistic face '
              'consistency, preserve original facial expression, keep same emotion, keep same eye expression, keep same pose',
    'aspect': '9:16',
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_phone_neon',
    'category': 'phone',
    'label': '🟣 Neon Music World',
    'placeholders': ['extra_text'],
    'prompt': 'Create a futuristic neon-style scene in vertical 9:16 format featuring the person standing on a giant smartphone screen '
              'displaying a music interface. The environment glows with purple and blue neon lights. Wearing headphones, oversized hoodie, '
              'and streetwear outfit. High-angle top-down shot emphasizing scale. Cyberpunk aesthetic with glowing reflections. preserve '
              'identity, keep same face, keep facial structure, keep skin tone, maintain original identity, do not change person, '
              'realistic face consistency, preserve original facial expression, keep same emotion, keep same eye expression, keep same '
              'pose',
    'aspect': '9:16',
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_phone_apple',
    'category': 'phone',
    'label': '🍏 Apple Minimal Luxo',
    'placeholders': ['extra_text'],
    'prompt': 'Create a clean luxury Apple-style photo in vertical 9:16 featuring the person standing on a giant smartphone screen in a '
              'minimalist white environment. The interface is sleek and modern with music playing. Wearing premium streetwear with a '
              'refined aesthetic. Shot from a high top-down angle with soft shadows and clean lighting. preserve identity, keep same face, '
              'keep facial structure, keep skin tone, maintain original identity, do not change person, realistic face consistency, '
              'preserve original facial expression, keep same emotion, keep same eye expression, keep same pose',
    'aspect': '9:16',
    'optional': ['extra_text'],
    'appends': 'extra_text'},
  { 'id': 'u_phone_street',
    'category': 'phone',
    'label': '🏙️ Street Music Energy',
    'placeholders': ['extra_text'],
    'prompt': 'Create a street-style scene in vertical 9:16 featuring the person standing on a giant phone screen placed on an urban '
              'ground surface. The screen shows a music player interface. Background includes subtle street textures like concrete and '
              'graffiti. Outfit is casual streetwear with strong attitude. Shot from top-down angle. preserve identity, keep same face, '
              'keep facial structure, keep skin tone, maintain original identity, do not change person, realistic face consistency, '
              'preserve original facial expression, keep same emotion, keep same eye expression, keep same pose',
    'aspect': '9:16',
    'optional': ['extra_text'],
    'appends': 'extra_text'}]


def _load_v2_templates():
    """Load extended templates from poster_templates_v2.json (frontend-synced).
    Cached after first read."""
    global _V2_TEMPLATES_CACHE
    if _V2_TEMPLATES_CACHE is not None:
        return _V2_TEMPLATES_CACHE
    try:
        import json, os
        path = os.path.join(os.path.dirname(__file__), "poster_templates_v2.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as fh:
                _V2_TEMPLATES_CACHE = json.load(fh) or []
        else:
            _V2_TEMPLATES_CACHE = []
    except Exception:
        _V2_TEMPLATES_CACHE = []
    return _V2_TEMPLATES_CACHE


_V2_TEMPLATES_CACHE = None


def get_poster(template_id: str):
    for t in POSTER_TEMPLATES:
        if t["id"] == template_id:
            return t
    for t in _load_v2_templates():
        if t.get("id") == template_id:
            return t
    return None
