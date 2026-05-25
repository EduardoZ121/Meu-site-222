import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Film, Palette } from "lucide-react";
import { useI18n } from "../../lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

const cards = [
  { icon: Sparkles, key: "home_card_generate", to: "/discover#showcase" },
  { icon: Palette, key: "home_card_styles", to: "/discover#showcase" },
  { icon: Film, key: "home_card_video", to: "/discover#showcase" },
];

export default function LandingHighlights() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative py-20 md:py-28 border-t border-[#2E2E30] bg-[#0B0B0C]"
      data-testid="landing-highlights"
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] pointer-events-none">
        <div className="landing-pulse-ring w-full h-full" />
      </div>

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 lg:px-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="eyebrow mb-4"
        >
          {t("home_highlights_eyebrow")}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.08, ease: EASE }}
          className="heading-lg mb-4 max-w-[640px] mx-auto"
        >
          {t("home_highlights_title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.14, ease: EASE }}
          className="body-text max-w-[480px] mx-auto mb-12"
        >
          {t("home_highlights_body")}
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {cards.map(({ icon: Icon, key, to }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.2 + i * 0.1, ease: EASE }}
            >
              <Link
                to={to}
                className="card-surface block p-6 text-left h-full hover:border-[#7C3AED]/40 transition-colors duration-300 group"
              >
                <div className="w-10 h-10 rounded-sm bg-[#7C3AED]/15 flex items-center justify-center mb-5 group-hover:bg-[#7C3AED]/25 transition-colors">
                  <Icon className="w-5 h-5 text-[#A855F7]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[#F4F1EA] text-lg font-medium mb-2">{t(`${key}_title`)}</h3>
                <p className="text-[#8A8A8E] text-sm leading-relaxed">{t(`${key}_desc`)}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
        >
          <Link to="/discover" className="btn-ghost-discover inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium uppercase tracking-wider" data-testid="home-learn-more">
            {t("hero_cta_learn")}
            <span aria-hidden>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
