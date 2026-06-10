import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useI18n } from "../lib/i18n";
import HeroBackground from "./HeroBackground";

const EASE = [0.16, 1, 0.3, 1];

export default function Hero() {
  const { t } = useI18n();

  return (
    <section
      className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
      data-testid="hero-section"
    >
      <HeroBackground />

      <div className="hero-content pt-[56px] pb-24">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
          className="hero-tagline"
          data-testid="hero-eyebrow"
        >
          {t("hero_eyebrow")}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: EASE }}
          className="hero-title"
          data-testid="hero-title"
        >
          {t("hero_title_1")}
          <br />
          <span className="hero-title-italic">{t("hero_title_2")}</span> {t("hero_title_3")}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10"
        >
          <Link to="/register" className="hero-cta" data-testid="hero-cta-primary">
            {t("hero_cta_primary")}
          </Link>
          <Link to="/explore" className="hero-cta-ghost" data-testid="hero-cta-secondary">
            {t("hero_cta_secondary")}
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="hero-scroll"
        aria-hidden="true"
      >
        <span className="block text-[10px] tracking-[0.35em] uppercase mb-1">Scroll</span>
        <ChevronDown className="w-5 h-5 mx-auto opacity-70" strokeWidth={1.5} />
      </motion.div>
    </section>
  );
}
