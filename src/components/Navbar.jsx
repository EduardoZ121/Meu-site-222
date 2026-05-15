import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { user, logout } = useAuth();
  const { lang, switchLang, t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const langs = [
    { code: "pt", label: "PT" },
    { code: "en", label: "EN" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-rp-bg/80 backdrop-blur-xl border-b border-rp-border" : "bg-transparent"
        }`}
        data-testid="navbar"
      >
        <nav className="container-rp h-[64px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" data-testid="logo-link">
            <span className="font-heading italic text-[22px] text-rp-text leading-none">Remake</span>
            <span className="w-[3px] h-[3px] bg-rp-purple rounded-full" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-rp-mute">Pixel</span>
          </Link>

          <div className="hidden md:flex items-center gap-9">
            <a href="/#pricing" className="text-rp-mute hover:text-rp-text transition-colors text-[12px] font-mono uppercase tracking-[0.18em]" data-testid="nav-pricing">{t("nav_pricing")}</a>
            <a href="/#faq" className="text-rp-mute hover:text-rp-text transition-colors text-[12px] font-mono uppercase tracking-[0.18em]" data-testid="nav-faq">FAQ</a>
            <a href="https://instagram.com/remake_pix" target="_blank" rel="noreferrer" className="text-rp-mute hover:text-rp-text transition-colors text-[12px] font-mono uppercase tracking-[0.18em]">@remake_pix</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setLangOpen((o) => !o)} className="flex items-center gap-1.5 text-rp-mute hover:text-rp-text text-[11px] font-mono uppercase tracking-[0.18em]" data-testid="lang-switcher">
                <Globe className="w-3.5 h-3.5" /> {lang.toUpperCase()}
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 mt-3 bg-rp-surface border border-rp-border min-w-[80px]">
                    {langs.map((l) => (
                      <button key={l.code} onClick={() => { switchLang(l.code); setLangOpen(false); }} className={`block w-full px-4 py-2 text-left text-[11px] font-mono uppercase tracking-[0.18em] hover:bg-white/5 ${lang === l.code ? 'text-rp-lavender' : 'text-rp-mute'}`} data-testid={`lang-${l.code}`}>
                        {l.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <>
                <Link to="/app/generate" className="text-rp-mute hover:text-rp-text text-[11px] font-mono uppercase tracking-[0.18em]" data-testid="nav-dashboard">Studio</Link>
                <button onClick={() => { logout(); navigate("/"); }} className="btn-secondary !py-2 !px-4" data-testid="nav-logout">{t("btn_logout")}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-rp-mute hover:text-rp-text text-[11px] font-mono uppercase tracking-[0.18em]" data-testid="nav-login">{t("nav_login")}</Link>
                <Link to="/register" className="btn-primary !py-2 !px-5" data-testid="nav-signup">{t("nav_signup")}</Link>
              </>
            )}
          </div>

          <button className="md:hidden text-rp-text" onClick={() => setOpen((o) => !o)} data-testid="mobile-menu-toggle">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-rp-bg/98 backdrop-blur-xl md:hidden flex flex-col items-center justify-center gap-8">
            <a href="/#pricing" onClick={() => setOpen(false)} className="font-heading text-3xl text-rp-text">{t("nav_pricing")}</a>
            <a href="/#faq" onClick={() => setOpen(false)} className="font-heading text-3xl text-rp-text">FAQ</a>
            {user ? (
              <>
                <Link to="/app/generate" onClick={() => setOpen(false)} className="font-heading text-3xl text-rp-text">Studio</Link>
                <button onClick={() => { logout(); setOpen(false); navigate("/"); }} className="btn-secondary">{t("btn_logout")}</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="font-heading text-3xl text-rp-text">{t("nav_login")}</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary">{t("nav_signup")}</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
