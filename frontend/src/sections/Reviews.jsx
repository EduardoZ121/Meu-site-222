import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const trustCards = [
  {
    title: "Sem marca de água",
    body: "As imagens finais ficam prontas para publicar, apresentar a clientes ou usar em campanhas.",
    meta: "Output limpo",
  },
  {
    title: "Créditos transparentes",
    body: "Cada ferramenta mostra o custo antes de gerar. Compras créditos quando precisas, sem mensalidade obrigatória.",
    meta: "Sem surpresas",
  },
  {
    title: "Feito para criadores reais",
    body: "Retratos, pôsteres, carrosséis, vídeos e estilos rápidos num fluxo pensado para Instagram, marcas e portfólios.",
    meta: "Produção diária",
  },
  {
    title: "Privacidade por padrão",
    body: "As tuas fotos entram no fluxo de criação para gerar o resultado pedido, sem treinar modelos com o teu conteúdo.",
    meta: "Controlo do utilizador",
  },
  {
    title: "Modelos premium",
    body: "Um stack curado com motores internos para geração rápida, qualidade pro, premium, vídeo e utilidades especializadas.",
    meta: "IA selecionada",
  },
  {
    title: "Pronto para evoluir",
    body: "Novos estilos, templates e ferramentas podem entrar sem mudar a forma como crias. O estúdio cresce contigo.",
    meta: "Evolução contínua",
  },
];

const EASE = [0.16, 1, 0.3, 1];

export default function Reviews() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="reviews" className="relative bg-[#F4F1EA] py-16 md:py-28" ref={ref} data-testid="reviews-section">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-[#7C3AED] text-[10px] font-mono font-medium uppercase tracking-[0.2em] mb-8 md:mb-12 text-center"
        >
          Porque transmite confiança
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trustCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
              className="bg-white rounded-sm border border-[#E4E4E7] p-5 md:p-6"
            >
              <p className="text-[#7C3AED] text-[9px] font-mono uppercase tracking-[0.18em] mb-4">{card.meta}</p>
              <h3 className="text-[#0B0B0C] text-xl font-light tracking-[-0.01em] mb-3">{card.title}</h3>
              <p className="text-[#52525B] text-[13px] leading-[1.75]">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
