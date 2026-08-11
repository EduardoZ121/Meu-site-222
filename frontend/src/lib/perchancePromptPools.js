/** Perchance-style random prompt fragments — large pools for the wizard roller. */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const PERCHANCE_POOLS = {
  en: {
    lighting: [
      "golden hour rim light", "soft overcast diffusion", "hard noon sun with crisp shadows",
      "neon practicals with wet reflections", "Rembrandt triangle lighting", "volumetric god rays",
      "studio softbox key + fill", "candlelit warm ambience", "moonlit blue hour",
      "high-key fashion beauty dish", "low-key noir side light", "bioluminescent glow",
    ],
    camera: [
      "85mm f/1.4 shallow depth of field", "35mm documentary framing", "24mm wide environmental",
      "100mm macro detail", "50mm natural perspective", "anamorphic 2.39:1 cinematic",
      "tilt-shift miniature effect", "aerial drone establishing shot", "low-angle hero perspective",
      "Dutch angle dynamic tension", "over-the-shoulder intimacy", "top-down flat lay",
    ],
    mood: [
      "melancholic and introspective", "euphoric and vibrant", "mysterious and ethereal",
      "raw and gritty", "luxurious and refined", "playful and whimsical",
      "dystopian and tense", "serene and meditative", "romantic and dreamy",
      "aggressive and high-energy", "nostalgic film grain warmth", "clinical and hyper-clean",
    ],
    quality: [
      "8K ultra detail, subsurface scattering", "photorealistic, ray-traced reflections",
      "editorial color grade, ACES workflow", "film grain Kodak Portra 400", "Unreal Engine 5 render quality",
      "Hasselblad medium format clarity", "IMAX-scale epic composition", "micro-contrast, tack-sharp focus",
    ],
    extras: [
      "atmospheric haze", "lens flare anamorphic", "bokeh orbs in background",
      "particle dust in light beams", "chromatic aberration subtle", "motion blur on edges",
      "color gel accents", "depth haze layers", "specular highlights on wet surfaces",
    ],
  },
  pt: {
    lighting: [
      "luz dourada de fim de tarde", "difusão suave de dia nublado", "sol forte ao meio-dia com sombras nítidas",
      "neons com reflexos em chão molhado", "iluminação Rembrandt", "raios volumétricos",
      "softbox de estúdio + fill", "ambiente quente à luz de velas", "hora azul ao luar",
      "beauty dish high-key de moda", "luz lateral noir low-key", "brilho bioluminescente",
    ],
    camera: [
      "85mm f/1.4 profundidade rasa", "35mm enquadramento documental", "24mm wide ambiental",
      "100mm macro de detalhe", "50mm perspetiva natural", "anamórfico 2.39:1 cinematográfico",
      "efeito tilt-shift miniatura", "plano aéreo drone", "ângulo baixo heroico",
      "Dutch angle dinâmico", "over-the-shoulder íntimo", "top-down flat lay",
    ],
    mood: [
      "melancólico e introspectivo", "eufórico e vibrante", "misterioso e etéreo",
      "cru e gritty", "luxuoso e refinado", "lúdico e caprichoso",
      "distópico e tenso", "sereno e meditativo", "romântico e onírico",
      "agressivo e energético", "calor nostálgico de grão de filme", "clínico e hiper-limpo",
    ],
    quality: [
      "8K ultra detalhe, subsurface scattering", "fotorrealista, reflexos ray-traced",
      "color grade editorial, workflow ACES", "grão filme Kodak Portra 400", "qualidade render Unreal Engine 5",
      "clareza medium format Hasselblad", "composição épica IMAX", "micro-contraste, foco tack-sharp",
    ],
    extras: [
      "névoa atmosférica", "lens flare anamórfico", "orbs de bokeh no fundo",
      "partículas de pó nos feixes de luz", "aberração cromática subtil", "motion blur nas bordas",
      "acentos de gel colorido", "camadas de haze de profundidade", "highlights especulares em superfícies molhadas",
    ],
  },
};

export function perchancePools(lang) {
  return PERCHANCE_POOLS[lang === "pt" ? "pt" : "en"];
}

export function rollPerchanceCategory(lang, category) {
  const pools = perchancePools(lang);
  return pick(pools[category] || pools.extras);
}

export function rollFullPerchanceBundle(lang) {
  const pools = perchancePools(lang);
  return {
    lighting: pick(pools.lighting),
    camera: pick(pools.camera),
    mood: pick(pools.mood),
    quality: pick(pools.quality),
    extras: pick(pools.extras),
  };
}

export function perchanceBundleToTags(bundle) {
  return [bundle.lighting, bundle.camera, bundle.mood, bundle.quality, bundle.extras]
    .filter(Boolean)
    .join(", ");
}
