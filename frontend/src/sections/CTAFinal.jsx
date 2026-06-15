import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

export default function CTAFinal() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-[#0B0B0C] py-16 md:py-28 overflow-hidden" ref={ref} data-testid="cta-section">
      <div className="absolute inset-0 z-0">
        <img src="/images/cta-bg.jpg" alt="" className="w-full h-full object-cover opacity-40" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/70 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <p className="eyebrow mb-3 md:mb-4">{t("cta_eyebrow")}</p>
            <h2 className="heading-xl mb-5 md:mb-6">
              {t("cta_title_1")}
              <br />
              <span className="italic font-light">{t("cta_title_2")}</span>
            </h2>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link to="/register" className="btn-primary" data-testid="cta-primary">
                {t("cta_primary")}
              </Link>
              <a href="#pricing" className="btn-secondary" data-testid="cta-secondary">
                {t("cta_secondary")}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
