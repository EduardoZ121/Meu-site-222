import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useI18n } from "../lib/i18n";
import HeroFloatingPreviews from "../components/landing/HeroFloatingPreviews";
import HeroScrollCue from "../components/landing/HeroScrollCue";

const EASE = [0.16, 1, 0.3, 1];

export default function Hero() {
  const { t } = useI18n();

  return (
    <section
      className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
      data-testid="hero-section"
    >
      {/* Backdrop layers */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-bg.jpg?v=13"
          alt=""
          className="w-full h-full object-cover opacity-[0.38]"
          draggable={false}
        />
        <div className="hero-aurora hero-aurora--static absolute inset-0" aria-hidden />
        {/* Vignette + tighter bottom fade for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C]/85 via-[#0B0B0C]/45 to-[#0B0B0C]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_30%,rgba(124,58,237,0.18),transparent_60%)]" aria-hidden />
      </div>
      <HeroFloatingPreviews />

      <div className="hero-headline-wrap relative z-30 flex flex-col items-center text-center px-6 max-w-[960px] mx-auto pt-[56px]">
        {/* Refined badge eyebrow (replaces the loud uppercase mono strip) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm"
        >
          <Sparkles className="w-3 h-3 text-[#A855F7]" strokeWidth={2} />
          <span className="text-[11px] font-medium text-[#D1D5DB] tracking-wide">
            {t("hero_eyebrow")}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
          className="heading-display mb-6"
        >
          {t("hero_title_1")}
          <br />
          <span className="italic font-light text-rp-lavender">{t("hero_title_2")}</span>{" "}
          {t("hero_title_3")}
        </motion.h1>

        {/* Sub-tagline to add weight + clarity */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
          className="text-[15px] sm:text-[16px] text-[#9CA3AF] max-w-[540px] leading-relaxed mb-10"
        >
          {t("hero_subtitle")}
        </motion.p>

        {/* CTA — single primary, secondary as inline link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
          className="flex flex-col items-center gap-4 w-full max-w-[420px]"
        >
          <Link
            to="/register"
            className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#7C3AED] hover:bg-[#8B47EF] active:scale-[0.98] transition-all duration-200 shadow-[0_10px_40px_-12px_rgba(124,58,237,0.7)] hover:shadow-[0_14px_44px_-10px_rgba(124,58,237,0.85)]"
            data-testid="hero-cta-primary"
          >
            <span className="text-white text-[14px] font-semibold tracking-wide">
              {t("hero_cta_primary")}
            </span>
            <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </Link>

          <div className="flex items-center gap-5 text-[12px] text-[#6B7280]">
            <Link to="/explore" className="hover:text-[#D1D5DB] transition-colors" data-testid="hero-cta-gallery">
              {t("hero_cta_gallery")}
            </Link>
            <span className="w-px h-3 bg-white/10" aria-hidden />
            <Link to="/discover" className="hover:text-[#D1D5DB] transition-colors" data-testid="hero-cta-learn">
              {t("hero_cta_learn")}
            </Link>
          </div>
        </motion.div>

        {/* Subtle trust strip — no cumulative numbers required, just a vibe */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-10 text-[10px] font-mono uppercase tracking-[0.22em] text-[#52525B]"
        >
          {t("hero_trust_strip")}
        </motion.p>
      </div>

      {/* Single scroll cue (replaces the duplicate "See creations / Learn more / Scroll" stack) */}
      <div className="absolute bottom-6 inset-x-0 z-10 flex justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 0.7, ease: EASE }}
          className="pointer-events-auto"
        >
          <HeroScrollCue />
        </motion.div>
      </div>
    </section>
  );
}
