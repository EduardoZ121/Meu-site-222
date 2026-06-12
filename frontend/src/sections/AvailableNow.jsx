import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Wand2, Palette } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { LANDING_AVAILABLE_IDS } from "../lib/landingI18n";
import { getCreditCostsForRegion } from "../lib/pricingRegions";

const EASE = [0.16, 1, 0.3, 1];

const COURSE_ICONS = [Zap, Wand2, Palette];
const COURSE_STYLES = [
  { color: "text-[#C7A77A]", bg: "bg-[#C7A77A]/10" },
  { color: "text-[#7C3AED]", bg: "bg-[#7C3AED]/10" },
  { color: "text-[#8A8A8E]", bg: "bg-[#8A8A8E]/10" },
];

export default function AvailableNow() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const posterCost = getCreditCostsForRegion("intl").posterFast;

  return (
    <section className="relative bg-[#0B0B0C] py-16 md:py-28" ref={ref} data-testid="available-section">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-10 md:mb-16"
        >
          <p className="eyebrow mb-4">{t("available_eyebrow")}</p>
          <h2 className="heading-lg">{t("available_title")}</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LANDING_AVAILABLE_IDS.map((id, i) => {
            const Icon = COURSE_ICONS[i];
            const style = COURSE_STYLES[i];
            const meta = [
              t(`available_${id}_meta1`),
              t(`available_${id}_meta2`),
              t(`available_${id}_meta3`, { n: posterCost }),
            ];
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: EASE }}
                className="card-surface p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-10 h-10 rounded-sm ${style.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${style.color}`} strokeWidth={1.5} />
                  </div>
                  <span className="px-2.5 py-1 rounded-sm border border-[#2E2E30] text-[#5A5A5E] text-[9px] font-mono uppercase tracking-wider">
                    {t("available_label")}
                  </span>
                </div>
                <h3 className="text-[#F4F1EA] text-xl font-medium mb-2">{t(`available_${id}_title`)}</h3>
                <p className="text-[#8A8A8E] text-[14px] leading-relaxed mb-5">{t(`available_${id}_desc`)}</p>
                <div className="flex flex-wrap gap-2">
                  {meta.map((m) => (
                    <span key={m} className="tag-pill">{m}</span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
          className="mt-10 md:mt-16 text-center"
        >
          <p className="eyebrow mb-3">{t("roadmap_eyebrow")}</p>
          <h3 className="text-[#F4F1EA] text-2xl font-light mb-2">{t("roadmap_title")}</h3>
          <p className="text-[#8A8A8E] text-[15px] max-w-[400px] mx-auto">{t("roadmap_body")}</p>
        </motion.div>
      </div>
    </section>
  );
}
