import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";

const EASE = [0.16, 1, 0.3, 1];

export default function Founder() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} className="relative bg-rp-bg py-32 md:py-40 border-t border-rp-border">
      <div className="container-rp grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.9, ease: EASE }} className="relative aspect-[3/4] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1770896687186-895de50a4123?crop=entropy&cs=srgb&fm=jpg&q=85&w=900" alt="" className="w-full h-full object-cover grayscale" />
          <div className="absolute inset-0 bg-rp-bg/20" />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.9, delay: 0.15, ease: EASE }}>
          <p className="eyebrow mb-5">A word from the studio</p>
          <h2 className="heading-xl mb-8">Built by people who <span className="italic text-rp-lavender">make things</span>.</h2>
          <p className="body-text mb-5">
            We started Remake Pixel because every other AI image tool felt like a spreadsheet. We wanted a studio: a place where a thought becomes a frame, where Tuesday's idea is Wednesday's poster.
          </p>
          <p className="body-text mb-10">
            Every model we ship has been hand-picked, every preset hand-tuned. No telemetry, no training on your work — just tools that respect the craft.
          </p>
          <Link to="/register" className="btn-secondary" data-testid="founder-cta">Begin your first frame</Link>
        </motion.div>
      </div>
    </section>
  );
}
