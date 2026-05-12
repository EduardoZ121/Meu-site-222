import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useI18n } from "../lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

export default function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1763246508257-5b37ace404b7?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt=""
          className="w-full h-full object-cover opacity-50"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-rp-bg/60 via-rp-bg/40 to-rp-bg" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[1000px] mx-auto pt-[60px]">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: EASE }} className="eyebrow mb-8" data-testid="hero-eyebrow">
          {t("hero_eyebrow")}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.05, delay: 0.45, ease: EASE }} className="heading-display mb-10 text-balance" data-testid="hero-title">
          {t("hero_title_1")}<br />
          <span className="italic font-light text-rp-lavender">{t("hero_title_2")}</span><br />
          {t("hero_title_3")}
        </motion.h1>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7, ease: EASE }} className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/register" className="btn-primary" data-testid="hero-cta-primary">{t("hero_cta_primary")}</Link>
          <a href="#features" className="btn-ghost" data-testid="hero-cta-secondary">{t("hero_cta_secondary")}</a>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <span className="text-rp-mute2 text-[9px] font-mono uppercase tracking-[0.25em]">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="w-4 h-4 text-rp-mute2" />
        </motion.div>
      </motion.div>
    </section>
  );
}
