import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function CTAFinal() {
  return (
    <section className="relative bg-rp-bg py-32 md:py-40 overflow-hidden border-t border-rp-border">
      <div className="absolute inset-0 z-0 opacity-40">
        <img src="https://images.unsplash.com/photo-1773257607064-7c6a4cbb71f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-rp-bg/70 via-rp-bg/85 to-rp-bg" />
      </div>
      <div className="container-rp relative z-10 text-center max-w-[900px]">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="eyebrow mb-8">Begin</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} viewport={{ once: true }} className="heading-display mb-12" data-testid="cta-final-title">
          The next frame is <span className="italic text-rp-lavender">yours</span>.
        </motion.h2>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }} viewport={{ once: true }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary" data-testid="cta-final-primary">Begin free — 50 credits</Link>
          <Link to="/login" className="btn-ghost">I have an account</Link>
        </motion.div>
      </div>
    </section>
  );
}
