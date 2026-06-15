import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { LANDING_FAQ_IDS } from "../lib/landingI18n";
import { getCreditCostsForRegion } from "../lib/pricingRegions";

const EASE = [0.16, 1, 0.3, 1];

export default function FAQ() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [open, setOpen] = useState(null);
  const imageCost = getCreditCostsForRegion("intl").image;

  const faqs = LANDING_FAQ_IDS.map((id) => ({
    q: t(`landing_faq_${id}_q`),
    a: t(`landing_faq_${id}_a`, { image: imageCost }),
  }));

  return (
    <section id="faq" className="relative bg-[#F4F1EA] py-16 md:py-28 border-t border-[#E4E4E7]" ref={ref} data-testid="faq-section">
      <div className="max-w-[700px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-[#0B0B0C] text-3xl md:text-4xl font-light tracking-[-0.02em] mb-3 md:mb-4">
            {t("faq_title")}
          </h2>
          <p className="text-[#8A8A8E] text-lg">{t("faq_subtitle")}</p>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.02, ease: EASE }}
              className="bg-white rounded-sm border border-[#E4E4E7] overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-3.5 md:p-4 text-left hover:bg-[#FAFAF7] transition-colors"
                data-testid={`faq-q-${i}`}
              >
                <span className="text-[#0B0B0C] text-[13px] font-medium pr-4">{f.q}</span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.3 }} className="flex-shrink-0">
                  <ChevronDown className="w-4 h-4 text-[#8A8A8E]" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-[#52525B] text-[13px] leading-[1.7]">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
