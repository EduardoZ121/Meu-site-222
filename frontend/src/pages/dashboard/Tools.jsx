import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import useTitle from "../../lib/useTitle";

/**
 * Catalogue of every tool the user can open.
 * `to` is the in-app route; `cost` is shown on the card.
 * `tier`: "image" | "video"; "isNew": optional badge.
 */
const TOOLS = [
  // ───── IMAGE ────────────────────────────────────────────────────
  {
    id: "studio", tier: "image", to: "/app/generate",
    name: "Estúdio (Cria do zero)",
    cost: 10,
    desc: "Texto, foto + prompt ou estilo pronto.",
    poster: "/images/styles-grid.jpg",
  },
  {
    id: "easy", tier: "image", to: "/app/generate?mode=easy",
    name: "Estilos Prontos",
    cost: 11,
    desc: "96 estilos: cinema, editorial, lifestyle, sensual.",
    poster: "/images/edit.jpg",
  },
  {
    id: "pro", tier: "image", to: "/app/pro",
    name: "Pro Mode — Retoque",
    cost: 18,
    desc: "20 presets: realismo, estilo, enhancements.",
    poster: "/images/generate.jpg",
  },
  {
    id: "posters", tier: "image", to: "/app/posters",
    name: "Pôsteres Profissionais",
    cost: 15, isNew: true,
    desc: "44 templates: música, eventos, editorial, promo.",
    poster: "/images/posters.jpg",
  },
  {
    id: "artistic", tier: "image", to: "/app/artistic",
    name: "Estilo Artístico",
    cost: 13,
    desc: "Pintura digital, watercolor, anime, oil paint.",
    poster: "/images/cta-astronaut.jpg",
  },
  {
    id: "bg_remove", tier: "image", to: "/app/tools/bg-remove",
    name: "Remover Fundo",
    cost: 5, isNew: true,
    desc: "Recorte limpo com transparência.",
    poster: "/images/workflows.jpg",
  },
  {
    id: "upscale", tier: "image", to: "/app/tools/upscale",
    name: "Aumentar Resolução",
    cost: 8, isNew: true,
    desc: "Upscale 2× ou 4× preservando detalhes.",
    poster: "/images/courses-portal.jpg",
  },
  {
    id: "restore", tier: "image", to: "/app/tools/restore",
    name: "Restaurar Fotos Antigas",
    cost: 8, isNew: true,
    desc: "Fotos antigas: rostos nítidos, alta qualidade.",
    poster: "/images/edit.jpg",
  },
  {
    id: "colorize", tier: "image", to: "/app/tools/colorize",
    name: "Colorir P&B",
    cost: 6, isNew: true,
    desc: "Foto preto-e-branco → cor realista.",
    poster: "/images/founder.jpg",
  },
  {
    id: "inpaint", tier: "image", to: "/app/tools/inpaint",
    name: "Inpaint / Remover Objeto",
    cost: 12, isNew: true,
    desc: "Apaga ou substitui qualquer parte.",
    poster: "/images/wizard.jpg",
  },
  {
    id: "carousel", tier: "image", to: "/app/carousel",
    name: "Carrossel Instagram",
    cost: 8,
    desc: "Multi-slide com estilo consistente.",
    poster: "/images/styles-grid.jpg",
  },
  {
    id: "wizard", tier: "image", to: "/app/wizard",
    name: "Assistente (5 perguntas)",
    cost: 0,
    desc: "Não sabes o que pedir? Respondes 5 e o prompt sai pronto.",
    poster: "/images/wizard.jpg",
  },

  // ───── VIDEO ────────────────────────────────────────────────────
  {
    id: "video", tier: "video", to: "/app/video",
    name: "Texto / Foto → Vídeo",
    cost: 20,
    desc: "Clipe cinematográfico de 6 segundos.",
    poster: "/images/motion.jpg",
  },
];

export default function Tools() {
  useTitle("Ferramentas");
  const [tab, setTab] = useState("image");
  const filtered = TOOLS.filter((t) => t.tier === tab);

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="tools-page">
      <header className="mb-10">
        <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-[0.22em] mb-3">Ferramentas</p>
        <h1 className="text-[#F4F1EA] text-[40px] md:text-[56px] font-light tracking-[-0.02em] leading-[1.05] mb-4 font-['Inter_Tight']">
          Tudo o que precisas.
        </h1>
        <p className="text-[#8A8A8E] text-[16px] max-w-[600px]">
          Estúdio completo de imagem e vídeo. Escolhe a ferramenta, envia uma foto (se for o caso), e clica em Create.
        </p>
      </header>

      {/* Tabs */}
      <div className="inline-flex items-center bg-[#13131A] border border-[#2E2E30] rounded-full p-1 mb-10" data-testid="tools-tabs">
        <button
          onClick={() => setTab("image")}
          className={`px-6 py-2.5 rounded-full text-[13px] font-medium transition-all ${
            tab === "image" ? "bg-[#F4F1EA] text-[#0B0B0C]" : "text-[#8A8A8E] hover:text-[#F4F1EA]"
          }`}
          data-testid="tab-image"
        >
          Image Tools
        </button>
        <button
          onClick={() => setTab("video")}
          className={`px-6 py-2.5 rounded-full text-[13px] font-medium transition-all ${
            tab === "video" ? "bg-[#F4F1EA] text-[#0B0B0C]" : "text-[#8A8A8E] hover:text-[#F4F1EA]"
          }`}
          data-testid="tab-video"
        >
          Video Tools
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="tools-grid">
        {filtered.map((tool, i) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={tool.to}
              className="block group relative bg-[#13131A] border border-[#2E2E30] hover:border-[#7C3AED]/60 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(124,58,237,0.4)] hover:-translate-y-1"
              data-testid={`tool-${tool.id}`}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[#1A1A1C]">
                {tool.poster && (
                  <img
                    src={tool.poster}
                    alt={tool.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-transparent to-transparent" />
                {tool.isNew && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-[#7C3AED] text-white">
                    Novo
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-[#7C3AED]/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-[12px] font-medium uppercase tracking-[0.15em] px-5 py-2.5 border border-white/50 rounded-full">
                    Use This Tool →
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-[#F4F1EA] text-[14px] font-medium mb-1 font-['Inter_Tight'] leading-tight">{tool.name}</h3>
                <p className="text-[#8A8A8E] text-[12px] leading-snug mb-2 line-clamp-1">{tool.desc}</p>
                {tool.cost > 0 ? (
                  <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-wider">{tool.cost} créditos</p>
                ) : (
                  <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-wider">Grátis</p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
