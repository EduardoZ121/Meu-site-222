"""Pro mode presets (Realism / Expression / Enhancements)."""

PRO_PRESETS = {
    # ===== Realismo =====
    "original": {
        "category": "realism", "label": "Original",
        "prompt": "Convert this photo into a hyper-photorealistic professional photograph. Preserve identity, pose, expression, framing exactly. Add realistic skin texture, accurate lighting, sharp focus, natural color, magazine print quality."
    },
    "expression": {
        "category": "realism", "label": "Expression-faithful",
        "prompt": "Refine to a photorealistic portrait while strictly preserving the original facial expression, mouth, eyebrows, eye openness, age, identity, pose, hairstyle and skin tone. Add only believable photographic detail."
    },
    "softer": {
        "category": "realism", "label": "Soft Realism",
        "prompt": "Soft photorealistic editorial portrait. Preserve identity, expression, age, lighting. Subtle skin texture, no excessive pores or wrinkles. Magazine-quality natural finish."
    },
    "cinematic": {
        "category": "realism", "label": "Cinematic",
        "prompt": "Cinematic photograph: dramatic key light, deep shadows, anamorphic flare, shallow depth of field, teal-and-orange grade, 35mm grain. Preserve subject identity, pose, expression."
    },
    "ultra_real": {
        "category": "realism", "label": "Ultra Realistic",
        "prompt": "Ultra-photorealistic full-frame DSLR portrait, 85mm f/1.4, perfect natural light, accurate white balance, razor-sharp eye focus, lifelike skin texture, professional retouch. Preserve identity exactly."
    },
    "iphone": {
        "category": "realism", "label": "iPhone Selfie",
        "prompt": "Natural casual smartphone selfie style, soft daylight, true skin tones, mild HDR, candid feel. Sharp but not over-processed. Preserve identity and expression."
    },
    "studio": {
        "category": "realism", "label": "Studio Portrait",
        "prompt": "Professional studio portrait: softbox key light, neutral seamless backdrop, controlled rim light, fashion-magazine retouching. Preserve identity, hairstyle, pose."
    },
    # ===== Estilo & Humor =====
    "smile": {
        "category": "mood", "label": "Genuine Smile",
        "prompt": "Subtly adjust the subject to a warm genuine smile (slightly raised cheeks, soft eye corners). Keep everything else identical: identity, pose, lighting, framing."
    },
    "seductive": {
        "category": "mood", "label": "Seductive Gaze",
        "prompt": "Adjust the subject to a confident, slightly seductive expression — relaxed lips, focused gaze toward camera. Keep identity, pose, outfit, lighting unchanged."
    },
    "model": {
        "category": "mood", "label": "Editorial Model",
        "prompt": "Transform pose and presence into a high-fashion editorial model — confident neutral expression, magazine cover composure. Preserve identity, outfit, framing."
    },
    "intense": {
        "category": "mood", "label": "Intense Look",
        "prompt": "Subtly intensify the gaze — focused brow, calm mouth, direct look at camera. Keep identity and scene exactly the same."
    },
    "romantic": {
        "category": "mood", "label": "Romantic",
        "prompt": "Soft romantic lighting and warm color grade, gentle smile, dreamy bokeh background. Preserve identity, pose, framing."
    },
    "playful": {
        "category": "mood", "label": "Playful",
        "prompt": "Light playful expression — gentle laugh, eyes slightly squinting, candid energy. Preserve identity, outfit, location."
    },
    "full_body": {
        "category": "mood", "label": "Full Body",
        "prompt": "Reframe to a full-body portrait if possible while preserving identity, outfit and scene. Cinematic composition, magazine quality."
    },
    # ===== Enhancements =====
    "lighting": {
        "category": "enhance", "label": "Better Lighting",
        "prompt": "Re-light the subject with cinematic key + fill + rim setup, balanced exposure, soft shadows, natural color temperature. Preserve everything else."
    },
    "skin_hair": {
        "category": "enhance", "label": "Skin & Hair",
        "prompt": "Refine skin and hair: realistic pores, smooth blemish removal, defined hair strands, natural shine. No plastic look. Preserve identity, lighting, framing."
    },
    "outfit": {
        "category": "enhance", "label": "Refine Outfit",
        "prompt": "Refine the subject's outfit: crisp fabric texture, accurate folds, professional wardrobe finish. Preserve identity, pose, scene."
    },
    "colors": {
        "category": "enhance", "label": "Color Grade",
        "prompt": "Apply a professional cinematic color grade — refined contrast, balanced highlights and shadows, magazine-cover look. Preserve everything else."
    },
    "eyes": {
        "category": "enhance", "label": "Eyes Pop",
        "prompt": "Enhance eyes: sharper catchlights, more defined iris pattern, natural sparkle. Subtle, realistic, no AI artifacts. Preserve identity."
    },
    "max_detail": {
        "category": "enhance", "label": "Maximum Detail",
        "prompt": "Maximum photographic detail pass: sharper focus, finer skin and hair detail, richer fabric texture. Preserve identity, expression, lighting."
    },
}

def get_pro_preset(pid: str):
    return PRO_PRESETS.get(pid)
