import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const words = [
  "The", "camera", "captured.", "The", "pixel", "transforms.",
  "Remake", "Pixel", "is", "where", "your", "image", "becomes",
  "a", "moodboard,", "a", "movie", "still,", "a", "memory", "rewritten."
];

export default function QuoteBlock() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.3"] });

  return (
    <section ref={ref} className="relative bg-[#0B0B0C] py-32 md:py-48" data-testid="quote-section">
      <div className="max-w-[680px] mx-auto px-6">
        <p className="text-[24px] sm:text-[30px] md:text-[38px] font-extralight leading-[1.4] tracking-[-0.01em] font-['Inter_Tight']">
          {words.map((w, i) => {
            const s = i / words.length;
            const e = (i + 1) / words.length;
            return <Word key={i} w={w} p={scrollYProgress} s={s} e={e} />;
          })}
        </p>
      </div>
    </section>
  );
}

function Word({ w, p, s, e }) {
  const o = useTransform(p, [s, e], [0.12, 1]);
  const c = useTransform(p, [s, e], ["rgb(90,90,94)", "rgb(244,241,234)"]);
  const isBold = w === "Remake" || w === "Pixel";
  return (
    <motion.span style={{ opacity: o, color: c }} className={`inline-block mr-[0.3em] ${isBold ? "font-medium" : ""}`}>
      {w}
    </motion.span>
  );
}
