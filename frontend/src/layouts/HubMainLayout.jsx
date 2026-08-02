import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useStudioScrollToTopOnNavigate } from "../lib/useStudioScrollToTopOnNavigate";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { useProfileDrawer } from "../lib/ProfileDrawerContext";
import Logo from "../components/Logo";
import DashboardProfileMenu from "../components/DashboardProfileMenu";
import NotificationBell from "../components/notifications/NotificationBell";
import { api } from "../lib/api";
import { prefetchGalleryHistory } from "../lib/galleryCache";

/**
 * Layout das páginas hub (ferramentas, galeria, conta…) — header global + conteúdo com padding.
 */
export default function HubMainLayout() {
  useStudioScrollToTopOnNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const { open: profileDrawerOpen } = useProfileDrawer();
  const [headerCompact, setHeaderCompact] = useState(false);
  const mainRef = useRef(null);
  const onProfileRoute = pathname === "/app/profile" || pathname.startsWith("/app/profile/");
  const hideTopBar = onProfileRoute || profileDrawerOpen;

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

  // Prefetch when landing on tools hub / leaving generate routes.
  useEffect(() => {
    if (!user?.id) return undefined;
    const onToolsOrLeavingGen =
      pathname === "/app/tools"
      || pathname.startsWith("/app/tools/")
      || pathname === "/app/generate"
      || pathname.startsWith("/app/generate/");
    if (!onToolsOrLeavingGen && pathname !== "/app/gallery") return undefined;
    const t = window.setTimeout(() => {
      prefetchGalleryHistory(api).catch(() => {});
    }, 400);
    return () => window.clearTimeout(t);
  }, [user?.id, pathname]);

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 h-full" data-testid="hub-main-layout">
      {!hideTopBar ? (
      <header
        className={`rp-hub-header sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 border-b border-transparent backdrop-blur-xl transition-shadow duration-300 shrink-0 ${
          headerCompact
            ? "rp-hub-header--compact h-14"
            : "h-16"
        }`}
        data-testid="dashboard-header"
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#9333EA]/60 to-transparent"
          aria-hidden
        />
        <div className="flex items-center gap-3 md:hidden">
          <Logo to="/app/tools" variant="header" />
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <>
              <Link
                to="/app/billing"
                className="group flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#9333EA]/25 bg-white/[0.06] backdrop-blur-md hover:border-[#A855F7]/50 hover:shadow-[0_0_28px_-8px_rgba(168,85,247,0.5)] transition-all duration-300"
                data-testid="credits-badge"
              >
                <span className="rp-hub-header__credits-label text-[10px] font-mono uppercase tracking-wider">
                  {t("header.credits")}
                </span>
                <span
                  className="text-rp-gold text-base font-semibold leading-none tabular-nums"
                  data-testid="credits-value"
                >
                  {user.is_unlimited ? "∞" : user.credits}
                </span>
              </Link>
              <span className="hidden md:inline-flex">
                <NotificationBell />
              </span>
              <span className="hidden md:inline-flex">
                <DashboardProfileMenu />
              </span>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                data-testid="hub-login"
              >
                {t("nav_login")}
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white px-3.5 py-2 rounded-full border border-[#9333EA]/40 bg-[#9333EA]/15 hover:bg-[#9333EA]/25 transition-colors"
                data-testid="hub-register"
              >
                {t("nav_signup")}
              </Link>
            </>
          )}
        </div>
      </header>
      ) : null}

      <main
        ref={mainRef}
        data-studio-scroll-root=""
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-x-none touch-pan-y px-4 sm:px-6 md:px-10 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-12 ${
          hideTopBar ? "rp-hub-main--bare-top" : "py-8 md:py-12"
        }`}
        data-profile-chrome={hideTopBar ? "bare" : "header"}
      >
        <Outlet />
      </main>
    </div>
  );
}
