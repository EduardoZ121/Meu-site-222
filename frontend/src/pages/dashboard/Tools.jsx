import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import TOOLS from "../../lib/toolsCatalogue";
import ToolThumb from "../../components/ToolThumb";
import useTitle from "../../lib/useTitle";

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
          {filtered.length} ferramentas de IA prontas a usar. Escolhe uma, envia uma foto (quando necessário) e clica em Create.
        </p>
      </header>

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

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" data-testid="tools-grid">
        {filtered.map((tool, i) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.02, 0.4), ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={tool.to}
              className="block group relative bg-[#13131A] border border-[#2E2E30] hover:border-[#7C3AED]/70 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_-12px_rgba(124,58,237,0.5)]"
              data-testid={`tool-${tool.id}`}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <ToolThumb id={tool.id} name={tool.name} />
                {tool.isNew && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium uppercase tracking-wider bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/40">
                    Novo
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-[#7C3AED]/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-[11px] font-medium uppercase tracking-[0.15em] px-4 py-2 border border-white/60 rounded-full">
                    Abrir →
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-[#F4F1EA] text-[13px] font-medium font-['Inter_Tight'] leading-tight line-clamp-1">{tool.name}</h3>
                {tool.desc && <p className="text-[#5A5A5E] text-[11px] leading-snug mt-1 line-clamp-2">{tool.desc}</p>}
                {tool.cost > 0 ? (
                  <p className="text-[#7C3AED] text-[10px] font-mono uppercase tracking-wider mt-2">{tool.cost} créditos</p>
                ) : (
                  <p className="text-[#C4B5FD] text-[10px] font-mono uppercase tracking-wider mt-2">Grátis</p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
