import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { isWorkspacePath } from "../../lib/dashboardRouteMode";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import {
  Sparkles, Images, Heart, CreditCard, User, Users, ShieldCheck, LogOut,
  Film, FileText, BookOpen, Menu, Settings, LayoutGrid, Camera, Palette, Wand2, Lock,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../../components/Logo";
import { NotificationProvider } from "../../lib/NotificationContext";

const navSpring = { type: "spring", stiffness: 380, damping: 32 };

function SidebarSectionLabel({ children, testId }) {
  return (
    <div className="mb-4" data-testid={testId}>
      <p className="mb-2 text-xs font-medium uppercase tracking-[1px] text-purple-400">
        {children}
      </p>
    </div>
  );
}

function SidebarNavItem({
  to, icon: Icon, label, badge, onClick, index, testId, locked, lockedLabel,
}) {
  if (locked) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="group flex items-center gap-3 border-l-4 border-transparent py-3.5 pl-4 pr-3 text-sm font-medium leading-relaxed text-zinc-500 cursor-not-allowed select-none"
          role="presentation"
          aria-disabled="true"
          data-testid={testId}
        >
          <Lock className="h-5 w-5 shrink-0 text-zinc-600" strokeWidth={1.75} />
          <span className="flex items-center gap-2 min-w-0">
            <span className="truncate">{label}</span>
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-[#2E2E30] text-[#9CA3AF] border border-[#3f3f46]">
              {lockedLabel}
            </span>
          </span>
        </div>
      </motion.div>
    );
  }

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
          `group flex items-center gap-3 border-l-4 py-3.5 pl-4 pr-3 text-sm font-medium leading-relaxed transition-all duration-300 ${
            isActive
              ? "border-purple-500 bg-zinc-900 text-white"
              : "border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
          }`
        }
        data-testid={testId}
      >
        {({ isActive }) => (
          <>
            <Icon
              className={`h-5 w-5 shrink-0 transition-colors duration-300 ${
                isActive ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300"
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const workspaceMode = isWorkspacePath(pathname);

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
        {
          to: "/app/manga-studio",
          icon: BookOpen,
          label: t("sidebar.manga_studio"),
        },
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

  if (!user) return null;

  let linkIndex = 0;

  const SidebarContent = ({ onClick }) => (
    <div className="flex h-full flex-col px-6 py-10">
      <motion.div
        className="mb-8 flex flex-shrink-0 items-center"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Logo to="/app/tools" />
      </motion.div>
      <nav className="flex-1 overflow-y-auto overscroll-contain">
        {nav.map((sec) => (
          <motion.div key={sec.id} className="mb-8" layout>
            <SidebarSectionLabel testId={`sidebar-section-${sec.id}`}>
              {sec.title}
            </SidebarSectionLabel>
            {sec.links.map((l) => {
              const idx = linkIndex++;
              const locked = false;
              return (
                <SidebarNavItem
                  key={l.to}
                  to={l.to}
                  icon={l.icon}
                  label={l.label}
                  badge={locked ? undefined : l.badge}
                  locked={locked}
                  lockedLabel={locked ? t("badge_soon") : undefined}
                  onClick={onClick}
                  index={idx}
                  testId={`nav-${l.to.split("/").pop()}`}
                />
              );
            })}
          </motion.div>
        ))}
        {user.role === "admin" && (
          <motion.div className="mb-8" layout>
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
        className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-6 text-sm font-medium text-zinc-400 transition-all duration-300 hover:text-white"
        data-testid="sidebar-logout"
      >
        <LogOut className="h-5 w-5 shrink-0 text-zinc-500" strokeWidth={1.75} /> {t("btn_logout")}
      </motion.button>
    </div>
  );

  return (
    <NotificationProvider>
      <motion.div
        className={`min-h-screen h-[100dvh] md:min-h-screen bg-rp-bg flex font-['Inter_Tight'] text-rp-text touch-manipulation overflow-hidden w-full max-w-[100vw] ${
          workspaceMode ? "rp-dashboard--workspace" : ""
        }`}
        data-testid="dashboard-layout"
      >
        <aside
          className={`w-[260px] shrink-0 h-full flex-col border-r border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl ${
            workspaceMode ? "hidden" : "hidden md:flex"
          }`}
        >
          <SidebarContent />
        </aside>

        <AnimatePresence>
          {mobileOpen && !workspaceMode && (
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
                className="md:hidden fixed left-0 top-0 bottom-0 z-50 flex w-[300px] flex-col border-r border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl"
              >
                <SidebarContent onClick={() => setMobileOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0 w-full max-w-full flex flex-col min-h-0 h-full overflow-hidden">
          <Outlet context={{ openMobileNav: () => setMobileOpen(true), workspaceMode }} />
        </div>
      </motion.div>
    </NotificationProvider>
  );
}
