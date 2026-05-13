import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

const features = [
  {
    eyebrow: "Generate",
    title: "From a sentence to a masterpiece.",
    body: "Type what you imagine. Choose the look — cinematic, editorial, painted, anime, hyperreal. We render it in seconds, in any aspect ratio.",
    tags: ["Grok Imagine", "Flux 2 Klein", "GPT Image 1"],
    image: "/images/generate.jpg",
    imageRight: true,
  },
  {
    eyebrow: "Edit",
    title: "Your face. Studio quality.",
    body: "Upload any photo. Choose between Realism Presets (Cinematic, iPhone, Studio, Ultra-Real), Mood & Style (Editorial, Romantic, Intense, Full Body), or Enhancements (Lighting, Skin, Wardrobe, Eyes, Maximum Detail).",
    tags: ["Realism", "Mood & Style", "Enhancements"],
    image: "/images/edit.jpg",
    imageRight: false,
  },
  {
    eyebrow: "Styles",
    title: "96 looks. One photo.",
    body: "Curated style packs across art history, contemporary cinema, and editorial photography. New styles drop every week.",
    tags: ["96 Styles", "1 Credit/Style", "Weekly Drops"],
    image: "/images/styles-grid.jpg",
    imageRight: true,
  },
  {
    eyebrow: "Motion",
    title: "Stills, into stories.",
    body: "Animate any prompt into a 6-second cinematic clip. Text-to-video or image-to-video. Powered by Grok Imagine Video.",
    tags: ["6-Second Clips", "Text-to-Video", "Image-to-Video"],
    image: "/images/motion.jpg",
    imageRight: false,
  },
  {
    eyebrow: "Design",
    title: "Posters that look hired.",
    body: "44 professional templates across music, events, and editorial. Drop your photo, fill the placeholders, ship.",
    tags: ["44 Templates", "5 Categories", "Instant Fill"],
    image: "/images/posters.jpg",
    imageRight: true,
  },
  {
    eyebrow: "Guided",
    title: "Not sure where to start?",
    body: "The Wizard asks five questions and writes the perfect prompt for you. The Suggest engine drops 20 ideas from any topic.",
    tags: ["5-Step Wizard", "Suggest Engine", "20 Ideas"],
    image: "/images/wizard.jpg",
    imageRight: false,
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="relative bg-[#0B0B0C]" data-testid="features-section">
      {features.map((f) => <FeatureBlock key={f.eyebrow} feature={f} />)}
    </section>
  );
}

function FeatureBlock({ feature }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const imgFirst = !feature.imageRight;

  return (
    <div ref={ref} className="py-16 md:py-24 border-t border-[#2E2E30]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${imgFirst ? "" : "lg:[direction:rtl]"}`}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className={imgFirst ? "" : "lg:[direction:ltr]"}
          >
            <div className="rounded-sm overflow-hidden">
              <img src={feature.image} alt={feature.eyebrow} className="w-full h-full object-cover" loading="lazy" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className={imgFirst ? "" : "lg:[direction:ltr]"}
          >
            <p className="eyebrow mb-4">{feature.eyebrow}</p>
            <h2 className="heading-lg mb-5">{feature.title}</h2>
            <p className="body-text mb-6">{feature.body}</p>
            <div className="flex flex-wrap gap-2">
              {feature.tags.map((t) => <span key={t} className="tag-pill">{t}</span>)}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
