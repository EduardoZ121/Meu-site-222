import { Link, useLocation } from "react-router-dom";
import { useI18n } from "../lib/i18n";

export default function AuthModeTabs({ active }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const loginActive = active === "login" || pathname === "/login";
  const registerActive = active === "register" || pathname === "/register";

  const tabClass = (on) =>
    `flex-1 text-center py-2.5 text-sm font-medium rounded-xl transition-all ${
      on
        ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.35)]"
        : "text-rp-mute2 hover:text-rp-mute"
    }`;

  return (
    <div
      className="grid grid-cols-2 gap-1 p-1 mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03]"
      role="tablist"
      data-testid="auth-mode-tabs"
    >
      <Link to="/login" className={tabClass(loginActive)} role="tab" aria-selected={loginActive} data-testid="auth-tab-login">
        {t("auth_tab_login")}
      </Link>
      <Link to="/register" className={tabClass(registerActive)} role="tab" aria-selected={registerActive} data-testid="auth-tab-register">
        {t("auth_tab_register")}
      </Link>
    </div>
  );
}
