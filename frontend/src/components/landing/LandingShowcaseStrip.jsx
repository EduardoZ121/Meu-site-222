import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n";

const STRIP_IMAGES = [
  "/images/discover/generate.jpg?v=2",
  "/images/discover/edit.jpg?v=2",
  "/images/discover/styles.jpg?v=2",
  "/images/discover/video.jpg?v=2",
  "/images/discover/posters.jpg?v=2",
  "/images/discover/manga.jpg?v=2",
];

export default function LandingShowcaseStrip() {
  const { t } = useI18n();
  const doubled = [...STRIP_IMAGES, ...STRIP_IMAGES];

  return (
    <section id="home-next" className="relative py-12 border-t border-[#2E2E30] overflow-hidden bg-[#08080a] scroll-mt-4" data-testid="landing-showcase-strip">
      <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/10 via-transparent to-[#C026D3]/10 pointer-events-none" />
      <p className="text-center eyebrow mb-8 relative z-10">{t("home_strip_eyebrow")}</p>
      <div className="landing-marquee-track flex gap-4 w-max">
        {doubled.map((src, i) => (
          <motion.div
            key={`${src}-${i}`}
            className="shrink-0 w-[280px] md:w-[340px] rounded-lg overflow-hidden border border-[#2E2E30] hover:border-[#7C3AED]/50 transition-colors"
            whileHover={{ scale: 1.03, y: -4 }}
          >
            <img src={src} alt="" className="w-full aspect-[16/10] object-cover" loading="lazy" draggable={false} />
          </motion.div>
        ))}
      </div>
      <div className="text-center mt-10 relative z-10">
        <Link to="/discover" className="btn-primary" data-testid="home-strip-cta">
          {t("hero_cta_learn")} →
        </Link>
      </div>
    </section>
  );
}
