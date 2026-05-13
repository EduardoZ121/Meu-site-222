/**
 * Catalogue — REAL TOOLS ONLY. No duplicates.
 * 12 unique tools, no Pollo CDN images.
 */
const TOOLS = [
  // Generation
  { id: "studio", tier: "image", to: "/app/generate",
    name: "Estúdio de Geração", cost: 10,
    desc: "Texto, foto + prompt ou estilos prontos." },
  { id: "clothes", tier: "image", to: "/app/generate?prompt=change+clothes,+different+outfit",
    name: "Trocar Roupa (AI)", cost: 12,
    desc: "Foto + prompt = nova roupa, fundo, cenário." },
  { id: "art", tier: "image", to: "/app/artistic",
    name: "Estilos Artísticos", cost: 13,
    desc: "Pintura digital, anime, watercolor, oil paint." },
  { id: "pro", tier: "image", to: "/app/pro",
    name: "Pro Mode (Retoque)", cost: 18,
    desc: "20 presets profissionais: realismo, mood, enhancements." },

  // Native utility tools
  { id: "bg_remove", tier: "image", to: "/app/tools/bg-remove",
    name: "Remover Fundo", cost: 5,
    desc: "Recorte limpo com transparência. Funciona com logos e rostos." },
  { id: "upscale", tier: "image", to: "/app/tools/upscale",
    name: "Aumentar Resolução", cost: 8,
    desc: "Upscale 2× ou 4×. Recupera fotos desfocadas." },
  { id: "restore", tier: "image", to: "/app/tools/restore",
    name: "Restaurar Fotos", cost: 8,
    desc: "Fotos antigas → nítidas. Reduz ruído, melhora rostos." },
  { id: "colorize", tier: "image", to: "/app/tools/colorize",
    name: "Colorir P&B", cost: 6,
    desc: "Foto preto-e-branco → cor realista." },
  { id: "inpaint", tier: "image", to: "/app/tools/inpaint",
    name: "Inpaint / Apagar Objetos", cost: 12,
    desc: "Pinta a zona, descreve o que pôr. Remove pessoas, texto, objetos." },

  // Native creative tools
  { id: "posters", tier: "image", to: "/app/posters",
    name: "Pôsteres Profissionais", cost: 15,
    desc: "44 templates: música, eventos, editorial. Aceita foto." },
  { id: "carousel", tier: "image", to: "/app/carousel",
    name: "Carrossel Instagram", cost: 8,
    desc: "Multi-slide com estilo consistente." },
  { id: "wizard", tier: "image", to: "/app/wizard",
    name: "Assistente (5 perguntas)", cost: 0,
    desc: "Não sabes o que pedir? 5 perguntas e o prompt sai pronto." },

  // Video
  { id: "video", tier: "video", to: "/app/video",
    name: "Texto / Foto → Vídeo", cost: 20,
    desc: "Clipe cinematográfico de 6 segundos." },
];

export default TOOLS;
