/** Partilhado entre /app/wizard e modal no Estúdio Artístico. */

export const WIZARD_Q1_OPTIONS = [
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
];

export const WIZARD_Q2_OPTIONS = [
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
];

export const WIZARD_Q3_OPTIONS = [
  { v: "1", label: "Vertical 3:4", hint: "Print / Stories" },
  { v: "2", label: "Quadrado 1:1", hint: "Instagram feed" },
  { v: "3", label: "Horizontal 16:9", hint: "YouTube / Banner" },
  { v: "4", label: "Story 9:16", hint: "Stories / TikTok" },
  { v: "5", label: "Feed Tall 4:5", hint: "Instagram post" },
  { v: "6", label: "Ultra Wide 21:9", hint: "Cinemático" },
];

export const WIZARD_Q4_EXAMPLES = [
  "Mulher de 30 anos com cabelo curto, olhos cor de mel, em rooftop ao pôr do sol em Lisboa",
  "Cidade futurista com arranha-céus em neon azul e rosa, vista de cima",
  "Mesa de café aconchegante com latte arte, livro aberto, luz quente da manhã",
];

export const WIZARD_STEPS = [
  { id: "q1", title: "O que queres criar?", subtitle: "Escolhe a base do projeto." },
  { id: "q2", title: "Que estilo visual?", subtitle: "Define a estética geral." },
  { id: "q3", title: "Qual formato?", subtitle: "Onde vais usar a imagem?" },
  { id: "q4", title: "Descreve em detalhe", subtitle: "Sujeito, ambiente, sentimento." },
  { id: "q5", title: "Referência extra?", subtitle: "Opcional." },
];

const optionLabel = (options, value) => options.find((o) => o.v === value)?.label || value;

export function composeLocalWizardPrompt(answers) {
  const type = optionLabel(WIZARD_Q1_OPTIONS, answers.q1);
  const style = optionLabel(WIZARD_Q2_OPTIONS, answers.q2);
  const format = optionLabel(WIZARD_Q3_OPTIONS, answers.q3);
  const subject = answers.q4;
  const reference = answers.q5 ? ` Referência adicional: ${answers.q5}.` : "";
  return [
    `Criar ${type} em estilo ${style}.`,
    `Formato: ${format}.`,
    `Descrição principal: ${subject}.`,
    "Composição profissional, iluminação cinematográfica, hierarquia visual clara, alta definição, acabamento premium.",
    reference,
  ].join(" ").trim();
}
