/** Wizard options — locale-specific labels (prompt composition uses selected label text). */

export const WIZARD_STEPS = {
  en: [
    { id: "q1", title: "What do you want to create?", subtitle: "Pick the base for your project.", iconKey: "image" },
    { id: "q2", title: "Which visual style?", subtitle: "Define the overall aesthetic.", iconKey: "palette" },
    { id: "q3", title: "Which format?", subtitle: "Where will you use the image?", iconKey: "crop" },
    { id: "q4", title: "Describe in detail", subtitle: "Subject, environment, feeling — as much detail as possible.", iconKey: "file" },
    { id: "q5", title: "Reference photo?", subtitle: "Have a specific image or person in mind? (optional)", iconKey: "camera" },
  ],
  pt: [
    { id: "q1", title: "O que queres criar?", subtitle: "Escolhe a base do teu projeto.", iconKey: "image" },
    { id: "q2", title: "Que estilo visual?", subtitle: "Define a estética geral.", iconKey: "palette" },
    { id: "q3", title: "Qual formato?", subtitle: "Onde vais usar a imagem?", iconKey: "crop" },
    { id: "q4", title: "Descreve em detalhe", subtitle: "Sujeito, ambiente, sentimento — o mais detalhado possível.", iconKey: "file" },
    { id: "q5", title: "Foto de referência?", subtitle: "Tens uma imagem ou pessoa específica em mente? (opcional)", iconKey: "camera" },
  ],
};

export const WIZARD_Q1 = {
  en: [
    { v: "1", label: "Professional flyer / poster", emoji: "🎟" },
    { v: "2", label: "Logo / visual identity", emoji: "✦" },
    { v: "3", label: "Concept art / illustration", emoji: "✎" },
    { v: "4", label: "Character (anime, realistic, cartoon)", emoji: "⌬" },
    { v: "5", label: "Landscape / scene", emoji: "⛰" },
    { v: "6", label: "Product / commercial mockup", emoji: "▣" },
    { v: "7", label: "Portrait / professional photo", emoji: "◉" },
    { v: "8", label: "Instagram / TikTok post", emoji: "▤" },
    { v: "9", label: "Album cover", emoji: "♪" },
    { v: "10", label: "Book cover", emoji: "▭" },
    { v: "11", label: "Fashion editorial", emoji: "✣" },
    { v: "12", label: "Food / restaurant photo", emoji: "✺" },
    { v: "13", label: "Interior / architecture render", emoji: "▥" },
    { v: "14", label: "Advertising campaign", emoji: "✸" },
    { v: "15", label: "Film / series key art", emoji: "▻" },
    { v: "16", label: "Fantasy / sci-fi scene", emoji: "✺" },
    { v: "17", label: "Pet portrait", emoji: "✿" },
    { v: "18", label: "Car / automobile", emoji: "◈" },
    { v: "19", label: "Abstract / conceptual art", emoji: "▦" },
    { v: "20", label: "Other", emoji: "✦" },
  ],
  pt: [
    { v: "1", label: "Flyer / Pôster Profissional", emoji: "🎟" },
    { v: "2", label: "Logo / Identidade Visual", emoji: "✦" },
    { v: "3", label: "Arte Conceitual / Ilustração", emoji: "✎" },
    { v: "4", label: "Personagem (anime, realista, cartoon)", emoji: "⌬" },
    { v: "5", label: "Paisagem / Cenário", emoji: "⛰" },
    { v: "6", label: "Produto / Mockup Comercial", emoji: "▣" },
    { v: "7", label: "Retrato / Foto Profissional", emoji: "◉" },
    { v: "8", label: "Post Instagram / TikTok", emoji: "▤" },
    { v: "9", label: "Capa de Álbum Musical", emoji: "♪" },
    { v: "10", label: "Capa de Livro", emoji: "▭" },
    { v: "11", label: "Editorial de Moda", emoji: "✣" },
    { v: "12", label: "Foto de Comida / Restaurante", emoji: "✺" },
    { v: "13", label: "Render de Interiores / Arquitetura", emoji: "▥" },
    { v: "14", label: "Campanha Publicitária", emoji: "✸" },
    { v: "15", label: "Key Art de Filme / Série", emoji: "▻" },
    { v: "16", label: "Cena Fantasia / Sci-Fi", emoji: "✺" },
    { v: "17", label: "Retrato de Animal / Pet", emoji: "✿" },
    { v: "18", label: "Carro / Automóvel", emoji: "◈" },
    { v: "19", label: "Arte Abstrata / Conceitual", emoji: "▦" },
    { v: "20", label: "Outro", emoji: "✦" },
  ],
};

export const WIZARD_Q2 = {
  en: [
    { v: "1", label: "Japanese anime / manga" },
    { v: "2", label: "Realistic / photographic" },
    { v: "3", label: "Artistic / digital painting" },
    { v: "4", label: "3D render (Pixar / Disney)" },
    { v: "5", label: "Sketch / hand-drawn" },
    { v: "6", label: "Minimal / flat design" },
    { v: "7", label: "Cyberpunk / neon futuristic" },
    { v: "8", label: "Vintage / retro 70s–80s" },
    { v: "9", label: "Watercolor" },
    { v: "10", label: "Oil / classic painting" },
    { v: "11", label: "Comic / graphic novel" },
    { v: "12", label: "Low-poly / geometric" },
    { v: "13", label: "Vaporwave / Y2K" },
    { v: "14", label: "Brutalist editorial" },
    { v: "15", label: "Luxury / high fashion" },
    { v: "16", label: "Documentary / film still" },
  ],
  pt: [
    { v: "1", label: "Anime / Mangá Japonês" },
    { v: "2", label: "Realista / Fotográfico" },
    { v: "3", label: "Artístico / Pintura Digital" },
    { v: "4", label: "3D Render (Pixar / Disney)" },
    { v: "5", label: "Sketch / Desenho à Mão" },
    { v: "6", label: "Minimalista / Flat Design" },
    { v: "7", label: "Cyberpunk / Futurista Neon" },
    { v: "8", label: "Vintage / Retrô 70s–80s" },
    { v: "9", label: "Aquarela" },
    { v: "10", label: "Óleo / Pintura Clássica" },
    { v: "11", label: "Comic / Banda Desenhada" },
    { v: "12", label: "Low-poly / Geométrico" },
    { v: "13", label: "Vaporwave / Y2K" },
    { v: "14", label: "Brutalist Editorial" },
    { v: "15", label: "Luxo / Alta Moda" },
    { v: "16", label: "Documentário / Film Still" },
  ],
};

export const WIZARD_Q3 = {
  en: [
    { v: "1", label: "Vertical 3:4", hint: "Print / Stories" },
    { v: "2", label: "Square 1:1", hint: "Instagram feed" },
    { v: "3", label: "Horizontal 16:9", hint: "YouTube / Banner" },
    { v: "4", label: "Story 9:16", hint: "Stories / TikTok" },
    { v: "5", label: "Feed tall 4:5", hint: "Instagram post" },
    { v: "6", label: "Ultra wide 21:9", hint: "Cinematic" },
  ],
  pt: [
    { v: "1", label: "Vertical 3:4", hint: "Print / Stories" },
    { v: "2", label: "Quadrado 1:1", hint: "Instagram feed" },
    { v: "3", label: "Horizontal 16:9", hint: "YouTube / Banner" },
    { v: "4", label: "Story 9:16", hint: "Stories / TikTok" },
    { v: "5", label: "Feed Tall 4:5", hint: "Instagram post" },
    { v: "6", label: "Ultra Wide 21:9", hint: "Cinemático" },
  ],
};

export const WIZARD_Q4_EXAMPLES = {
  en: [
    "Woman in her 30s with short hair, amber eyes, on a Lisbon rooftop at sunset",
    "Futuristic city with blue and pink neon skyscrapers, bird's-eye view",
    "Cozy coffee table with latte art, open book, warm morning light",
    "Majestic white tiger emerging from a misty forest at dawn",
    "Minimal jazz concert poster, bold typography",
  ],
  pt: [
    "Mulher de 30 anos com cabelo curto, olhos cor de mel, em rooftop ao pôr do sol em Lisboa",
    "Cidade futurista com arranha-céus em neon azul e rosa, vista de cima",
    "Mesa de café aconchegante com latte arte, livro aberto, luz quente da manhã",
    "Tigre branco majestoso saindo de uma floresta enevoada ao amanhecer",
    "Pôster minimalista para concerto de jazz, tipografia bold",
  ],
};

const COMPOSE_EN = {
  create: "Create {type} in {style} style.",
  format: "Format: {format}.",
  subject: "Main description: {subject}.",
  footer: "Professional composition, cinematic lighting, clear visual hierarchy, high definition, premium finish, publication-ready. Preserve aesthetic coherence, realistic detail and editorial contrast.",
  reference: " Additional reference: {ref}.",
};

const COMPOSE_PT = {
  create: "Criar {type} em estilo {style}.",
  format: "Formato: {format}.",
  subject: "Descrição principal: {subject}.",
  footer: "Composição profissional, iluminação cinematográfica, hierarquia visual clara, alta definição, acabamento premium, pronto para publicação. Preservar coerência estética, detalhes realistas e contraste editorial.",
  reference: " Referência adicional: {ref}.",
};

const STEP_ICONS = {
  image: "ImageIcon",
  palette: "Palette",
  crop: "Crop",
  file: "FileText",
  camera: "Camera",
};

export function wizardLocale(lang) {
  const code = ["en", "pt", "es", "fr"].includes(lang) ? lang : "en";
  const pick = (map) => map[code] || map.en;
  return {
    steps: pick(WIZARD_STEPS),
    q1: pick(WIZARD_Q1),
    q2: pick(WIZARD_Q2),
    q3: pick(WIZARD_Q3),
    q4Examples: pick(WIZARD_Q4_EXAMPLES),
    compose: code === "pt" ? COMPOSE_PT : COMPOSE_EN,
    stepIcons: STEP_ICONS,
  };
}

export function optionLabel(options, value) {
  return options.find((o) => o.v === value)?.label || value;
}
