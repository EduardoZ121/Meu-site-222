/** Wizard options — locale-specific labels (prompt composition uses selected label text). */

export const WIZARD_STEPS = {
  en: [
    { id: "q1", title: "What do you want to create?", subtitle: "Pick the base for your project.", iconKey: "image" },
    { id: "q2", title: "Which visual style?", subtitle: "Define the overall aesthetic.", iconKey: "palette" },
    { id: "q3", title: "Which format?", subtitle: "Where will you use the image?", iconKey: "crop" },
    { id: "q4", title: "Lighting setup", subtitle: "How should the scene be lit?", iconKey: "light" },
    { id: "q5", title: "Camera & lens", subtitle: "Framing and optical character.", iconKey: "camera" },
    { id: "q6", title: "Mood & palette", subtitle: "Emotional tone and color direction.", iconKey: "palette" },
    { id: "q7", title: "Describe in detail", subtitle: "Subject, environment, action — be specific.", iconKey: "file" },
    { id: "q8", title: "Technical quality", subtitle: "Render fidelity and finish level.", iconKey: "spark" },
    { id: "q9", title: "Reference or extras?", subtitle: "Artist, film, brand or extra tags (optional).", iconKey: "camera" },
  ],
  pt: [
    { id: "q1", title: "O que queres criar?", subtitle: "Escolhe a base do teu projeto.", iconKey: "image" },
    { id: "q2", title: "Que estilo visual?", subtitle: "Define a estética geral.", iconKey: "palette" },
    { id: "q3", title: "Qual formato?", subtitle: "Onde vais usar a imagem?", iconKey: "crop" },
    { id: "q4", title: "Iluminação", subtitle: "Como deve estar iluminada a cena?", iconKey: "light" },
    { id: "q5", title: "Câmara & lente", subtitle: "Enquadramento e carácter óptico.", iconKey: "camera" },
    { id: "q6", title: "Mood & paleta", subtitle: "Tom emocional e direção de cor.", iconKey: "palette" },
    { id: "q7", title: "Descreve em detalhe", subtitle: "Sujeito, ambiente, ação — sê específico.", iconKey: "file" },
    { id: "q8", title: "Qualidade técnica", subtitle: "Nível de fidelidade e acabamento.", iconKey: "spark" },
    { id: "q9", title: "Referência ou extras?", subtitle: "Artista, filme, marca ou tags extra (opcional).", iconKey: "camera" },
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

export const WIZARD_Q4 = {
  en: [
    { v: "1", label: "Golden hour / warm sunset" },
    { v: "2", label: "Soft overcast / diffused" },
    { v: "3", label: "Hard studio key + fill" },
    { v: "4", label: "Neon / cyberpunk practicals" },
    { v: "5", label: "Rembrandt / dramatic side light" },
    { v: "6", label: "Low-key noir" },
    { v: "7", label: "High-key beauty / fashion" },
    { v: "8", label: "Volumetric god rays" },
    { v: "9", label: "Moonlit blue hour" },
    { v: "10", label: "Natural window light" },
  ],
  pt: [
    { v: "1", label: "Hora dourada / pôr do sol quente" },
    { v: "2", label: "Nublado suave / difuso" },
    { v: "3", label: "Estúdio hard key + fill" },
    { v: "4", label: "Neons / práticas cyberpunk" },
    { v: "5", label: "Rembrandt / luz lateral dramática" },
    { v: "6", label: "Low-key noir" },
    { v: "7", label: "High-key beauty / moda" },
    { v: "8", label: "Raios volumétricos" },
    { v: "9", label: "Hora azul ao luar" },
    { v: "10", label: "Luz natural de janela" },
  ],
};

export const WIZARD_Q5 = {
  en: [
    { v: "1", label: "85mm portrait, shallow DOF" },
    { v: "2", label: "35mm documentary wide" },
    { v: "3", label: "24mm environmental wide" },
    { v: "4", label: "50mm natural eye-level" },
    { v: "5", label: "100mm macro detail" },
    { v: "6", label: "Anamorphic 2.39:1 cinematic" },
    { v: "7", label: "Aerial / drone establishing" },
    { v: "8", label: "Low-angle hero shot" },
    { v: "9", label: "Top-down flat lay" },
    { v: "10", label: "Dutch angle dynamic" },
  ],
  pt: [
    { v: "1", label: "Retrato 85mm, DOF rasa" },
    { v: "2", label: "35mm documental wide" },
    { v: "3", label: "24mm ambiental wide" },
    { v: "4", label: "50mm natural ao nível dos olhos" },
    { v: "5", label: "100mm macro detalhe" },
    { v: "6", label: "Anamórfico 2.39:1 cinematográfico" },
    { v: "7", label: "Aéreo / drone establishing" },
    { v: "8", label: "Ângulo baixo heroico" },
    { v: "9", label: "Top-down flat lay" },
    { v: "10", label: "Dutch angle dinâmico" },
  ],
};

export const WIZARD_Q6 = {
  en: [
    { v: "1", label: "Warm earthy tones" },
    { v: "2", label: "Cool teal & orange grade" },
    { v: "3", label: "Monochrome B&W high contrast" },
    { v: "4", label: "Pastel soft dreamy" },
    { v: "5", label: "Neon saturated pop" },
    { v: "6", label: "Muted desaturated film" },
    { v: "7", label: "Luxury gold & black" },
    { v: "8", label: "Melancholic blue mood" },
    { v: "9", label: "Vibrant tropical" },
    { v: "10", label: "Clinical clean white" },
  ],
  pt: [
    { v: "1", label: "Tons quentes terrosos" },
    { v: "2", label: "Grade teal & laranja frio" },
    { v: "3", label: "Monocromático P&B alto contraste" },
    { v: "4", label: "Pastel suave onírico" },
    { v: "5", label: "Pop saturado neon" },
    { v: "6", label: "Filme desaturado muted" },
    { v: "7", label: "Luxo dourado & preto" },
    { v: "8", label: "Melancolia azul" },
    { v: "9", label: "Tropical vibrante" },
    { v: "10", label: "Clínico branco limpo" },
  ],
};

export const WIZARD_Q8 = {
  en: [
    { v: "1", label: "8K photorealistic, ultra sharp" },
    { v: "2", label: "Editorial magazine finish" },
    { v: "3", label: "Cinematic film still" },
    { v: "4", label: "Unreal Engine / 3D render" },
    { v: "5", label: "Fine art gallery print" },
    { v: "6", label: "Commercial product hero" },
  ],
  pt: [
    { v: "1", label: "8K fotorrealista, ultra nítido" },
    { v: "2", label: "Acabamento revista editorial" },
    { v: "3", label: "Film still cinematográfico" },
    { v: "4", label: "Unreal Engine / render 3D" },
    { v: "5", label: "Print galeria fine art" },
    { v: "6", label: "Hero comercial de produto" },
  ],
};

export const WIZARD_Q7_EXAMPLES = {
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
  lighting: "Lighting: {lighting}.",
  camera: "Camera: {camera}.",
  mood: "Mood and palette: {mood}.",
  subject: "Main description: {subject}.",
  quality: "Technical finish: {quality}.",
  footer: "Professional composition, cinematic lighting, clear visual hierarchy, high definition, premium finish, publication-ready. Preserve aesthetic coherence, realistic detail and editorial contrast.",
  reference: " Additional reference: {ref}.",
};

const COMPOSE_PT = {
  create: "Criar {type} em estilo {style}.",
  format: "Formato: {format}.",
  lighting: "Iluminação: {lighting}.",
  camera: "Câmara: {camera}.",
  mood: "Mood e paleta: {mood}.",
  subject: "Descrição principal: {subject}.",
  quality: "Acabamento técnico: {quality}.",
  footer: "Composição profissional, iluminação cinematográfica, hierarquia visual clara, alta definição, acabamento premium, pronto para publicação. Preservar coerência estética, detalhes realistas e contraste editorial.",
  reference: " Referência adicional: {ref}.",
};

export function wizardLocale(lang) {
  const code = ["en", "pt", "es", "fr"].includes(lang) ? lang : "en";
  const pick = (map) => map[code] || map.en;
  return {
    steps: pick(WIZARD_STEPS),
    q1: pick(WIZARD_Q1),
    q2: pick(WIZARD_Q2),
    q3: pick(WIZARD_Q3),
    q4: pick(WIZARD_Q4),
    q5: pick(WIZARD_Q5),
    q6: pick(WIZARD_Q6),
    q8: pick(WIZARD_Q8),
    q7Examples: pick(WIZARD_Q7_EXAMPLES),
    compose: code === "pt" ? COMPOSE_PT : COMPOSE_EN,
  };
}

export function optionLabel(options, value) {
  return options.find((o) => o.v === value)?.label || value;
}

export function composeLocalPromptFromAnswers(answers, locale) {
  const { q1, q2, q3, q4, q5, q6, q8, compose } = locale;
  const type = optionLabel(q1, answers.q1);
  const style = optionLabel(q2, answers.q2);
  const format = optionLabel(q3, answers.q3);
  const lighting = optionLabel(q4, answers.q4);
  const camera = optionLabel(q5, answers.q5);
  const mood = optionLabel(q6, answers.q6);
  const quality = optionLabel(q8, answers.q8);
  const subject = answers.q7;
  const perchance = answers.perchance_tags ? ` Perchance tags: ${answers.perchance_tags}.` : "";
  const reference = answers.q9
    ? compose.reference.replace("{ref}", answers.q9)
    : "";
  return [
    compose.create.replace("{type}", type).replace("{style}", style),
    compose.format.replace("{format}", format),
    compose.lighting.replace("{lighting}", lighting),
    compose.camera.replace("{camera}", camera),
    compose.mood.replace("{mood}", mood),
    compose.subject.replace("{subject}", subject),
    compose.quality.replace("{quality}", quality),
    compose.footer,
    perchance,
    reference,
  ].join(" ").trim();
}
