import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import Logo from "../components/Logo";
import DashboardProfileMenu from "../components/DashboardProfileMenu";

const navSpring = { type: "spring", stiffness: 380, damping: 32 };

/**
 * Layout das páginas hub (ferramentas, galeria, conta…) — header global + conteúdo com padding.
 */
export default function HubMainLayout() {
  const { openMobileNav } = useOutletContext() || {};
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [headerCompact, setHeaderCompact] = useState(false);
  const mainRef = useRef(null);

  const onScroll = useCallback(() => {
    const top = mainRef.current?.scrollTop ?? window.scrollY;
    setHeaderCompact(top > 24);
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    onScroll();
    el?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [onScroll]);

  if (authLoading) {
    return <div className="flex-1 min-w-0 bg-rp-bg" data-testid="hub-auth-loading" />;
  }

  if (!user) return null;

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 h-full" data-testid="hub-main-layout">
      <motion.header
        className={`sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 border-b border-transparent bg-black/40 backdrop-blur-xl transition-shadow duration-300 shrink-0 ${
          headerCompact
            ? "h-14 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.65)]"
            : "h-16 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.45)]"
        }`}
        animate={{ height: headerCompact ? 56 : 64 }}
        transition={navSpring}
        data-testid="dashboard-header"
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#9333EA]/60 to-transparent"
          aria-hidden
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openMobileNav?.()}
            className="md:hidden text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <motion.div className="md:hidden" layout>
            <Logo to="/app/tools" variant="header" />
          </motion.div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <Link
            to="/app/billing"
            className="group flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#9333EA]/25 bg-white/[0.06] backdrop-blur-md hover:border-[#A855F7]/50 hover:shadow-[0_0_28px_-8px_rgba(168,85,247,0.5)] transition-all duration-300"
            data-testid="credits-badge"
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 group-hover:text-white/70">
              {t("header.credits")}
            </span>
            <span
              className="text-[#A855F7] text-base font-mono font-semibold leading-none tabular-nums"
              data-testid="credits-value"
            >
              {user.is_unlimited ? "∞" : (user.credits ?? 0)}
            </span>
          </Link>
          <DashboardProfileMenu />
        </div>
      </motion.header>

      <main
        ref={mainRef}
        data-studio-scroll-root=""
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-x-none touch-pan-y px-4 sm:px-6 md:px-10 py-8 md:py-12"
      >
        <Outlet />
      </main>
    </div>
  );
}
