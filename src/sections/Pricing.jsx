import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useI18n } from "../lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

const packages = [
  { id: "starter", name: "Starter", price: "5", credits: 120, tagline: "A weekend of experimentation", featured: false, perks: ["120 credits", "All models", "Commercial rights"] },
  { id: "creator", name: "Creator", price: "12", credits: 350, tagline: "A month of consistent output", featured: true, perks: ["350 credits", "Priority queue", "Commercial rights", "Save styles"] },
  { id: "studio",  name: "Studio",  price: "22", credits: 600, tagline: "Pro workflows, no ceiling",   featured: false, perks: ["600 credits", "All of Creator", "Bulk export", "Concierge support"] },
];

const costs = [
  { action: "Image — Standard", cost: "10 credits" },
  { action: "Image — Pro Edit",  cost: "18 credits" },
  { action: "Image — Artistic",  cost: "13 credits" },
  { action: "Quick Style (Fast)", cost: "11 credits" },
  { action: "Video (~6s)",       cost: "20 credits" },
  { action: "Poster (Pro)",      cost: "15 credits" },
];

export default function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { t } = useI18n();
  return (
    <section id="pricing" className="relative bg-rp-bg py-32 md:py-40" ref={ref}>
      <div className="container-rp">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE }} className="text-center mb-20 max-w-2xl mx-auto">
          <p className="eyebrow mb-5">{t("pricing_eyebrow")}</p>
          <h2 className="heading-xl mb-6" data-testid="pricing-title">{t("pricing_title")}</h2>
          <p className="body-text">{t("pricing_subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rp-border max-w-[1000px] mx-auto mb-16" data-testid="pricing-grid">
          {packages.map((pkg, i) => (
            <motion.div key={pkg.id} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.12 + i * 0.08, ease: EASE }} className={`relative bg-rp-bg p-10 flex flex-col ${pkg.featured ? 'md:scale-[1.03] md:z-10 bg-rp-surface' : ''}`} data-testid={`pricing-card-${pkg.id}`}>
              {pkg.featured && (
                <span className="absolute top-6 right-6 px-2.5 py-1 bg-rp-purple/15 text-rp-lavender text-[9px] font-mono uppercase tracking-[0.18em]">Most chosen</span>
              )}
              <h3 className="font-heading text-3xl text-rp-text mb-1">{pkg.name}</h3>
              <p className="text-rp-mute2 text-[12px] font-mono uppercase tracking-[0.16em] mb-8">{pkg.tagline}</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-rp-mute text-base">€</span>
                <span className="font-heading text-[64px] leading-none text-rp-text">{pkg.price}</span>
              </div>
              <p className="text-rp-mute text-[12px] font-mono uppercase tracking-[0.16em] mb-10">{pkg.credits} credits</p>
              <ul className="space-y-3 mb-10 flex-1">
                {pkg.perks.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[14px] text-rp-text/85">
                    <Check className="w-3.5 h-3.5 mt-1 text-rp-lavender flex-shrink-0" strokeWidth={2} />
                    {p}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={pkg.featured ? "btn-primary w-full" : "btn-secondary w-full"} data-testid={`buy-${pkg.id}`}>
                Get {pkg.name}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.45, ease: EASE }} className="max-w-[680px] mx-auto border border-rp-border" data-testid="cost-table">
          <div className="px-6 py-4 border-b border-rp-border">
            <p className="eyebrow">{t("cost_table_title")}</p>
          </div>
          {costs.map((row, i) => (
            <div key={row.action} className={`flex items-center justify-between px-6 py-4 ${i < costs.length - 1 ? "border-b border-rp-border" : ""}`}>
              <span className="font-mono text-[12px] text-rp-text/85">{row.action}</span>
              <span className="font-mono text-[12px] text-rp-mute">{row.cost}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
