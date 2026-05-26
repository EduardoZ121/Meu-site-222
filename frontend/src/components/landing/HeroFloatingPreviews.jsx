import { motion } from "framer-motion";

const PREVIEWS = [
  { src: "/images/discover/generate.jpg?v=2", alt: "Generate", className: "left-[2%] top-[14%] w-[22%] max-w-[160px] rotate-[-6deg]" },
  { src: "/images/discover/styles.jpg?v=2", alt: "Styles", className: "right-[2%] top-[12%] w-[22%] max-w-[160px] rotate-[5deg]" },
  { src: "/images/discover/video.jpg?v=2", alt: "Video", className: "left-[3%] bottom-[14%] w-[20%] max-w-[150px] rotate-[4deg]" },
  { src: "/images/discover/posters.jpg?v=2", alt: "Posters", className: "right-[3%] bottom-[12%] w-[22%] max-w-[160px] rotate-[-4deg]" },
];

const EASE = [0.16, 1, 0.3, 1];

export default function HeroFloatingPreviews() {
  return (
    <div className="absolute inset-0 z-[1] pointer-events-none hidden xl:block" aria-hidden>
      {PREVIEWS.map((p, i) => (
        <motion.div
          key={p.src}
          className={`absolute ${p.className} rounded-lg overflow-hidden border border-[#7C3AED]/35 shadow-2xl shadow-purple-900/40`}
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.9 + i * 0.15, ease: EASE }}
        >
          <img
            src={p.src}
            alt={p.alt}
            className="w-full h-auto object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C]/60 via-transparent to-transparent" />
        </motion.div>
      ))}
    </div>
  );
}
