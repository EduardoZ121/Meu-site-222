import { useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useI18n } from "../../lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

function animClass(anim) {
  const map = {
    "reveal-scale": "anim-reveal-scale",
    "clip-reveal": "anim-clip-reveal",
    "float-glow": "anim-float-glow",
    "shimmer-motion": "anim-shimmer-motion",
    "tilt-depth": "anim-tilt-depth",
    "stagger-lines": "anim-stagger-lines",
    "parallax-slide": "anim-parallax-slide",
    "scan-grid": "anim-scan-grid",
  };
  return map[anim] || "anim-reveal-scale";
}

export default function ShowcasePanel({ item, index }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-12%" });
  const [hovered, setHovered] = useState(false);
  const imgFirst = !item.imageRight;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [24, -24]);
  const textY = useTransform(scrollYProgress, [0, 1], [16, -8]);

  const prefix = `showcase_${item.id}`;
  const tags = item.tagKeys.map((k) => t(k));

  return (
    <article
      ref={ref}
      id={item.id}
      className={`py-14 md:py-24 border-t border-[#2E2E30] scroll-mt-24 ${animClass(item.anim)} ${isInView ? "is-inview" : ""}`}
      data-testid={`showcase-${item.id}`}
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <p className="showcase-step-num mb-6 md:mb-8">
          {String(index + 1).padStart(2, "0")} — {t(`${prefix}_eyebrow`)}
        </p>

        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
            imgFirst ? "" : "lg:[direction:rtl]"
          }`}
        >
          <motion.div
            style={{ y: imgY }}
            initial={{ opacity: 0, x: imgFirst ? -80 : 80, scale: 0.94 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 70, damping: 18, mass: 0.8 }}
            className={imgFirst ? "" : "lg:[direction:ltr]"}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div
              className={`showcase-frame ${hovered ? "is-hovered" : ""}`}
            >
              <img
                src={item.image}
                alt={t(`${prefix}_eyebrow`)}
                className="showcase-img"
                loading="lazy"
                draggable={false}
              />
            </div>
          </motion.div>

          <motion.div
            style={{ y: textY }}
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.12, ease: EASE }}
            className={imgFirst ? "" : "lg:[direction:ltr]"}
          >
            <p className="eyebrow mb-3 md:mb-4">{t(`${prefix}_eyebrow`)}</p>
            <h2 className="heading-lg mb-4 md:mb-5">{t(`${prefix}_title`)}</h2>
            <p className="body-text mb-5 md:mb-6">{t(`${prefix}_body`)}</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="tag-pill showcase-tag">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </article>
  );
}
