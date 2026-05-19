import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

export default function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden" data-testid="hero-section">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-bg.jpg?v=8"
          alt=""
          className="w-full h-full object-cover opacity-30 sm:opacity-35"
          style={{ objectPosition: "center 35%" }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C]/85 via-[#0B0B0C]/70 to-[#0B0B0C]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[900px] mx-auto pt-[56px]">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="text-[#7C3AED] text-[10px] font-medium uppercase tracking-[0.25em] mb-8 font-['JetBrains_Mono']"
          data-testid="hero-eyebrow"
        >
          {t("hero_eyebrow")}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45, ease: EASE }}
          className="text-white mb-10"
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontWeight: 700,
            letterSpacing: "-0.035em",
            lineHeight: 1.02,
            fontSize: "clamp(48px, 9vw, 130px)",
          }}
          data-testid="hero-title"
        >
          {t("hero_title_1")}
          <br />
          {t("hero_title_2")}
          <br />
          <span className="italic font-light">{t("hero_title_3a")}</span> {t("hero_title_3b")}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link to="/register" className="btn-primary" data-testid="hero-cta-primary">{t("hero_cta_primary")}</Link>
          <a href="#gallery" className="btn-ghost" data-testid="hero-cta-ghost">{t("hero_cta_secondary")}</a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="w-5 h-5 text-[#5A5A5E]" />
        </motion.div>
      </motion.div>
    </section>
  );
}
