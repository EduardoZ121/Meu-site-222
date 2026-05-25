import { motion } from "framer-motion";

const PREVIEWS = [
  { src: "/images/discover/generate.jpg?v=2", alt: "Generate", className: "left-[6%] top-[22%] w-[28%] max-w-[200px] rotate-[-6deg]" },
  { src: "/images/discover/styles.jpg?v=2", alt: "Styles", className: "right-[5%] top-[18%] w-[30%] max-w-[220px] rotate-[5deg]" },
  { src: "/images/discover/video.jpg?v=2", alt: "Video", className: "left-[12%] bottom-[18%] w-[26%] max-w-[190px] rotate-[4deg]" },
  { src: "/images/discover/posters.jpg?v=2", alt: "Posters", className: "right-[8%] bottom-[16%] w-[28%] max-w-[200px] rotate-[-4deg]" },
];

const EASE = [0.16, 1, 0.3, 1];

export default function HeroFloatingPreviews() {
  return (
    <div className="absolute inset-0 z-[5] pointer-events-none hidden lg:block" aria-hidden>
      {PREVIEWS.map((p, i) => (
        <motion.div
          key={p.src}
          className={`absolute ${p.className} rounded-lg overflow-hidden border border-[#7C3AED]/35 shadow-2xl shadow-purple-900/40`}
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.9 + i * 0.15, ease: EASE }}
        >
          <motion.img
            src={p.src}
            alt={p.alt}
            className="w-full h-auto object-cover"
            draggable={false}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C]/60 via-transparent to-transparent" />
        </motion.div>
      ))}
    </div>
  );
}
