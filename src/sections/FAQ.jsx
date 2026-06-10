import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useI18n } from "../lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

const faqs = [
  { q: "What is Remake Pixel?", a: "An AI image studio combining generation, editing, styles, posters, and motion under one credit-based account." },
  { q: "How do credits work?", a: "Each generation costs a fixed amount (10 for a standard image, 18 for Pro, 20 for video). Buy packs of credits, use them whenever — they never expire." },
  { q: "Do I get free credits?", a: "Yes. Every new account starts with 50 free credits — enough for 5 standard images." },
  { q: "What models do you use?", a: "A curated stack: Grok Imagine (Replicate), Flux 2 Klein, GPT Image 1, plus Flux Kontext for advanced edits." },
  { q: "Can I use my own photos?", a: "Yes. Pro Mode and Artistic Mode work from your uploads. Your photos are private, encrypted, and never used to train models." },
  { q: "Can I sell what I create?", a: "Yes. Full commercial rights on every image you generate from a paid balance." },
  { q: "What's your refund policy?", a: "Credits are non-refundable once used. Unused balances refundable within 14 days. Cancel anytime." },
  { q: "What languages are supported?", a: "Português, English, Español, Français." },
];

export default function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [open, setOpen] = useState(0);
  const { t } = useI18n();

  return (
    <section id="faq" ref={ref} className="relative bg-rp-bg py-32 md:py-40 border-t border-rp-border">
      <div className="container-rp max-w-[860px]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE }} className="text-center mb-20">
          <p className="eyebrow mb-5">FAQ</p>
          <h2 className="heading-xl mb-5" data-testid="faq-title">{t("faq_title")}</h2>
          <p className="body-text">{t("faq_subtitle")}</p>
        </motion.div>

        <div className="divide-y divide-rp-border border-y border-rp-border" data-testid="faq-list">
          {faqs.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.4, delay: i * 0.04 }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between py-6 text-left group" data-testid={`faq-question-${i}`}>
                <span className="font-heading text-xl md:text-2xl text-rp-text group-hover:text-rp-lavender transition-colors pr-6">{f.q}</span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown className="w-4 h-4 text-rp-mute" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                    <p className="text-rp-mute pb-6 leading-relaxed text-[15px]">{f.a}</p>
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
