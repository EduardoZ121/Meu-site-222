import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Zap } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

const packages = [
  { name: "Starter", price: "5", credits: "150", tagline: "Promoção de lançamento", featured: false, promo: true },
  { name: "Creator", price: "10", credits: "345", tagline: "Mais popular · +15% bónus", featured: true },
  { name: "Studio", price: "20", credits: "780", tagline: "Melhor valor · +30% bónus", featured: false },
  { name: "Pro", price: "50", credits: "2100", tagline: "Volume máximo · +40% bónus", featured: false },
];

const costTable = [
  { action: "Gerar imagem (texto)", cost: "18 cr (+3 melhorar · +8 HD)" },
  { action: "Estúdio artístico", cost: "25 cr (+ efeitos premium)" },
  { action: "Retoque Pro", cost: "35 créditos" },
  { action: "Texto / imagem → vídeo", cost: "80 cr (+25 em 8s)" },
  { action: "Editar vídeo", cost: "120 cr (+ HD / duração)" },
  { action: "Pôsteres", cost: "25–40 créditos" },
];

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#050505] py-16 md:py-28 text-[#e4e4e7]"
      ref={ref}
      data-testid="pricing-section"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(124,58,237,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 20%, rgba(192,38,211,0.08), transparent 50%), radial-gradient(ellipse 45% 35% at 0% 60%, rgba(34,211,238,0.06), transparent 45%)",
        }}
      />
      <div className="relative z-[1] max-w-[1100px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-8 md:mb-12"
        >
          <p className="text-rp-lavender text-[10px] font-mono font-semibold uppercase tracking-[0.22em] mb-4">
            Créditos, não subscrições.
          </p>
          <h2 className="text-[#fafafa] text-3xl md:text-[52px] font-semibold tracking-[-0.03em] leading-tight">
            Paga apenas pelo que crias.
          </h2>
          <p className="text-[#8A8A8E] text-[15px] mt-4 max-w-[560px] mx-auto">
            Taxa base 30 créditos/€. Pacotes maiores incluem bónus progressivo — até 42 cr/€ no Pro.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`rounded-2xl border p-6 backdrop-blur-md transition-all ${
                pkg.featured
                  ? "border-[#7C3AED] bg-gradient-to-br from-[#1B0D3A]/80 to-[#0a0a0a] shadow-[0_0_50px_-15px_rgba(124,58,237,0.5)]"
                  : "border-[#2E2E30] bg-[#0a0a0a]/60"
              }`}
            >
              {pkg.promo && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C4B5FD] mb-2 block">Promo</span>
              )}
              <h3 className="text-[#fafafa] text-xl font-semibold mb-1">{pkg.name}</h3>
              <p className="text-[#7C3AED] text-[11px] mb-4">{pkg.tagline}</p>
              <p className="text-[#fafafa] text-4xl font-light mb-1">€{pkg.price}</p>
              <p className="text-[#C4B5FD] text-sm font-medium">{pkg.credits} créditos</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          className="rounded-2xl border border-[#2E2E30] bg-[#0a0a0a]/80 p-6 md:p-8 mb-10"
        >
          <h3 className="text-[#fafafa] text-lg font-semibold mb-4">Custos por ferramenta (exemplos)</h3>
          <ul className="space-y-2">
            {costTable.map((row) => (
              <li key={row.action} className="flex justify-between gap-4 text-[14px]">
                <span className="text-[#a1a1aa]">{row.action}</span>
                <span className="text-[#C4B5FD] font-mono shrink-0">{row.cost}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/app/billing"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333ea] text-white text-sm font-semibold uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Zap className="w-4 h-4" /> Comprar créditos
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[#3f3f46] text-[#e4e4e7] text-sm font-medium hover:border-[#7C3AED]/50 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Começar grátis
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
