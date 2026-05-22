import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { getWorkspaceHeaderKey } from "../lib/dashboardRouteMode";
import DashboardProfileMenu from "./DashboardProfileMenu";

/**
 * Cabeçalho exclusivo do modo workspace — substitui o header global do hub.
 */
export default function StudioTopBar({ titleKey, onOpenNav, showNavButton = false }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const labelKey = titleKey || getWorkspaceHeaderKey(pathname);
  const title = t(labelKey) || t("nav_tools");

  return (
    <header
      className="shrink-0 z-50 flex items-center justify-between gap-3 px-4 md:px-6 h-14 border-b border-white/[0.08] bg-[#0a0a0f]/95 backdrop-blur-xl"
      data-testid="studio-top-bar"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showNavButton && (
          <button
            type="button"
            onClick={onOpenNav}
            className="md:hidden shrink-0 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label={t("nav_tools")}
            data-testid="studio-mobile-nav"
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate("/app/tools")}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors"
          data-testid="studio-back"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          <span className="hidden sm:inline">{t("header.studio_nav_back")}</span>
        </button>
        <div className="min-w-0 border-l border-white/[0.08] pl-3 ml-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#9333EA]/80 truncate">
            {t("header.studio_nav_workspace")}
          </p>
          <h1 className="text-white text-[15px] sm:text-[16px] font-semibold truncate font-['Inter_Tight'] leading-tight">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          to="/app/billing"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#9333EA]/25 bg-white/[0.06] hover:border-[#A855F7]/50 transition-colors"
          data-testid="studio-credits-badge"
        >
          <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider text-white/50">
            {t("header.credits")}
          </span>
          <span className="text-[#A855F7] text-sm font-mono font-semibold tabular-nums">
            {user?.is_unlimited ? "∞" : user?.credits ?? 0}
          </span>
        </Link>
        <DashboardProfileMenu />
      </div>
    </header>
  );
}
