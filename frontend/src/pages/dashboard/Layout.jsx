import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import {
  Sparkles, Images, Heart, CreditCard, User, Users, ShieldCheck, LogOut,
  Film, FileText, BookOpen, Menu, Settings, LayoutGrid, Camera, Palette, Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../components/Logo";
import DashboardProfileMenu from "../../components/DashboardProfileMenu";
import { NotificationProvider } from "../../lib/NotificationContext";

const navSpring = { type: "spring", stiffness: 380, damping: 32 };

function SidebarSectionLabel({ children, testId }) {
  return (
    <motion.div
      className="px-6 mb-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      data-testid={testId}
    >
      <p className="text-xs font-medium uppercase tracking-widest text-[#9333EA]/60 mb-2">
        {children}
      </p>
      <motion.div
        className="h-px w-full bg-gradient-to-r from-[#9333EA]/70 via-[#7C3AED]/25 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left" }}
      />
    </motion.div>
  );
}

function SidebarNavItem({ to, icon: Icon, label, badge, onClick, index, testId }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          `group flex items-center gap-3 px-6 py-2.5 text-sm font-medium leading-relaxed transition-all duration-300 border-l-2 rounded-r-xl mr-2 ${
            isActive
              ? "border-[#A855F7] text-white bg-gradient-to-r from-[#7C3AED]/20 via-[#7C3AED]/8 to-transparent shadow-[inset_0_0_24px_-8px_rgba(168,85,247,0.35),0_0_28px_-12px_rgba(168,85,247,0.45)]"
              : "border-transparent text-white/70 hover:text-white hover:translate-x-1 hover:brightness-110"
          }`
        }
        data-testid={testId}
      >
        {({ isActive }) => (
          <>
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors duration-300 ${
                isActive ? "text-[#A855F7]" : "text-white/80 group-hover:text-[#A855F7]"
              }`}
              strokeWidth={1.75}
            />
            <span className="flex items-center gap-2 min-w-0">
              <span className="truncate">{label}</span>
              {badge ? (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-200/90 border border-amber-500/35">
                  {badge}
                </span>
              ) : null}
            </span>
          </>
        )}
      </NavLink>
    </motion.div>
  );
}

export default function DashboardLayout() {
  const { user, refresh, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const isAnimeStudio = location.pathname.includes("/manga-studio");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerCompact, setHeaderCompact] = useState(false);

  const nav = useMemo(() => [
    {
      id: "create",
      title: t("sidebar.create"),
      links: [
        { to: "/app/tools", icon: LayoutGrid, label: t("nav_tools") },
        { to: "/app/generate", icon: Sparkles, label: t("sidebar.generate") },
        { to: "/app/pro", icon: Camera, label: t("sidebar.pro") },
        { to: "/app/artistic", icon: Palette, label: t("sidebar.artistic") },
        { to: "/app/posters", icon: FileText, label: t("sidebar.posters") },
        { to: "/app/video", icon: Film, label: t("sidebar.video") },
        { to: "/app/manga-studio", icon: BookOpen, label: t("sidebar.manga_studio"), badge: t("badge_beta") },
        { to: "/app/wizard", icon: Wand2, label: t("sidebar.wizard") },
      ],
    },
    {
      id: "library",
      title: t("sidebar.library"),
      links: [
        { to: "/app/gallery", icon: Images, label: t("sidebar.gallery") },
        { to: "/app/favorites", icon: Heart, label: t("sidebar.favorites") },
      ],
    },
    {
      id: "account",
      title: t("sidebar.account"),
      links: [
        { to: "/app/billing", icon: CreditCard, label: t("sidebar.billing") },
        { to: "/app/referrals", icon: Users, label: t("sidebar.referrals") },
        { to: "/app/profile", icon: User, label: t("sidebar.profile") },
        { to: "/app/settings", icon: Settings, label: t("sidebar.settings") },
      ],
    },
  ], [t]);

  const flatLinks = useMemo(() => {
    const items = [];
    let i = 0;
    nav.forEach((sec) => {
      sec.links.forEach((l) => {
        items.push({ ...l, sectionId: sec.id, index: i++ });
      });
    });
    if (user?.role === "admin") {
      items.push({
        to: "/app/admin",
        icon: ShieldCheck,
        label: t("nav_admin"),
        sectionId: "admin",
        index: i,
        isAdmin: true,
      });
    }
    return items;
  }, [nav, user?.role, t]);

  useEffect(() => {
    refresh().catch(() => {});
    const interval = setInterval(() => refresh().catch(() => {}), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = useCallback(() => {
    setHeaderCompact(window.scrollY > 24);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  if (!user) return null;

  let linkIndex = 0;

  const SidebarContent = ({ onClick }) => (
    <>
      <motion.div
        className="px-6 h-16 flex items-center flex-shrink-0 sticky top-0 z-10 border-b border-white/[0.06] bg-white/[0.03] backdrop-blur-xl"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Logo to="/app/tools" />
      </motion.div>
      <nav className="flex-1 py-6 overflow-y-auto">
        {nav.map((sec) => (
          <motion.div key={sec.id} className="mb-6" layout>
            <SidebarSectionLabel testId={`sidebar-section-${sec.id}`}>
              {sec.title}
            </SidebarSectionLabel>
            {sec.links.map((l) => {
              const idx = linkIndex++;
              return (
                <SidebarNavItem
                  key={l.to}
                  to={l.to}
                  icon={l.icon}
                  label={l.label}
                  badge={l.badge}
                  onClick={onClick}
                  index={idx}
                  testId={`nav-${l.to.split("/").pop()}`}
                />
              );
            })}
          </motion.div>
        ))}
        {user.role === "admin" && (
          <motion.div className="mb-6" layout>
            <SidebarSectionLabel testId="sidebar-section-admin">
              {t("sidebar_admin_section")}
            </SidebarSectionLabel>
            <SidebarNavItem
              to="/app/admin"
              icon={ShieldCheck}
              label={t("nav_admin")}
              onClick={onClick}
              index={linkIndex}
              testId="nav-admin"
            />
          </motion.div>
        )}
      </nav>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: flatLinks.length * 0.05 + 0.1 }}
        onClick={() => { logout(); navigate("/"); }}
        className="flex items-center gap-3 px-6 py-4 text-white/60 hover:text-white border-t border-white/[0.06] text-sm font-medium transition-all duration-300 hover:translate-x-1"
        data-testid="sidebar-logout"
      >
        <LogOut className="w-4 h-4 text-white/80" strokeWidth={1.75} /> {t("btn_logout")}
      </motion.button>
    </>
  );

  return (
    <NotificationProvider>
    <motion.div
      className="min-h-screen bg-rp-bg flex font-['Inter_Tight'] text-rp-text touch-manipulation"
      data-testid="dashboard-layout"
    >
      <aside className="w-[240px] hidden md:flex flex-col border-r border-white/[0.08] sticky top-0 h-screen bg-white/[0.05] backdrop-blur-xl">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={navSpring}
              className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] border-r border-white/[0.08] flex flex-col z-50 bg-white/[0.05] backdrop-blur-xl"
            >
              <SidebarContent onClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.div className="flex-1 min-w-0 flex flex-col">
        <motion.header
          className={`sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 border-b border-transparent bg-black/40 backdrop-blur-xl transition-shadow duration-300 ${
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
              onClick={() => setMobileOpen(true)}
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
                {user.is_unlimited ? "∞" : user.credits}
              </span>
            </Link>
            <DashboardProfileMenu />
          </div>
        </motion.header>

        <main
          className={
            isAnimeStudio
              ? "flex-1 min-h-0 p-0 overflow-hidden flex flex-col"
              : "flex-1 px-4 sm:px-6 md:px-10 py-8 md:py-12 overflow-x-hidden overscroll-x-none touch-pan-y"
          }
        >
          <Outlet />
        </main>
      </motion.div>
    </motion.div>
    </NotificationProvider>
  );
}
