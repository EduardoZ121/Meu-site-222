import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "../lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

export default function InsideRemakePixel() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-[#0B0B0C] py-16 md:py-28 border-t border-[#2E2E30]" ref={ref} data-testid="inside-section">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="rounded-sm overflow-hidden border border-[#2E2E30]">
              <img src="/images/discover/generate.jpg" alt="" className="w-full object-cover" loading="lazy" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          >
            <p className="eyebrow mb-3 md:mb-4">{t("inside_eyebrow")}</p>
            <h2 className="heading-lg mb-4 md:mb-5">{t("inside_title")}</h2>
            <p className="body-text">{t("inside_body")}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
