import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "What is Remake Pixel?", a: "AI image studio combining generation, editing, styles, posters, and motion under one credit-based account." },
  { q: "How do credits work?", a: "Each generation costs a fixed amount (e.g., 10 for a standard image, 20 for a video). Buy packs of credits, use them whenever — they never expire." },
  { q: "Do I get free credits?", a: "Yes. Every new account starts with 30 free credits. Enough for 3 standard images." },
  { q: "What models do you use?", a: "A curated stack: Grok Imagine (Replicate), Flux 2 Klein, GPT Image 1, plus Flux Kontext for advanced edits." },
  { q: "Can I use my own photos?", a: "Yes. Pro Mode and Easy Mode work from your uploads. Your photos are private, encrypted, and never used to train models." },
  { q: "What aspect ratios are supported?", a: "1:1, 4:5, 3:4, 9:16, 16:9, 21:9." },
  { q: "Can I sell what I create?", a: "Yes. Full commercial rights on every image you generate from a paid balance." },
  { q: "What's your refund policy?", a: "Credits are non-refundable once used. Unused balances refundable within 14 days. Cancel anytime." },
  { q: "Is there an NSFW filter?", a: "Off by default. The provider decides. Verified users can request adult-content access through the dashboard." },
  { q: "What languages do you support?", a: "English, Português, Español, Français." },
];

const EASE = [0.16, 1, 0.3, 1];

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="relative bg-[#F4F1EA] py-24 md:py-32 border-t border-[#E4E4E7]" ref={ref} data-testid="faq-section">
      <div className="max-w-[700px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-16"
        >
          <h2 className="text-[#0B0B0C] text-3xl md:text-4xl font-light tracking-[-0.02em] mb-4">Got questions?</h2>
          <p className="text-[#8A8A8E] text-lg">We've got answers.</p>
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
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#FAFAF7] transition-colors"
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
