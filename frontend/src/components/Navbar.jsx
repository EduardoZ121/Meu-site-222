import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import Logo from "./Logo";

const navLinks = [
  { label: "Generate", href: "#features" },
  { label: "Edit", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Gallery", href: "/explore" },
];

const languages = ["EN", "PT", "ES", "FR"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, switchLang } = useI18n();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-[#0B0B0C]/90 backdrop-blur-xl border-b border-[#2E2E30]" : "bg-transparent"
        }`}
        data-testid="navbar"
      >
        <nav className="max-w-[1400px] mx-auto px-6 lg:px-10 h-[56px] flex items-center justify-between">
          <Logo to="/" />

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) =>
              l.href.startsWith("/") ? (
                <Link
                  key={l.label}
                  to={l.href}
                  className="text-[#8A8A8E] text-[11px] font-medium uppercase tracking-[0.15em] hover:text-[#F4F1EA] transition-colors duration-300"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-[#8A8A8E] text-[11px] font-medium uppercase tracking-[0.15em] hover:text-[#F4F1EA] transition-colors duration-300"
                >
                  {l.label}
                </a>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#5A5A5E]">
              <Globe className="w-3 h-3" />
              {languages.map((l, i) => (
                <button
                  key={l}
                  onClick={() => switchLang(l.toLowerCase())}
                  className={`text-[10px] font-mono tracking-wider px-1 transition-colors ${
                    (lang || "pt").toUpperCase() === l ? "text-[#7C3AED]" : "hover:text-[#8A8A8E]"
                  }`}
                  data-testid={`lang-${l}`}
                >
                  {l}
                  {i < languages.length - 1 && <span className="ml-1 text-[#2E2E30]">·</span>}
                </button>
              ))}
            </div>
            <Link
              to="/login"
              className="text-[#8A8A8E] text-[11px] font-medium uppercase tracking-[0.1em] hover:text-[#F4F1EA] transition-colors px-3 py-1.5"
              data-testid="nav-login"
            >
              Login
            </Link>
            <Link to="/register" className="btn-primary !px-4 !py-1.5 !text-[10px]" data-testid="nav-signup">
              Start Free
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-[#8A8A8E] hover:text-[#F4F1EA]"
            data-testid="mobile-toggle"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#0B0B0C]/98 backdrop-blur-xl md:hidden pt-[56px]"
          >
            <div className="flex flex-col items-center gap-6 p-8">
              {navLinks.map((l, i) =>
                l.href.startsWith("/") ? (
                  <motion.div
                    key={l.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      to={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-[#8A8A8E] text-lg font-light hover:text-[#7C3AED] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                ) : (
                  <motion.a
                    key={l.label}
                    href={l.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setMobileOpen(false)}
                    className="text-[#8A8A8E] text-lg font-light hover:text-[#7C3AED] transition-colors"
                  >
                    {l.label}
                  </motion.a>
                )
              )}
              <div className="flex gap-2 mt-4">
                {languages.map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLang(l.toLowerCase())}
                    className={`px-3 py-1 text-[10px] font-mono border border-[#2E2E30] ${
                      (lang || "pt").toUpperCase() === l ? "text-[#7C3AED] border-[#7C3AED]/30" : "text-[#5A5A5E]"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-primary mt-4"
              >
                Start Free — 30 Credits
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
