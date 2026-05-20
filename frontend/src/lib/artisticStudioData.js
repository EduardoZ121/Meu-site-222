/**
 * Estúdio Artístico — estilos e efeitos (inspirado em mega-lens).
 * Cada estilo/efeito inclui fragmento de prompt para o motor de IA.
 */

export const ARTISTIC_STYLE_CATEGORIES = [
  { id: "photography", label: "Fotografia" },
  { id: "digital", label: "Digital" },
  { id: "classic", label: "Clássico" },
  { id: "modern", label: "Moderno" },
];

export const ARTISTIC_STUDIO_STYLES = [
  { id: "photo_classic_portrait", cat: "photography", label: "Retrato Clássico", desc: "Iluminação suave, pele natural, fundo desfocado", suffix: "classic portrait photography, soft natural lighting, natural skin texture, shallow depth of field, creamy bokeh background, timeless editorial portrait", gradient: ["#1a1a2e", "#4a5568", "#e2e8f0"], icon: "camera" },
  { id: "photo_editorial", cat: "photography", label: "Retrato Editorial", desc: "Alto contraste, fashion, poses dramáticas", suffix: "high-fashion editorial portrait, dramatic contrast, bold posing, magazine cover quality, sharp styling, professional studio fashion photography", gradient: ["#0f0f0f", "#7c3aed", "#f4f1ea"], icon: "sparkles" },
  { id: "photo_lifestyle", cat: "photography", label: "Lifestyle", desc: "Natural, candid, luz do dia", suffix: "authentic lifestyle photography, candid natural moment, soft daylight, relaxed atmosphere, documentary feel, real-world environment", gradient: ["#fef3c7", "#f59e0b", "#78350f"], icon: "sun" },
  { id: "photo_documentary", cat: "photography", label: "Documental", desc: "Preto e branco granulado, momentos reais", suffix: "documentary black and white photography, visible film grain, raw honest moment, photojournalistic composition, high contrast monochrome", gradient: ["#171717", "#525252", "#a3a3a3"], icon: "aperture" },
  { id: "photo_fine_art", cat: "photography", label: "Fine Art", desc: "Composição pictórica, textura de tela", suffix: "fine art photographic print, painterly composition, canvas texture overlay, gallery-worthy framing, artistic stillness, museum quality", gradient: ["#292524", "#a8a29e", "#fafaf9"], icon: "frame" },
  { id: "photo_glamour", cat: "photography", label: "Glamour", desc: "Iluminação de estúdio, pele perfeita, brilho", suffix: "glamour studio portrait, flawless skin retouch, beauty dish lighting, luminous highlights, elegant shine, luxury beauty campaign", gradient: ["#1e1b4b", "#c084fc", "#fdf4ff"], icon: "gem" },

  { id: "dig_anime", cat: "digital", label: "Anime", desc: "Olhos grandes, linhas limpas, cores vibrantes", suffix: "anime illustration style, large expressive eyes, clean line art, vibrant cel shading, Japanese animation aesthetic", gradient: ["#312e81", "#ec4899", "#67e8f9"], icon: "star" },
  { id: "dig_concept_art", cat: "digital", label: "Concept Art", desc: "Ambientes épicos, detalhado, cinematográfico", suffix: "epic concept art, cinematic environment, highly detailed digital painting, matte painting quality, blockbuster film previsualization", gradient: ["#0c4a6e", "#0369a1", "#fbbf24"], icon: "mountain" },
  { id: "dig_pixel_art", cat: "digital", label: "Pixel Art", desc: "Retro 8-bit/16-bit, paleta limitada", suffix: "retro pixel art, 16-bit game aesthetic, limited color palette, crisp pixel grid, nostalgic arcade style", gradient: ["#14532d", "#22c55e", "#86efac"], icon: "grid" },
  { id: "dig_low_poly", cat: "digital", label: "Low Poly", desc: "Geométrico, facetado, minimalista 3D", suffix: "low poly 3D render, geometric faceted surfaces, minimalist stylized forms, soft gradient lighting, modern 3D illustration", gradient: ["#4c1d95", "#a78bfa", "#06b6d4"], icon: "shapes" },
  { id: "dig_vaporwave", cat: "digital", label: "Vaporwave", desc: "Neon rosa/azul, glitch, anos 80", suffix: "vaporwave aesthetic, pink and cyan neon, 80s retro grid, glitch artifacts, nostalgic synthwave mood", gradient: ["#ec4899", "#8b5cf6", "#06b6d4"], icon: "waves" },
  { id: "dig_cyberpunk", cat: "digital", label: "Cyberpunk", desc: "Neon, chuva, futuro distópico, alta tecnologia", suffix: "cyberpunk dystopian city, neon rain, high technology, blade runner atmosphere, futuristic noir lighting", gradient: ["#0f172a", "#7c3aed", "#22d3ee"], icon: "zap" },

  { id: "cls_oil", cat: "classic", label: "Óleo", desc: "Pinceladas visíveis, textura rica, mestres antigos", suffix: "classical oil painting, visible brushstrokes, rich impasto texture, old masters technique, museum oil on canvas", gradient: ["#451a03", "#b45309", "#fde68a"], icon: "brush" },
  { id: "cls_watercolor", cat: "classic", label: "Aquarela", desc: "Fluido, transparente, bordas suaves", suffix: "delicate watercolor painting, fluid transparent washes, soft bleeding edges, paper texture, airy luminous pigments", gradient: ["#dbeafe", "#60a5fa", "#1d4ed8"], icon: "droplet" },
  { id: "cls_charcoal", cat: "classic", label: "Carvão", desc: "Preto e branco, textura áspera, esboço artístico", suffix: "charcoal sketch drawing, rough textured strokes, dramatic black and white, artistic study on toned paper", gradient: ["#0a0a0a", "#404040", "#d4d4d4"], icon: "pencil" },
  { id: "cls_pastel", cat: "classic", label: "Pastel", desc: "Suave, pó, cores delicadas, impressão de sonho", suffix: "soft pastel artwork, powdery delicate colors, dreamy gentle atmosphere, chalk pastel texture", gradient: ["#fce7f3", "#f9a8d4", "#c4b5fd"], icon: "cloud" },
  { id: "cls_engraving", cat: "classic", label: "Gravura", desc: "Linhas finas, preto e branco, técnica antiga", suffix: "fine line engraving illustration, black and white hatching, antique print technique, detailed etching style", gradient: ["#fafaf9", "#78716c", "#1c1917"], icon: "lines" },
  { id: "cls_mosaic", cat: "classic", label: "Mosaico", desc: "Pequenos azulejos, bizantino, colorido", suffix: "Byzantine mosaic art, small colorful tiles, ornate decorative pattern, historic sacred aesthetic", gradient: ["#1e3a8a", "#eab308", "#dc2626"], icon: "tiles" },

  { id: "mod_minimal", cat: "modern", label: "Minimalista", desc: "Linhas limpas, poucos elementos, espaço negativo", suffix: "minimalist design, clean lines, generous negative space, restrained composition, modern simplicity", gradient: ["#f8fafc", "#94a3b8", "#0f172a"], icon: "minus" },
  { id: "mod_flat", cat: "modern", label: "Flat Design", desc: "Cores sólidas, sem sombras, ícones 2D", suffix: "flat design illustration, solid colors, no shadows, clean 2D vector shapes, modern UI illustration style", gradient: ["#ef4444", "#3b82f6", "#22c55e"], icon: "square" },
  { id: "mod_brutalist", cat: "modern", label: "Brutalismo", desc: "Tipografia áspera, cores cruas, anti-design", suffix: "brutalist graphic design, harsh typography, raw unpolished colors, anti-design poster aesthetic", gradient: ["#000000", "#facc15", "#ffffff"], icon: "type" },
  { id: "mod_art_deco", cat: "modern", label: "Art Déco", desc: "Geométrico, dourado, elegante anos 20", suffix: "Art Deco style, geometric symmetry, gold accents, elegant 1920s luxury, decorative geometric patterns", gradient: ["#0f0f0f", "#ca8a04", "#fef9c3"], icon: "diamond" },
  { id: "mod_pop_art", cat: "modern", label: "Pop Art", desc: "Cores saturadas, Ben-Day dots, Andy Warhol", suffix: "pop art style, saturated primary colors, Ben-Day dots, Andy Warhol screen print aesthetic, bold graphic contrast", gradient: ["#dc2626", "#2563eb", "#facc15"], icon: "circle" },
  { id: "mod_surreal", cat: "modern", label: "Surrealismo", desc: "Sonho lógico, objetos flutuantes, inconsciente", suffix: "surrealist dreamscape, floating impossible objects, subconscious symbolic imagery, Salvador Dalí inspired atmosphere", gradient: ["#1e1b4b", "#f97316", "#a5f3fc"], icon: "moon" },
];

export const ARTISTIC_EFFECT_SECTIONS = [
  {
    id: "lighting",
    title: "Iluminação",
    type: "radio",
    icon: "light",
    options: [
      { id: "natural", label: "Luz Natural", prompt: "natural daylight illumination" },
      { id: "studio", label: "Luz de Estúdio", prompt: "professional studio lighting setup" },
      { id: "golden", label: "Luz Dourada (Golden Hour)", prompt: "warm golden hour sunlight" },
      { id: "blue", label: "Luz Azul (Blue Hour)", prompt: "cool blue hour ambient light" },
      { id: "backlit", label: "Contraluz", prompt: "strong backlight rim glow" },
      { id: "rembrandt", label: "Rembrandt", prompt: "Rembrandt triangle lighting on face" },
      { id: "split", label: "Split Lighting", prompt: "dramatic split lighting half face in shadow" },
      { id: "butterfly", label: "Butterfly Lighting", prompt: "butterfly lighting from above" },
      { id: "rim", label: "Rim Light", prompt: "pronounced rim light edge separation" },
      { id: "silhouette", label: "Silhueta", prompt: "silhouette against bright background" },
    ],
  },
  {
    id: "lens",
    title: "Lente / Câmara",
    type: "radio",
    icon: "lens",
    options: [
      { id: "35mm", label: "35mm (ampla)", prompt: "shot on 35mm wide angle lens perspective" },
      { id: "50mm", label: "50mm (padrão)", prompt: "shot on 50mm standard lens natural perspective" },
      { id: "85mm", label: "85mm (retrato)", prompt: "shot on 85mm portrait lens shallow depth" },
      { id: "135mm", label: "135mm (tele)", prompt: "shot on 135mm telephoto compressed perspective" },
      { id: "macro", label: "Macro", prompt: "macro lens extreme close-up detail" },
      { id: "fisheye", label: "Fisheye", prompt: "fisheye lens distortion" },
      { id: "tilt", label: "Tilt-Shift", prompt: "tilt-shift miniature effect" },
      { id: "lensbaby", label: "Lensbaby", prompt: "Lensbaby selective focus swirl" },
      { id: "polaroid", label: "Polaroid/Vintage", prompt: "vintage Polaroid instant film look" },
      { id: "anamorphic", label: "Anamórfico", prompt: "anamorphic cinematic lens flares and bokeh" },
    ],
  },
  {
    id: "atmosphere",
    title: "Atmosfera",
    type: "checkbox",
    icon: "cloud",
    options: [
      { id: "mist_light", label: "Névoa/Leve", prompt: "light atmospheric mist" },
      { id: "fog_dense", label: "Neblina Densa", prompt: "dense fog atmosphere" },
      { id: "rain", label: "Chuva", prompt: "rain droplets and wet surfaces" },
      { id: "snow", label: "Neve", prompt: "falling snow winter atmosphere" },
      { id: "dust", label: "Poeira/Partículas", prompt: "floating dust particles in light beams" },
      { id: "godrays", label: "Raios de Luz (God Rays)", prompt: "volumetric god rays through atmosphere" },
      { id: "bokeh_circle", label: "Bokeh Circular", prompt: "circular bokeh highlights in background" },
      { id: "bokeh_hex", label: "Bokeh Hexagonal", prompt: "hexagonal bokeh highlights" },
      { id: "vignette_soft", label: "Vignette Suave", prompt: "soft subtle vignette" },
      { id: "vignette_strong", label: "Vignette Forte", prompt: "strong dark vignette corners" },
      { id: "grain", label: "Film Grain", prompt: "authentic film grain texture" },
      { id: "leaks", label: "Light Leaks", prompt: "analog light leak overlays" },
      { id: "ca", label: "Chromatic Aberration", prompt: "subtle chromatic aberration fringing" },
      { id: "flare", label: "Lens Flare", prompt: "cinematic lens flare" },
    ],
  },
  {
    id: "color",
    title: "Cor / Mood",
    type: "radio",
    icon: "palette",
    options: [
      { id: "warm", label: "Warm (quente)", prompt: "warm color grading" },
      { id: "cool", label: "Cool (frio)", prompt: "cool color grading" },
      { id: "desat", label: "Desaturado", prompt: "desaturated muted tones" },
      { id: "vibrant", label: "Saturado Vibrante", prompt: "highly saturated vibrant colors" },
      { id: "mono", label: "Monocromático", prompt: "monochromatic color scheme" },
      { id: "duotone", label: "Duotone", prompt: "stylized duotone color treatment" },
      { id: "pastel_mood", label: "Pastel", prompt: "soft pastel color mood" },
      { id: "neon_mood", label: "Neon", prompt: "neon saturated color mood" },
      { id: "sepia", label: "Sepia", prompt: "sepia vintage tone" },
      { id: "teal_orange", label: "Cyberpunk Teal/Orange", prompt: "teal and orange cinematic color grade" },
    ],
  },
];
