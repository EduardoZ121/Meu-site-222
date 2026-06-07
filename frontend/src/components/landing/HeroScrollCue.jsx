import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useI18n } from "../../lib/i18n";

export default function HeroScrollCue() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const scrollDown = () => {
    const next = document.getElementById("home-next");
    if (next) {
      next.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollDown}
      className="hero-scroll-cue group"
      aria-label={t("hero_scroll")}
      data-testid="hero-scroll-cue"
    >
      <motion.span
        className="hero-scroll-cue__icon"
        animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        }
        aria-hidden
      >
        <ChevronDown className="w-5 h-5" strokeWidth={1.75} />
      </motion.span>
      <span className="hero-scroll-cue__label">{t("hero_scroll")}</span>
    </button>
  );
}
