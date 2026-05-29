/** Static site map for the support AI — keep in sync with toolsCatalogue + App routes. */
const TOOLS = [
  { id: "studio", path: "/app/generate", name: "Estúdio de Geração", credits: 12, desc: "Texto, foto + prompt ou estilos prontos." },
  { id: "clothes", path: "/app/tools/clothes", name: "Trocar Roupa (AI)", credits: 24, desc: "Troca outfit com foto de referência ou texto." },
  { id: "art", path: "/app/artistic", name: "Estilos Artísticos", credits: 18, desc: "33 estilos (anime, óleo, comic, etc.)." },
  { id: "pro", path: "/app/pro", name: "Retoque Profissional (Pro)", credits: 26, desc: "20 presets cinematográficos/editoriais." },
  { id: "bg_remove", path: "/app/tools/bg-remove", name: "Remover Fundo", credits: 8, desc: "Recorte com transparência." },
  { id: "upscale", path: "/app/tools/upscale", name: "Aumentar Resolução", credits: 20, desc: "Upscale 2× ou 4×." },
  { id: "restore", path: "/app/tools/restore", name: "Restaurar Fotos", credits: 18, desc: "Fotos antigas mais nítidas." },
  { id: "colorize", path: "/app/tools/colorize", name: "Colorir P&B", credits: 16, desc: "Preto e branco → cor." },
  { id: "inpaint", path: "/app/tools/inpaint", name: "Inpaint / Apagar Objetos", credits: 28, desc: "Máscara + prompt para remover/trocar." },
  { id: "posters", path: "/app/posters", name: "Pôsteres Profissionais", credits: 24, desc: "Templates de poster; aceita foto." },
  { id: "manga_studio", path: "/app/manga-studio", name: "MANGA STUDIO", credits: 15, desc: "Mangá/comic: personagens, poses, cenários, painéis (15/40/150 créditos)." },
  { id: "wizard", path: "/app/wizard", name: "Assistente (5 perguntas)", credits: 0, desc: "Monta um prompt em 5 passos (grátis)." },
  { id: "video", path: "/app/video", name: "Texto / Foto → Vídeo", credits: 70, desc: "Clipe ~6s." },
];

const PAGES = [
  { path: "/app/tools", name: "Ferramentas", desc: "Grelha de todas as ferramentas." },
  { path: "/app/gallery", name: "Galeria", desc: "Histórico de criações." },
  { path: "/app/favorites", name: "Favoritos", desc: "Imagens guardadas." },
  { path: "/app/billing", name: "Faturação", desc: "Comprar créditos e ver transações." },
  { path: "/app/profile", name: "Perfil", desc: "Nome, avatar, email." },
  { path: "/app/settings", name: "Definições", desc: "Idioma, palavra-passe, formato por defeito." },
  { path: "/app/referrals", name: "Referências", desc: "Código de convite — bónus de créditos." },
];

const { getSiteOrigin } = require("./siteOrigin.cjs");

function buildSiteKnowledge() {
  const origin = getSiteOrigin();
  const tools = TOOLS.map(
    (t) => `- ${t.name} (${t.credits} créditos): ${origin}${t.path} — ${t.desc}`,
  ).join("\n");
  const pages = PAGES.map((p) => `- ${p.name}: ${origin}${p.path} — ${p.desc}`).join("\n");
  return { origin, tools, pages, toolsList: TOOLS, pagesList: PAGES };
}

module.exports = { buildSiteKnowledge, TOOLS, PAGES };
