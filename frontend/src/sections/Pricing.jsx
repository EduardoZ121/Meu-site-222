import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Zap } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

const packages = [
  { name: "Starter", price: "5", credits: "150", tagline: "Promoção de lançamento", featured: false, promo: true },
  { name: "Creator", price: "12", credits: "250", tagline: "Para criar conteúdo de forma consistente", featured: true },
  { name: "Studio", price: "22", credits: "500", tagline: "Para fluxos profissionais e clientes", featured: false },
];

const costTable = [
  { action: "Imagem standard", cost: "12 créditos" },
  { action: "Editar foto com prompt", cost: "16 créditos" },
  { action: "Estilo pronto na foto", cost: "14 créditos" },
  { action: "Retoque Pro", cost: "26 créditos" },
  { action: "Vídeo IA", cost: "70 créditos" },
  { action: "Pôster", cost: "24–45 créditos" },
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
      <div className="relative z-[1] max-w-[1000px] mx-auto px-6 lg:px-10">
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="flex items-center justify-center mb-8 md:mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md px-4 py-2 shadow-[0_0_40px_-12px_rgba(124,58,237,0.35)]">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-rp-purple to-rp-neonFuchsia shadow-[0_0_12px_rgba(192,38,211,0.8)]" />
            <span className="text-[11px] font-mono font-medium uppercase tracking-[0.14em] text-[#d4d4d8]">
              Compra única · sem renovação automática
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-9 md:mb-12">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: EASE }}
              className={`relative rounded-2xl border p-6 md:p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
                pkg.featured
                  ? "border-rp-purple/55 bg-gradient-to-b from-[#181028]/95 via-[#111113]/95 to-[#0a0a0a]/98 shadow-[0_24px_60px_-20px_rgba(124,58,237,0.45)] md:scale-[1.02]"
                  : "border-[#27272a] bg-[#111113]/80 hover:border-[#3f3f46] hover:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)]"
              }`}
              data-testid={`pricing-pkg-${pkg.name.toLowerCase()}`}
            >
              {pkg.promo && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-gradient-to-r from-rp-lavender/90 via-rp-purple to-rp-neonFuchsia px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#050505] shadow-lg shadow-rp-purple/40">
                  <Sparkles className="w-3 h-3" strokeWidth={2.5} /> Promo lançamento
                </div>
              )}
              {pkg.featured && !pkg.promo && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-rp-purple/40 bg-gradient-to-r from-rp-purple to-[#a855f7] px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-rp-purple/50">
                  <Zap className="w-3 h-3" strokeWidth={2.5} /> Mais escolhido
                </div>
              )}

              <h3 className="text-[#fafafa] text-lg font-semibold mb-1 mt-1">{pkg.name}</h3>
              <div className="flex items-baseline gap-0.5 mb-2">
                <span className="text-[#a1a1aa] text-sm">€</span>
                <span className="text-[#fafafa] text-[42px] font-semibold leading-none tracking-tight">{pkg.price}</span>
              </div>
              <p className="text-rp-lavender text-[11px] font-mono uppercase tracking-wider mb-1">{pkg.credits} créditos</p>
              <p className="text-[#a1a1aa] text-[13px] mb-6">{pkg.tagline}</p>
              <Link
                to="/register"
                className={`block text-center py-3.5 rounded-xl text-[11px] font-mono font-semibold uppercase tracking-[0.1em] transition-all duration-200 ${
                  pkg.featured
                    ? "bg-gradient-to-r from-rp-purple via-[#9333ea] to-[#a855f7] text-white shadow-lg shadow-rp-purple/40 hover:scale-[1.03] hover:brightness-110"
                    : "border border-[#3f3f46] text-[#fafafa] bg-white/[0.03] hover:border-rp-purple/60 hover:bg-rp-purple/10 hover:shadow-[0_0_32px_-10px_rgba(124,58,237,0.35)]"
                }`}
              >
                Escolher {pkg.name}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="text-center text-[#a1a1aa] text-[13px] mb-8 md:mb-10 max-w-[480px] mx-auto"
        >
          Todas as contas começam com <span className="text-rp-lavender font-semibold">50 créditos grátis</span>. Convida um amigo e ganha mais créditos. Os créditos comprados não expiram.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
          className="rounded-2xl border border-[#27272a] overflow-hidden bg-[#111113]/60 backdrop-blur-md shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]"
        >
          {costTable.map((row, i) => (
            <div
              key={row.action}
              className={`flex items-center justify-between px-5 py-3.5 ${
                i < costTable.length - 1 ? "border-b border-[#27272a]" : ""
              } ${i % 2 === 0 ? "bg-[#0c0c0e]/80" : "bg-[#111113]/50"}`}
            >
              <span className="font-mono text-[12px] text-[#e4e4e7]">{row.action}</span>
              <span className="font-mono text-[12px] text-[#a1a1aa]">{row.cost}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
