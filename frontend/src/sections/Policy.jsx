import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

export default function Policy() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-[#F4F1EA] py-24 md:py-32 border-t border-[#E4E4E7]" ref={ref} data-testid="policy-section">
      <div className="max-w-[700px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className="text-[#7C3AED] text-[10px] font-mono font-medium uppercase tracking-[0.2em] mb-4">Our Policy</p>
          <h2 className="text-[#0B0B0C] text-3xl md:text-[44px] font-light tracking-[-0.02em] leading-tight mb-6">
            Credits never expire. Cancel anytime.
          </h2>
          <p className="text-[#52525B] text-[15px] leading-[1.7]">
            Your unused credits stay in your account forever. You can pause, leave, and come back six months later — your balance will be waiting. No subscriptions hidden in the fine print, no auto-renewals unless you choose them.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
