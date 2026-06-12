import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { LANDING_TRUST_IDS } from "../lib/landingI18n";

const EASE = [0.16, 1, 0.3, 1];

export default function Reviews() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="reviews" className="relative bg-[#F4F1EA] py-16 md:py-28" ref={ref} data-testid="reviews-section">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-[#7C3AED] text-[10px] font-mono font-medium uppercase tracking-[0.2em] mb-8 md:mb-12 text-center"
        >
          {t("trust_eyebrow")}
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LANDING_TRUST_IDS.map((id, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
              className="bg-white rounded-sm border border-[#E4E4E7] p-5 md:p-6"
            >
              <p className="text-[#7C3AED] text-[9px] font-mono uppercase tracking-[0.18em] mb-4">
                {t(`trust_${id}_meta`)}
              </p>
              <h3 className="text-[#0B0B0C] text-xl font-light tracking-[-0.01em] mb-3">
                {t(`trust_${id}_title`)}
              </h3>
              <p className="text-[#52525B] text-[13px] leading-[1.75]">{t(`trust_${id}_body`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
