import { useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Crown } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { getAppRelativePath, getWorkspaceHeaderKey } from "../lib/dashboardRouteMode";
import { useStudioNav } from "../lib/StudioNavContext";
import DashboardProfileMenu from "./DashboardProfileMenu";
import NotificationBell from "./notifications/NotificationBell";

/**
 * Cabeçalho do workspace — substitui totalmente o header global (sem menu hamburguer).
 * Mobile: [ ← ] [ título centrado ] [ créditos · perfil ]
 */
export default function StudioTopBar({ titleKey }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { performStudioBack } = useStudioNav();
  const labelKey = titleKey || getWorkspaceHeaderKey(pathname);
  const title = t(labelKey) || t("nav_tools");
  const rel = getAppRelativePath(pathname);
  const onHqWallet = rel.startsWith("posters")
    || rel.startsWith("gpt-hq-studio")
    || rel.startsWith("brand-campaign");
  const showHqBadge = onHqWallet || (user?.premium_credits ?? 0) > 0 || user?.is_unlimited;

  const handleBack = useCallback(() => {
    // Um passo só — nunca history.back() aqui (no APK isso saltava várias sessões).
    if (performStudioBack()) return;
    if (rel.startsWith("video/")) {
      navigate("/app/video");
      return;
    }
    navigate("/app/tools");
  }, [performStudioBack, rel, navigate]);

  const stdLabel = t("header.credits") || t("header_credits") || "Créditos";
  const hqLabel = t("header.hq_credits") || t("header_hq_credits") || "HQ";

  return (
    <header
      className="rp-studio-top-bar shrink-0 z-50 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 sm:gap-3 px-2 sm:px-4 md:px-6 h-12 sm:h-14 backdrop-blur-xl w-full max-w-[100vw]"
      data-testid="studio-top-bar"
    >
      <div className="justify-self-start flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="rp-studio-top-bar__back inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-transparent transition-colors"
          aria-label={t("header.studio_nav_back")}
          data-testid="studio-back"
        >
          <ArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center text-center px-1">
        <p className="rp-studio-top-bar__eyebrow hidden md:block text-[10px] font-mono uppercase tracking-[0.18em] truncate max-w-full">
          {t("header.studio_nav_workspace")}
        </p>
        <h1 className="rp-studio-top-bar__title text-[13px] sm:text-[16px] font-semibold truncate max-w-full font-display leading-tight w-full">
          {title}
        </h1>
      </div>

      <div className="justify-self-end flex items-center gap-0.5 sm:gap-1.5 shrink-0 min-w-0">
        {user ? (
          <>
            <Link
              to="/app/billing"
              className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 rounded-full border border-[#9333EA]/25 bg-white/[0.06] hover:border-[#A855F7]/50 transition-colors min-w-0"
              data-testid="studio-credits-badge"
              title={stdLabel}
            >
              <span className="text-[8px] sm:text-[10px] font-mono uppercase tracking-wider text-[#C4B5FD]/80 max-w-[24px] sm:max-w-none truncate">
                <span className="sm:hidden">CR</span>
                <span className="hidden sm:inline">{onHqWallet ? stdLabel : (t("label_credits_short") || "cr")}</span>
              </span>
              <span className="text-[#A855F7] text-xs sm:text-sm font-mono font-semibold tabular-nums">
                {user?.is_unlimited ? "∞" : user?.total_standard_credits ?? user?.credits ?? 0}
              </span>
            </Link>
            {showHqBadge && (
              <Link
                to="/app/billing"
                className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 rounded-full border border-[#FACC15]/40 bg-[#FACC15]/10 hover:border-[#FACC15]/60 transition-colors min-w-0 shadow-[0_0_24px_-14px_rgba(250,204,21,0.7)]"
                data-testid="studio-hq-credits-badge"
                title={hqLabel}
              >
                <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FACC15] shrink-0" strokeWidth={1.75} />
                <span className="text-[8px] sm:text-[10px] font-mono uppercase tracking-wider text-[#FACC15]/85 max-w-[22px] sm:max-w-none truncate">
                  <span className="sm:hidden">HQ</span>
                  <span className="hidden sm:inline">{onHqWallet ? t("header_hq_credits") : (t("label_hq_credits_short") || "HQ")}</span>
                </span>
                {onHqWallet && <span className="hidden sm:inline text-[#FACC15]/40 text-xs">:</span>}
                <span className="text-[#FACC15] text-xs sm:text-sm font-mono font-semibold tabular-nums">
                  {user?.is_unlimited ? "∞" : user?.premium_credits ?? 0}
                </span>
              </Link>
            )}
            <span className="hidden md:inline-flex">
              <NotificationBell compact />
            </span>
            <DashboardProfileMenu compact />
          </>
        ) : (
          <Link
            to="/login"
            state={{ from: `${pathname}${search || ""}` }}
            className="text-xs sm:text-sm font-semibold text-white px-2.5 sm:px-3 py-1.5 rounded-full border border-[#9333EA]/40 bg-[#9333EA]/15 hover:bg-[#9333EA]/25 transition-colors"
            data-testid="studio-login"
          >
            {t("nav_login")}
          </Link>
        )}
      </div>
    </header>
  );
}
