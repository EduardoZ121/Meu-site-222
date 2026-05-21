import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import {
  Sparkles, Images, Heart, CreditCard, User, Users, ShieldCheck, LogOut,
  Globe, Film, FileText, Layers, Menu, Settings, LayoutGrid,
} from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "../../components/Logo";

const nav = [
  {
    title: "Criar",
    links: [
      { to: "/app/tools", icon: LayoutGrid, label: "Ferramentas" },
      { to: "/app/generate", icon: Sparkles, label: "Estúdio" },
      { to: "/app/posters", icon: FileText, label: "Pôsteres" },
      { to: "/app/video", icon: Film, label: "Vídeo" },
      { to: "/app/carousel", icon: Layers, label: "Carrossel" },
      { to: "/app/scene-flow", icon: LayoutGrid, label: "Scene Flow" },
    ],
  },
  {
    title: "Biblioteca",
    links: [
      { to: "/app/gallery", icon: Images, label: "Galeria" },
      { to: "/app/favorites", icon: Heart, label: "Favoritos" },
    ],
  },
  {
    title: "Conta",
    links: [
      { to: "/app/billing", icon: CreditCard, label: "Faturação" },
      { to: "/app/referrals", icon: Users, label: "Referrals" },
      { to: "/app/profile", icon: User, label: "Perfil" },
      { to: "/app/settings", icon: Settings, label: "Definições" },
    ],
  },
];

export default function DashboardLayout() {
  const { user, refresh, logout } = useAuth();
  const { lang, switchLang } = useI18n();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    refresh().catch(() => {});
    const interval = setInterval(() => refresh().catch(() => {}), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const SidebarContent = ({ onClick }) => (
    <>
      <div className="px-6 h-[64px] flex items-center flex-shrink-0 sticky top-0 bg-[#0B0B0C] z-10 border-b border-[#2E2E30]">
        <Logo to="/" />
      </div>
      <nav className="flex-1 py-6 overflow-y-auto">
        {nav.map((sec) => (
          <div key={sec.title} className="mb-6">
            <p className="px-6 mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-[#5A5A5E]">{sec.title}</p>
            {sec.links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={onClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-2.5 transition-colors border-l-2 ${
                    isActive
                      ? "border-[#7C3AED] bg-gradient-to-r from-[#7C3AED]/8 to-transparent text-[#C4B5FD]"
                      : "border-transparent text-[#8A8A8E] hover:text-[#F4F1EA]"
                  }`
                }
                data-testid={`nav-${l.to.split("/").pop()}`}
              >
                <l.icon className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-[12px] font-medium font-['Inter_Tight']">{l.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
        {user.role === "admin" && (
          <div className="mb-6">
            <p className="px-6 mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-[#5A5A5E]">Admin</p>
            <NavLink to="/app/admin" onClick={onClick} className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-2.5 transition-colors border-l-2 ${
                isActive ? "border-[#7C3AED] bg-[#7C3AED]/8 text-[#C4B5FD]" : "border-transparent text-[#8A8A8E] hover:text-[#F4F1EA]"
              }`} data-testid="nav-admin">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[12px] font-medium">God Mode</span>
            </NavLink>
          </div>
        )}
      </nav>
      <button
        onClick={() => { logout(); navigate("/"); }}
        className="flex items-center gap-3 px-6 py-4 text-[#8A8A8E] hover:text-[#F4F1EA] border-t border-[#2E2E30] text-[12px] font-medium"
        data-testid="sidebar-logout"
      >
        <LogOut className="w-4 h-4" strokeWidth={1.5} /> Sair
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex font-['Inter_Tight'] text-[#F4F1EA]" data-testid="dashboard-layout">
      {/* Desktop sidebar */}
      <aside className="w-[240px] hidden md:flex flex-col border-r border-[#2E2E30] sticky top-0 h-screen bg-[#0B0B0C]">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} className="md:hidden fixed inset-0 bg-black/60 z-40" />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-[#0B0B0C] border-r border-[#2E2E30] flex flex-col z-50 animate-in slide-in-from-left">
            <SidebarContent onClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-[56px] border-b border-[#2E2E30] bg-[#0B0B0C]/90 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-[#8A8A8E] hover:text-[#F4F1EA] p-1"
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden">
              <Logo to="/" />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => switchLang(lang === "pt" ? "en" : "pt")}
              className="hidden sm:flex items-center gap-1.5 text-[#8A8A8E] hover:text-[#F4F1EA] text-[10px] font-mono uppercase tracking-[0.15em]"
              data-testid="header-lang"
            >
              <Globe className="w-3 h-3" /> {(lang || "pt").toUpperCase()}
            </button>
            <Link
              to="/app/billing"
              className="flex items-center gap-2 px-3 py-1.5 border border-[#2E2E30] hover:border-[#7C3AED]/40 transition-colors"
              data-testid="credits-badge"
            >
              <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#8A8A8E]">Créditos</span>
              <span className="text-[#C4B5FD] text-[15px] font-medium leading-none" data-testid="credits-value">{user.credits}</span>
            </Link>
            <Link
              to="/app/profile"
              className="w-8 h-8 rounded-full bg-[#1A1A1C] border border-[#2E2E30] hover:border-[#7C3AED] flex items-center justify-center text-[#F4F1EA] text-[11px] font-medium transition-colors"
              data-testid="header-avatar"
            >
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 md:px-10 py-8 md:py-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
