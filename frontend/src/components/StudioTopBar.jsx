import { useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { getAppRelativePath, getWorkspaceHeaderKey } from "../lib/dashboardRouteMode";
import { useStudioNav } from "../lib/StudioNavContext";
import DashboardProfileMenu from "./DashboardProfileMenu";

/**
 * Cabeçalho do workspace — substitui totalmente o header global (sem menu hamburguer).
 * Mobile: [ ← ] [ título centrado ] [ créditos · perfil ]
 */
export default function StudioTopBar({ titleKey }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { sessionBackHandler } = useStudioNav();
  const labelKey = titleKey || getWorkspaceHeaderKey(pathname);
  const title = t(labelKey) || t("nav_tools");

  const handleBack = useCallback(() => {
    if (typeof sessionBackHandler === "function") {
      sessionBackHandler();
      return;
    }
    const rel = getAppRelativePath(pathname);
    if (rel.startsWith("video/")) {
      navigate("/app/video");
      return;
    }
    navigate("/app/tools");
  }, [sessionBackHandler, pathname, navigate]);

  return (
    <header
      className="rp-studio-top-bar shrink-0 z-50 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 h-14 border-b border-white/[0.08] bg-[#0a0a0f]/98 backdrop-blur-xl w-full max-w-[100vw]"
      data-testid="studio-top-bar"
    >
      <button
        type="button"
        onClick={handleBack}
        className="justify-self-start shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl text-white/80 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors"
        aria-label={t("header.studio_nav_back")}
        data-testid="studio-back"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
      </button>

      <div className="min-w-0 flex flex-col items-center justify-center text-center px-1">
        <p className="hidden md:block text-[10px] font-mono uppercase tracking-[0.18em] text-[#9333EA]/80 truncate max-w-full">
          {t("header.studio_nav_workspace")}
        </p>
        <h1 className="text-white text-[15px] sm:text-[16px] font-semibold truncate max-w-full font-['Inter_Tight'] leading-tight w-full">
          {title}
        </h1>
      </div>

      <div className="justify-self-end flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Link
          to="/app/billing"
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full border border-[#9333EA]/25 bg-white/[0.06] hover:border-[#A855F7]/50 transition-colors min-w-0"
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
