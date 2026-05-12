import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { Sparkles, Images, Heart, CreditCard, User, Users, ShieldCheck, LogOut, Globe, Camera, Palette, Film, FileText, Layers, Wand2, Lightbulb, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { to: "/app/generate", icon: Sparkles, key: "sidebar_generate" },
  { to: "/app/pro", icon: Camera, key: "sidebar_pro" },
  { to: "/app/artistic", icon: Palette, key: "sidebar_artistic" },
  { to: "/app/video", icon: Film, key: "sidebar_video" },
  { to: "/app/posters", icon: FileText, key: "sidebar_posters" },
  { to: "/app/carousel", icon: Layers, key: "sidebar_carousel" },
  { to: "/app/wizard", icon: Wand2, key: "sidebar_wizard" },
  { to: "/app/suggest", icon: Lightbulb, key: "sidebar_suggest" },
  { to: "/app/gallery", icon: Images, key: "sidebar_gallery" },
  { to: "/app/favorites", icon: Heart, key: "sidebar_favorites" },
  { to: "/app/billing", icon: CreditCard, key: "sidebar_billing" },
  { to: "/app/settings", icon: SlidersHorizontal, key: "sidebar_settings" },
  { to: "/app/profile", icon: User, key: "sidebar_profile" },
  { to: "/app/referrals", icon: Users, key: "sidebar_referrals" },
];

export default function DashboardLayout() {
  const { user, refresh, logout } = useAuth();
  const { t, lang, switchLang } = useI18n();
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => {
    refresh().catch(() => {});
    const interval = setInterval(() => refresh().catch(() => {}).then(() => setTick((x) => x + 1)), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-rp-bg flex" data-testid="dashboard-layout">
      <div className="film-grain" />

      {/* Sidebar */}
      <aside className="w-[260px] hidden md:flex flex-col border-r border-rp-border sticky top-0 h-screen overflow-y-auto">
        <Link to="/" className="flex items-center gap-2.5 px-6 h-[64px] border-b border-rp-border flex-shrink-0 sticky top-0 bg-rp-bg z-10">
          <span className="font-heading italic text-[22px] text-rp-text">Remake</span>
          <span className="w-[3px] h-[3px] bg-rp-purple rounded-full" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-rp-mute">Pixel</span>
        </Link>
        <nav className="flex-1 py-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              data-testid={`nav-${l.key.replace('sidebar_', '')}`}
            >
              <l.icon className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em]">{t(l.key)}</span>
            </NavLink>
          ))}
          {user.role === "admin" && (
            <NavLink to="/app/admin" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} data-testid="nav-admin">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em]">{t("sidebar_admin")}</span>
            </NavLink>
          )}
        </nav>
        <button onClick={() => { logout(); navigate("/"); }} className="sidebar-link border-t border-rp-border" data-testid="sidebar-logout">
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em]">{t("btn_logout")}</span>
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-[64px] border-b border-rp-border bg-rp-bg/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10">
          <div className="md:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="font-heading italic text-[20px] text-rp-text">Remake</span>
              <span className="w-[3px] h-[3px] bg-rp-purple rounded-full" />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-5">
            <button onClick={() => switchLang(lang === "pt" ? "en" : "pt")} className="flex items-center gap-1.5 text-rp-mute hover:text-rp-text text-[11px] font-mono uppercase tracking-[0.18em]" data-testid="header-lang">
              <Globe className="w-3.5 h-3.5" /> {lang.toUpperCase()}
            </button>
            <div className="flex items-center gap-3 px-4 py-2 border border-rp-border bg-rp-surface" data-testid="credits-badge">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute">{t("credits")}</span>
              <span className="font-heading text-xl text-rp-lavender leading-none" data-testid="credits-value">{user.credits}</span>
            </div>
            <Link to="/app/profile" className="w-8 h-8 rounded-full bg-rp-surface border border-rp-border flex items-center justify-center text-rp-text text-xs font-mono" data-testid="header-avatar">
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </header>
        <main className="flex-1 px-6 lg:px-10 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
