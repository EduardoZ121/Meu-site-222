import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Camera, Wand2, Film, Layers } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

const features = [
  { Icon: Camera, title: "Pro Edit", body: "Upload a photo. Refine expression, lighting, mood with Flux 2 Klein. Photorealism that survives a magazine print." },
  { Icon: Wand2, title: "Artistic", body: "33 hand-tuned styles — from anime to ukiyo-e — applied without breaking the subject's identity." },
  { Icon: Film, title: "Motion", body: "Turn an idea — or a still — into 6 seconds of cinema with Grok Imagine Video." },
  { Icon: Layers, title: "Posters", body: "44 templates in five families: music, events, before-after, editorial, promo. Fill the placeholders, print." },
];

export default function FeatureSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  return (
    <section ref={ref} id="features" className="relative bg-rp-bg py-32">
      <div className="container-rp">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE }} className="max-w-2xl mb-20">
          <p className="eyebrow mb-5">A complete studio</p>
          <h2 className="heading-xl">Four tools.<br />One <span className="italic text-rp-lavender">canvas</span>.</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-rp-border" data-testid="features-grid">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: EASE }} className="bg-rp-bg p-10 group" data-testid={`feature-${f.title.toLowerCase().replace(/\s/g, '-')}`}>
              <f.Icon className="w-6 h-6 text-rp-lavender mb-8 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
              <h3 className="font-heading text-3xl text-rp-text mb-4 leading-tight">{f.title}</h3>
              <p className="text-rp-mute text-[15px] leading-[1.7]">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
