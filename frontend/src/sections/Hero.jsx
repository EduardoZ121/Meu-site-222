import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import HeroFloatingPreviews from "../components/landing/HeroFloatingPreviews";
import HeroScrollCue from "../components/landing/HeroScrollCue";

const EASE = [0.16, 1, 0.3, 1];

export default function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden" data-testid="hero-section">
      <div className="absolute inset-0 z-0">
        <img src="/images/hero-bg.jpg?v=13" alt="" className="w-full h-full object-cover opacity-50" draggable={false} />
        <div className="hero-aurora absolute inset-0" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C]/70 via-[#0B0B0C]/40 to-[#0B0B0C]" />
      </div>
      <HeroFloatingPreviews />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[900px] mx-auto pt-[56px]">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="text-[#7C3AED] text-[10px] font-medium uppercase tracking-[0.25em] mb-8 font-['JetBrains_Mono']"
        >
          {t("hero_eyebrow")}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45, ease: EASE }}
          className="heading-display mb-10"
        >
          {t("hero_title_1")}
          <br />
          <span className="hero-word-art">{t("hero_title_2")}</span>{" "}
          {t("hero_title_3")}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
          className="hero-cta-row flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap"
        >
          <Link to="/register" className="btn-primary btn-hero-primary" data-testid="hero-cta-primary">
            <span className="btn-hero-primary__shine" aria-hidden />
            <span className="btn-hero-primary__text">{t("hero_cta_primary")}</span>
          </Link>
          <Link to="/explore" className="btn-ghost" data-testid="hero-cta-gallery">
            {t("hero_cta_gallery")}
          </Link>
          <Link to="/discover" className="btn-ghost-discover px-5 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider" data-testid="hero-cta-learn">
            {t("hero_cta_learn")}
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-8 inset-x-0 z-10 flex justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.8, ease: EASE }}
          className="pointer-events-auto"
        >
          <HeroScrollCue />
        </motion.div>
      </div>
    </section>
  );
}
