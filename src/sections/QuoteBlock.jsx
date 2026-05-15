import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "../lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

export default function QuoteBlock() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useI18n();

  return (
    <section ref={ref} className="relative bg-rp-bg py-32 md:py-44">
      <div className="container-rp text-center max-w-[900px]">
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.6, ease: EASE }} className="eyebrow mb-10" data-testid="quote-eyebrow">
          A manifesto
        </motion.p>
        <motion.blockquote initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 1, delay: 0.15, ease: EASE }} className="font-heading italic text-3xl sm:text-5xl md:text-6xl text-rp-text font-light leading-[1.15] tracking-[-0.015em] mb-10" data-testid="quote-text">
          “{t("quote_text")}”
        </motion.blockquote>
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }} className="text-rp-mute2 text-[12px] font-mono uppercase tracking-[0.2em]" data-testid="quote-author">
          {t("quote_author")}
        </motion.p>
      </div>
    </section>
  );
}
