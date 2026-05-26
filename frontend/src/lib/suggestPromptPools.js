/** Random prompt building blocks per UI language (fallback when /suggest API is down). */

const POOLS = {
  en: {
    subjects: [
      "confident editorial portrait of a person",
      "premium product in a luxury campaign",
      "music artist in a cinematic poster",
      "urban streetwear brand",
      "modern restaurant with signature dish",
      "content creator in studio",
      "couple in an editorial romantic scene",
      "sports car in neon night city",
      "powerful sci-fi character",
      "minimalist album cover",
    ],
    styles: [
      "cinematic",
      "fashion editorial",
      "minimal luxury",
      "neon cyberpunk",
      "35mm analog film",
      "premium poster",
      "photographic realism",
      "elegant surreal",
      "modern brutalist",
      "sophisticated vintage",
    ],
    lights: [
      "dramatic side light",
      "soft golden hour",
      "large softbox studio",
      "cinematic backlight",
      "magenta and blue neon",
      "natural window light",
      "deep shadows and atmosphere",
      "direct editorial flash",
    ],
    moods: [
      "confident and aspirational",
      "mysterious and premium",
      "calm and sophisticated",
      "energetic and commercial",
      "intense and cinematic",
      "warm and human",
      "futuristic and clean",
      "artistic and memorable",
    ],
    formats: [
      "4:5 format for Instagram",
      "1:1 feed format",
      "9:16 story format",
      "vertical poster composition",
      "advertising campaign layout",
    ],
    details: [
      "clear visual hierarchy, intentional negative space",
      "realistic textures, refined contrast",
      "short depth of field, sharp subject focus",
      "imagined editorial typography, no illegible text",
      "publish-ready, high definition, brand aesthetic",
    ],
    compose: (subject, style, light, mood, format, detail) =>
      `${subject}, ${style} style, ${light}, mood ${mood}, ${format}, ${detail}.`,
    defaultTheme: "visual concept",
  },
  pt: {
    subjects: [
      "retrato editorial de uma pessoa confiante",
      "produto premium numa campanha de luxo",
      "artista musical em pôster cinematográfico",
      "marca de roupa urbana",
      "restaurante moderno com prato assinatura",
      "criador de conteúdo em estúdio",
      "casal numa cena romântica editorial",
      "automóvel desportivo em noite neon",
      "personagem sci-fi com presença poderosa",
      "capa de álbum minimalista",
    ],
    styles: [
      "cinematográfico",
      "editorial de moda",
      "luxo minimalista",
      "neon cyberpunk",
      "filme analógico 35mm",
      "pôster premium",
      "realismo fotográfico",
      "surreal elegante",
      "brutalista moderno",
      "vintage sofisticado",
    ],
    lights: [
      "luz lateral dramática",
      "golden hour suave",
      "estúdio com softbox grande",
      "contraluz cinematográfico",
      "neon magenta e azul",
      "luz natural de janela",
      "sombras profundas e atmosfera",
      "flash editorial direto",
    ],
    moods: [
      "confiante e aspiracional",
      "misterioso e premium",
      "calmo e sofisticado",
      "energético e comercial",
      "intenso e cinematográfico",
      "quente e humano",
      "futurista e limpo",
      "artístico e memorável",
    ],
    formats: [
      "formato 4:5 para Instagram",
      "formato 1:1 para feed",
      "formato 9:16 para story",
      "composição de pôster vertical",
      "layout de campanha publicitária",
    ],
    details: [
      "hierarquia visual clara, espaço negativo intencional",
      "texturas realistas, contraste refinado",
      "profundidade de campo curta, foco nítido no sujeito",
      "tipografia imaginada como design editorial, sem texto ilegível",
      "pronto para publicar, alta definição, estética de marca",
    ],
    compose: (subject, style, light, mood, format, detail) =>
      `${subject}, estilo ${style}, ${light}, mood ${mood}, ${format}, ${detail}.`,
    defaultTheme: "conceito visual",
  },
  es: {
    subjects: [
      "retrato editorial de una persona segura",
      "producto premium en campaña de lujo",
      "artista musical en póster cinematográfico",
      "marca de ropa urbana",
      "restaurante moderno con plato estrella",
      "creador de contenido en estudio",
      "pareja en escena romántica editorial",
      "coche deportivo en noche neón",
      "personaje sci-fi con presencia poderosa",
      "portada de álbum minimalista",
    ],
    styles: [
      "cinematográfico",
      "editorial de moda",
      "lujo minimalista",
      "neón cyberpunk",
      "película analógica 35mm",
      "póster premium",
      "realismo fotográfico",
      "surreal elegante",
      "brutalista moderno",
      "vintage sofisticado",
    ],
    lights: [
      "luz lateral dramática",
      "hora dorada suave",
      "estudio con softbox grande",
      "contraluz cinematográfico",
      "neón magenta y azul",
      "luz natural de ventana",
      "sombras profundas y atmósfera",
      "flash editorial directo",
    ],
    moods: [
      "confiado y aspiracional",
      "misterioso y premium",
      "calmo y sofisticado",
      "enérgico y comercial",
      "intenso y cinematográfico",
      "cálido y humano",
      "futurista y limpio",
      "artístico y memorable",
    ],
    formats: [
      "formato 4:5 para Instagram",
      "formato 1:1 para feed",
      "formato 9:16 para story",
      "composición de póster vertical",
      "layout de campaña publicitaria",
    ],
    details: [
      "jerarquía visual clara, espacio negativo intencional",
      "texturas realistas, contraste refinado",
      "poca profundidad de campo, foco nítido en el sujeto",
      "tipografía editorial imaginada, sin texto ilegible",
      "listo para publicar, alta definición, estética de marca",
    ],
    compose: (subject, style, light, mood, format, detail) =>
      `${subject}, estilo ${style}, ${light}, mood ${mood}, ${format}, ${detail}.`,
    defaultTheme: "concepto visual",
  },
  fr: {
    subjects: [
      "portrait éditorial d'une personne confiante",
      "produit premium en campagne de luxe",
      "artiste musical sur affiche cinématographique",
      "marque streetwear urbaine",
      "restaurant moderne avec plat signature",
      "créateur de contenu en studio",
      "couple dans une scène romantique éditoriale",
      "voiture de sport dans une nuit néon",
      "personnage sci-fi puissant",
      "pochette d'album minimaliste",
    ],
    styles: [
      "cinématographique",
      "éditorial mode",
      "luxe minimaliste",
      "néon cyberpunk",
      "film analogique 35mm",
      "affiche premium",
      "réalisme photographique",
      "surréal élégant",
      "brutaliste moderne",
      "vintage sophistiqué",
    ],
    lights: [
      "lumière latérale dramatique",
      "golden hour douce",
      "studio avec grand softbox",
      "contre-jour cinématographique",
      "néon magenta et bleu",
      "lumière naturelle de fenêtre",
      "ombres profondes et atmosphère",
      "flash éditorial direct",
    ],
    moods: [
      "confiant et aspirationnel",
      "mystérieux et premium",
      "calme et sophistiqué",
      "énergique et commercial",
      "intense et cinématographique",
      "chaleureux et humain",
      "futuriste et épuré",
      "artistique et mémorable",
    ],
    formats: [
      "format 4:5 pour Instagram",
      "format 1:1 pour le feed",
      "format 9:16 pour story",
      "composition d'affiche verticale",
      "mise en page campagne publicitaire",
    ],
    details: [
      "hiérarchie visuelle claire, espace négatif intentionnel",
      "textures réalistes, contraste raffiné",
      "faible profondeur de champ, sujet net",
      "typographie éditoriale imaginée, pas de texte illisible",
      "prêt à publier, haute définition, esthétique de marque",
    ],
    compose: (subject, style, light, mood, format, detail) =>
      `${subject}, style ${style}, ${light}, ambiance ${mood}, ${format}, ${detail}.`,
    defaultTheme: "concept visuel",
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getSuggestPool(lang) {
  const code = (lang || "en").slice(0, 2);
  return POOLS[code] || POOLS.en;
}

export function randomSuggestPrompt(seed = "", lang = "en") {
  const pool = getSuggestPool(lang);
  const subject = seed?.trim() || pick(pool.subjects);
  return pool.compose(
    subject,
    pick(pool.styles),
    pick(pool.lights),
    pick(pool.moods),
    pick(pool.formats),
    pick(pool.details),
  );
}

export function localSuggestions(theme, count = 8, lang = "en") {
  const pool = getSuggestPool(lang);
  const base = theme?.trim() || pool.defaultTheme;
  return Array.from({ length: count }, () => randomSuggestPrompt(base, lang));
}
