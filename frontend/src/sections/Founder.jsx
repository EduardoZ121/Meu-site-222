import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

const stats = [
  { label: "96", sub: "Estilos" },
  { label: "13", sub: "Ferramentas" },
  { label: "4", sub: "Idiomas" },
  { label: "30", sub: "Créditos grátis" },
];

export default function Founder() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="founder" className="relative bg-[#0B0B0C] py-16 md:py-28 border-t border-[#2E2E30]" ref={ref} data-testid="founder-section">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="aspect-[3/4] rounded-sm overflow-hidden max-w-[320px] md:max-w-[380px] border border-[#2E2E30]">
              <img src="/images/founder.jpg" alt="Remake Pixel studio" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="flex flex-wrap gap-2 mt-4 md:mt-6">
              {["IA aplicada", "Design editorial", "Conteúdo social", "Fluxos por créditos"].map((b) => (
                <span key={b} className="px-3 py-1.5 rounded-sm bg-white/[0.03] border border-[#2E2E30] text-[#5A5A5E] text-[10px] font-mono tracking-wider">{b}</span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          >
            <p className="eyebrow mb-3 md:mb-4">Visão</p>
            <h2 className="heading-lg mb-1">Criado para transformar ideias em ativos visuais.</h2>
            <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.15em] mb-6 md:mb-8">Remake Pixel · Estúdio criativo com IA</p>
            <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
              <p className="body-text">O Remake Pixel existe para reduzir a distância entre uma boa ideia e uma imagem com acabamento profissional.</p>
              <p className="body-text">Em vez de dezenas de apps soltas, junta geração, edição, estilos, pôsteres, vídeo e ferramentas rápidas num fluxo simples, visual e pronto para publicação.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="border-t border-[#2E2E30] pt-4">
                  <p className="text-[#F4F1EA] text-lg font-light">{s.label}</p>
                  <p className="text-[#5A5A5E] text-[9px] font-mono uppercase tracking-wider mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
