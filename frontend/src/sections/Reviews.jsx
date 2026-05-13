import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const testimonials = [
  { text: "Remake Pixel turned my Instagram into a portfolio. I went from posting twice a week to once a day, and every image looks like it cost €300 to produce.", name: "Marina Costa", role: "Photographer", initials: "MC" },
  { text: "[Testimonial 2 — add your review here]", name: "Name", role: "Role", initials: "N" },
  { text: "[Testimonial 3 — add your review here]", name: "Name", role: "Role", initials: "N" },
  { text: "[Testimonial 4 — add your review here]", name: "Name", role: "Role", initials: "N" },
  { text: "[Testimonial 5 — add your review here]", name: "Name", role: "Role", initials: "N" },
  { text: "[Testimonial 6 — add your review here]", name: "Name", role: "Role", initials: "N" },
  { text: "[Testimonial 7 — add your review here]", name: "Name", role: "Role", initials: "N" },
  { text: "[Testimonial 8 — add your review here]", name: "Name", role: "Role", initials: "N" },
];

const EASE = [0.16, 1, 0.3, 1];

export default function Reviews() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="reviews" className="relative bg-[#F4F1EA] py-24 md:py-32" ref={ref} data-testid="reviews-section">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-[#7C3AED] text-[10px] font-mono font-medium uppercase tracking-[0.2em] mb-12 text-center"
        >
          What creators say
        </motion.p>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
              className="break-inside-avoid bg-white rounded-sm border border-[#E4E4E7] p-5"
            >
              <p className={`${t.text.startsWith("[") ? "text-[#C4C0B8]" : "text-[#3F3F46]"} text-[13px] leading-[1.7] mb-5`}>{t.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-sm bg-[#F4F1EA] flex items-center justify-center">
                  <span className="text-[#8A8A8E] text-[10px] font-semibold font-mono">{t.initials}</span>
                </div>
                <div>
                  <p className="text-[#0B0B0C] text-[12px] font-semibold">{t.name}</p>
                  <p className="text-[#8A8A8E] text-[10px]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
