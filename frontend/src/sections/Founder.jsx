import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

const stats = [
  { label: "15K+", sub: "Images Generated" },
  { label: "58", sub: "Followers" },
  { label: "4", sub: "Languages" },
  { label: "3", sub: "Modes" },
];

export default function Founder() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="instructor" className="relative bg-[#0B0B0C] py-24 md:py-32 border-t border-[#2E2E30]" ref={ref} data-testid="founder-section">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="aspect-[3/4] rounded-sm overflow-hidden max-w-[380px] border border-[#2E2E30]">
              <img src="/images/founder.jpg" alt="Founder" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {["Brand 1", "Brand 2", "Brand 3", "Brand 4"].map((b) => (
                <span key={b} className="px-3 py-1.5 rounded-sm bg-white/[0.03] border border-[#2E2E30] text-[#5A5A5E] text-[10px] font-mono tracking-wider">{b}</span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          >
            <p className="eyebrow mb-4">Founder</p>
            <h2 className="heading-lg mb-1">[Founder Name]</h2>
            <p className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.15em] mb-8">Founder, Remake Pixel</p>
            <div className="space-y-4 mb-10">
              <p className="body-text">I spent years editing photos by hand — dodging, burning, retouching, color grading. Then AI rewrote the rules.</p>
              <p className="body-text">So I built Remake Pixel: not to replace the craft, but to give it back to anyone who has an idea and no time. Welcome in.</p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="border-t border-[#2E2E30] pt-4">
                  <p className="text-[#F4F1EA] text-lg font-light">{s.label}</p>
                  <p className="text-[#5A5A5E] text-[9px] font-mono uppercase tracking-wider mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
