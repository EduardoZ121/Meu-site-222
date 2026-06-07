import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

export default function Policy() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-[#F4F1EA] py-14 md:py-24 border-t border-[#E4E4E7]" ref={ref} data-testid="policy-section">
      <div className="max-w-[700px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className="text-[#7C3AED] text-[10px] font-mono font-medium uppercase tracking-[0.2em] mb-3 md:mb-4">Política simples</p>
          <h2 className="text-[#0B0B0C] text-3xl md:text-[44px] font-light tracking-[-0.02em] leading-tight mb-4 md:mb-6">
            Créditos sem validade curta. Sem subscrição obrigatória.
          </h2>
          <p className="text-[#52525B] text-[15px] leading-[1.7]">
            Os créditos comprados ficam na tua conta até serem usados. Podes parar, voltar mais tarde e continuar com o saldo disponível. Nada de renovações escondidas ou letra pequena.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
