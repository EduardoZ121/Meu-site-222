import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";

const EASE = [0.16, 1, 0.3, 1];

const packages = [
  { name: "Starter", price: "5", credits: "120", tagline: "A weekend of experimentation", featured: false },
  { name: "Creator", price: "12", credits: "350", tagline: "A month of consistent output", featured: true },
  { name: "Studio", price: "22", credits: "600", tagline: "Pro workflows, no ceiling", featured: false },
];

const costTable = [
  { action: "IMAGE (Standard)", cost: "10 credits" },
  { action: "IMAGE (Pro Edit)", cost: "18 credits" },
  { action: "IMAGE (Artistic)", cost: "13 credits" },
  { action: "QUICK STYLE", cost: "1 credit" },
  { action: "VIDEO (6s)", cost: "20 credits" },
  { action: "POSTER (Pro)", cost: "15 credits" },
];

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [mode, setMode] = useState("onetime");

  return (
    <section id="pricing" className="relative bg-[#F4F1EA] py-24 md:py-32" ref={ref} data-testid="pricing-section">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-12"
        >
          <p className="text-[#7C3AED] text-[10px] font-mono font-medium uppercase tracking-[0.2em] mb-4">Credits, not subscriptions.</p>
          <h2 className="text-[#0B0B0C] text-3xl md:text-[52px] font-light tracking-[-0.02em] leading-tight">Pay for what you create.</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="flex items-center justify-center mb-10"
        >
          <div className="inline-flex items-center bg-[#E8E4DB] rounded-sm p-0.5">
            <button onClick={() => setMode("onetime")} className={`px-5 py-2 rounded-sm text-[11px] font-mono font-medium transition-all ${mode === "onetime" ? "bg-[#7C3AED] text-white" : "text-[#8A8A8E] hover:text-[#0B0B0C]"}`} data-testid="pricing-onetime">One-time</button>
            <button onClick={() => setMode("monthly")} className={`px-5 py-2 rounded-sm text-[11px] font-mono font-medium transition-all ${mode === "monthly" ? "bg-[#7C3AED] text-white" : "text-[#8A8A8E] hover:text-[#0B0B0C]"}`} data-testid="pricing-monthly">Monthly</button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: EASE }}
              className={`rounded-sm border p-6 ${pkg.featured ? "border-[#7C3AED] bg-white shadow-lg" : "border-[#D4D0C8] bg-white"}`}
              data-testid={`pricing-pkg-${pkg.name.toLowerCase()}`}
            >
              {pkg.featured && (
                <span className="inline-block px-2 py-0.5 bg-[#7C3AED]/10 text-[#7C3AED] text-[9px] font-mono font-medium uppercase tracking-wider mb-4">Most Popular</span>
              )}
              <h3 className="text-[#0B0B0C] text-lg font-medium mb-1">{pkg.name}</h3>
              <div className="flex items-baseline gap-0.5 mb-2">
                <span className="text-[#8A8A8E] text-sm">€</span>
                <span className="text-[#0B0B0C] text-[42px] font-extralight leading-none">{pkg.price}</span>
              </div>
              <p className="text-[#8A8A8E] text-[11px] font-mono uppercase tracking-wider mb-1">{pkg.credits} credits</p>
              <p className="text-[#5A5A5E] text-[13px] mb-6">{pkg.tagline}</p>
              <Link
                to="/register"
                className={`block text-center py-3 text-[11px] font-mono uppercase tracking-[0.08em] transition-all ${pkg.featured ? "bg-[#7C3AED] text-white hover:bg-[#9333EA]" : "border border-[#D4D0C8] text-[#0B0B0C] hover:border-[#0B0B0C]"}`}
              >
                Get {pkg.name}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="text-center text-[#8A8A8E] text-[13px] mb-10 max-w-[480px] mx-auto"
        >
          Every account starts with <span className="text-[#7C3AED] font-medium">30 free credits</span>. Refer a friend, earn 10 more. Cancel anytime — credits never expire.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
          className="border border-[#D4D0C8] rounded-sm overflow-hidden"
        >
          {costTable.map((row, i) => (
            <div
              key={row.action}
              className={`flex items-center justify-between px-5 py-3 ${i < costTable.length - 1 ? "border-b border-[#E8E4DB]" : ""} ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAF7]"}`}
            >
              <span className="font-mono text-[12px] text-[#0B0B0C]">{row.action}</span>
              <span className="font-mono text-[12px] text-[#8A8A8E]">{row.cost}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
