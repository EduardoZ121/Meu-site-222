import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

export default function DiscoverIntro() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="relative pt-[120px] pb-16 md:pb-24 overflow-hidden border-b border-[#2E2E30]"
      data-testid="discover-intro"
    >
      <div className="discover-mesh" aria-hidden />
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="eyebrow mb-4"
        >
          {t("discover_intro_eyebrow")}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
          className="heading-display max-w-[820px] mb-6"
        >
          {t("discover_intro_title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.16, ease: EASE }}
          className="body-text max-w-[560px] mb-8"
        >
          {t("discover_intro_body")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
          className="flex flex-col sm:flex-row flex-wrap gap-3"
        >
          <Link to="/register" className="btn-primary" data-testid="discover-cta-start">
            {t("hero_cta_primary")}
          </Link>
          <a href="#showcase" className="btn-secondary" data-testid="discover-cta-scroll">
            {t("discover_cta_scroll")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
