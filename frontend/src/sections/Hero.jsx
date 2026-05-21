import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const EASE = [0.16, 1, 0.3, 1];

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden" data-testid="hero-section">
      <div className="absolute inset-0 z-0">
        <img src="/images/hero-bg.jpg?v=13" alt="" className="w-full h-full object-cover opacity-50" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C]/70 via-[#0B0B0C]/40 to-[#0B0B0C]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[900px] mx-auto pt-[56px]">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="text-[#7C3AED] text-[10px] font-medium uppercase tracking-[0.25em] mb-8 font-['JetBrains_Mono']"
        >
          Para criadores. Para marcas. Para quem publica todos os dias.
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45, ease: EASE }}
          className="heading-display mb-10"
        >
          Transforma ideias em
          <br />
          <span className="italic text-rp-lavender">96</span>
          <br />
          em segundos.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link to="/register" className="btn-primary" data-testid="hero-cta-primary">Começar grátis — 50 créditos</Link>
          <Link to="/explore" className="btn-ghost" data-testid="hero-cta-ghost">Ver galeria</Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span className="text-[#5A5A5E] text-[9px] font-medium uppercase tracking-[0.25em] font-['JetBrains_Mono']">Desliza</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="w-4 h-4 text-[#5A5A5E]" />
        </motion.div>
      </motion.div>
    </section>
  );
}
