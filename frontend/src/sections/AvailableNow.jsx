import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Wand2, Palette } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

const courses = [
  { icon: Zap, color: "text-[#C7A77A]", bg: "bg-[#C7A77A]/10", label: "Disponível", title: "Edição rápida", desc: "96 estilos aplicados à tua foto em poucos segundos.", meta: ["96 estilos", "Upload de foto", "1 crédito/estilo"] },
  { icon: Wand2, color: "text-[#7C3AED]", bg: "bg-[#7C3AED]/10", label: "Disponível", title: "Modo Pro", desc: "Retratos com realismo e acabamento de estúdio.", meta: ["Presets realistas", "Mood & estilo", "Melhorias"] },
  { icon: Palette, color: "text-[#8A8A8E]", bg: "bg-[#8A8A8E]/10", label: "Disponível", title: "Pôsteres Pro", desc: "44 templates do bot prontos a editar.", meta: ["44 templates", "5 categorias", "desde 24 créditos"] },
];

export default function AvailableNow() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-[#0B0B0C] py-16 md:py-28" ref={ref} data-testid="available-section">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-10 md:mb-16"
        >
          <p className="eyebrow mb-4">Disponível agora</p>
          <h2 className="heading-lg">Pronto quando a ideia aparece.</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courses.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: EASE }}
              className="card-surface p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`w-10 h-10 rounded-sm ${c.bg} flex items-center justify-center`}>
                  <c.icon className={`w-5 h-5 ${c.color}`} strokeWidth={1.5} />
                </div>
                <span className="px-2.5 py-1 rounded-sm border border-[#2E2E30] text-[#5A5A5E] text-[9px] font-mono uppercase tracking-wider">{c.label}</span>
              </div>
              <h3 className="text-[#F4F1EA] text-xl font-medium mb-2">{c.title}</h3>
              <p className="text-[#8A8A8E] text-[14px] leading-relaxed mb-5">{c.desc}</p>
              <div className="flex flex-wrap gap-2">
                {c.meta.map((m) => <span key={m} className="tag-pill">{m}</span>)}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
          className="mt-10 md:mt-16 text-center"
        >
          <p className="eyebrow mb-3">Em evolução</p>
          <h3 className="text-[#F4F1EA] text-2xl font-light mb-2">O roadmap acompanha os criadores.</h3>
          <p className="text-[#8A8A8E] text-[15px] max-w-[400px] mx-auto">As próximas ferramentas são guiadas pelo que a comunidade mais usa e pede.</p>
        </motion.div>
      </div>
    </section>
  );
}
