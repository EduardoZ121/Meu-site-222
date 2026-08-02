/**
 * Catalogue — REAL TOOLS ONLY. Costs synced from pricing.json (intl).
 */

import { getCreditCostsForRegion, getPosterHqPremiumCost } from "./pricingRegions";

/** Secções da grelha /app/tools (imagem). */
export const IMAGE_TOOL_SECTIONS = [
  { id: "generation", labelKey: "tools_grid.cat_generation" },
  { id: "utility", labelKey: "tools_grid.cat_utility" },
  { id: "creative", labelKey: "tools_grid.cat_creative" },
];

function costs() {
  return getCreditCostsForRegion("intl") || {};
}

function c(key, fallback) {
  const n = Number(costs()[key]);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

const TOOLS = [
  // Generation
  { id: "studio", tier: "image", category: "generation", to: "/app/generate",
    name: "Estúdio de Geração", cost: c("image", 15),
    desc: "Texto, foto + prompt ou estilos prontos." },
  { id: "gpt_hq_studio", tier: "image", category: "generation", to: "/app/gpt-hq-studio",
    name: "AURUM", cost: getPosterHqPremiumCost(), isNew: true,
    desc: "Pele e detalhe em ouro com OpenAI. Créditos ouro (HQ)." },
  { id: "clothes", tier: "image", category: "generation", to: "/app/tools/clothes",
    name: "Trocar Roupa (AI)", cost: c("clothes", 22),
    desc: "Troca o outfit de qualquer pessoa. Usa foto da roupa ou descreve em texto." },
  { id: "pro", tier: "image", category: "generation", to: "/app/pro",
    name: "Retoque Profissional (Pro)", cost: c("pro", 30),
    desc: "20 presets: realismo cinematográfico, mood editorial, enhancements." },
  { id: "art", tier: "image", category: "generation", to: "/app/artistic",
    name: "Estilos Artísticos", cost: c("artistic", 18),
    desc: "Estilos artísticos, efeitos visuais e receita — gera por texto ou edita foto." },

  // Native utility tools
  { id: "bg_remove", tier: "image", category: "utility", to: "/app/tools/bg-remove",
    name: "Remover Fundo", cost: c("bgRemove", 6),
    desc: "Recorte limpo com transparência. Funciona com logos e rostos." },
  { id: "upscale", tier: "image", category: "utility", to: "/app/tools/upscale",
    name: "Aumentar Resolução", cost: c("upscale", 8),
    desc: "Upscale 2× ou 4×. Recupera fotos desfocadas." },
  { id: "restore", tier: "image", category: "utility", to: "/app/tools/restore",
    name: "Restaurar Fotos", cost: c("restore", 12),
    desc: "Fotos antigas → nítidas. Reduz ruído, melhora rostos." },
  { id: "colorize", tier: "image", category: "utility", to: "/app/tools/colorize",
    name: "Colorir P&B", cost: c("colorize", 10),
    desc: "Foto preto-e-branco → cor realista." },
  { id: "inpaint", tier: "image", category: "utility", to: "/app/tools/inpaint",
    name: "Inpaint / Apagar Objetos", cost: c("inpaint", 20),
    desc: "Pinta a zona, descreve o que pôr. Remove pessoas, texto, objetos." },

  // Native creative tools
  { id: "posters", tier: "image", category: "creative", to: "/app/posters",
    name: "Pôsteres Profissionais", cost: c("posterFast", 28),
    desc: "20 templates: flyers, editorial, epic, sci-fi, hero, music phone. Aceita foto." },
  { id: "brand_campaign", tier: "image", category: "creative", to: "/app/brand-campaign",
    name: "Campanha On-Brand", cost: c("brandCampaignPerImage", 50), isNew: true,
    desc: "Link do site e/ou fotos do produto → IA analisa a marca e gera 1–10 anúncios GPT HQ (50 créditos HQ cada)." },
  { id: "manga_studio", tier: "image", category: "creative", to: "/app/manga-studio",
    name: "MANGA STUDIO", cost: c("mangaPanel", 15), isBeta: true, adminOnly: true,
    desc: "Professional manga/comic studio: characters, poses, scenes, and panels." },
  { id: "wizard", tier: "image", category: "creative", to: "/app/wizard",
    name: "Assistente (5 perguntas)", cost: 0,
    desc: "Não sabes o que pedir? 5 perguntas e o prompt sai pronto." },

  { id: "marketing_video", tier: "video", category: "video", to: "/app/marketing-video",
    name: "Vídeos Marketing IA", cost: costs().marketingVideoByDuration?.[15] ?? 240, isNew: true,
    desc: "1–6 imagens → vídeo vertical de anúncio automático." },
  { id: "motion_flyer", tier: "video", category: "video", to: "/app/motion-flyer",
    name: "Motion Flyer IA", cost: costs().motionFlyerByDuration?.[10] ?? 200, isNew: true,
    desc: "Flyer estático → vídeo motion 10s estilo After Effects." },
];

export default TOOLS;
