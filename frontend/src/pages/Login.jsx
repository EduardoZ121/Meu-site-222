import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { isPwaStandalone } from "../lib/pwaMode";
import { useAuthEmailStatus } from "../lib/useAuthEmailStatus";
import { toast } from "sonner";
import { usePageSeo } from "../lib/usePageSeo";
import { SEO_LOGIN } from "../lib/seoEn";
import GoogleAuthButton from "../components/GoogleAuthButton";
import Logo from "../components/Logo";
import PasswordField from "../components/PasswordField";
import AuthModeTabs from "../components/AuthModeTabs";
import PwaLoginScreen from "../components/pwa/PwaLoginScreen";
import PublicLanguageBar from "../components/PublicLanguageBar";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../lib/supportEmail";

function BrowserLogin() {
  const { t } = useI18n();
  usePageSeo({
    title: SEO_LOGIN.title,
    documentTitle: SEO_LOGIN.documentTitle,
    description: SEO_LOGIN.description,
    path: SEO_LOGIN.path,
    noindex: SEO_LOGIN.noindex,
  });
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/app/tools";
  const { status: emailStatus, info: emailInfo } = useAuthEmailStatus(email);
  const isGoogleOnly = emailStatus === "exists" && emailInfo?.provider === "google";
  const isNewEmail = emailStatus === "new";

  useEffect(() => {
    const q = params.get("email");
    if (q) setEmail(q);
  }, [params]);

  useEffect(() => {
    if (!authLoading && user) navigate(from, { replace: true });
  }, [authLoading, user, from, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isNewEmail) {
      toast.message(t("auth_email_new_hint"));
      navigate(`/register?email=${encodeURIComponent(email.trim().toLowerCase())}&next=${encodeURIComponent(from)}`);
      return;
    }
    if (isGoogleOnly) {
      toast.message(t("auth_email_google_hint"));
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t("login_success"));
      navigate(from);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message;
      const code = err?.response?.data?.code;
      if (code === "NOT_FOUND" || /não encontrada|not found/i.test(String(detail))) {
        toast.error(t("auth_email_new_hint"));
        navigate(`/register?email=${encodeURIComponent(email.trim().toLowerCase())}&next=${encodeURIComponent(from)}`);
      } else if (code === "USE_GOOGLE") {
        toast.error(t("auth_email_google_hint"));
      } else {
        toast.error(detail || t("auth_login_fail"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = params.get("google");
    if (q === "failed") toast.error(t("auth_google_fail"));
    else if (q === "csrf") toast.error(t("auth_google_csrf"));
  }, [params, t]);

  const onGoogle = useCallback(async (credential) => {
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success(t("login_success"));
      navigate(from);
    } catch (err) {
      toast.error(err?.message || t("auth_google_fail"));
    } finally {
      setLoading(false);
    }
  }, [from, loginWithGoogle, navigate, t]);

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col" data-testid="login-page">
      <PublicLanguageBar testId="login-lang-bar" />
      <div className="film-grain" />
      <header className="container-rp h-[64px] flex items-center">
        <Logo to="/" size="lg" />
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-[420px]">
          <p className="eyebrow mb-5">{t("login_welcome")}</p>
          <h1 className="heading-lg mb-6">
            {t("login_title")} <span className="italic text-rp-lavender">{t("login_title_accent")}</span>.
          </h1>

          <AuthModeTabs active="login" />

          <div className="mb-5">
            <GoogleAuthButton onCredential={onGoogle} label={t("auth_google_continue")} />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-rp-mute2">{t("auth_or_email")}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="login-form">
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("login_email")}</label>
              <input
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
                placeholder="you@studio.com"
                className="field-input"
                data-testid="login-email"
              />
              {emailStatus === "checking" && (
                <p className="mt-2 text-[12px] text-rp-mute2">{t("auth_email_checking")}</p>
              )}
              {emailStatus === "offline" && (
                <p className="mt-2 text-[12px] text-rp-mute2">{t("auth_email_offline_hint")}</p>
              )}
              {isNewEmail && (
                <p className="mt-2 text-[12px] text-amber-200/90" data-testid="login-email-new-hint">
                  {t("auth_email_new_hint")}{" "}
                  <Link to={`/register?email=${encodeURIComponent(email.trim().toLowerCase())}`} className="text-rp-lavender underline">
                    {t("auth_tab_register")}
                  </Link>
                </p>
              )}
              {isGoogleOnly && (
                <p className="mt-2 text-[12px] text-rp-mute">{t("auth_email_google_hint")}</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="login-password" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2">{t("login_password")}</label>
                <Link to="/forgot-password" className="text-[11px] text-rp-lavender hover:underline">{t("login_forgot")}</Link>
              </div>
              <PasswordField
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                testId="login-password"
                required={!isGoogleOnly && !isNewEmail}
              />
            </div>
            <button
              type="submit"
              disabled={loading || emailStatus === "checking" || isGoogleOnly}
              className="btn-primary w-full disabled:opacity-50"
              data-testid="login-submit"
            >
              {loading ? t("login_loading") : t("login_submit")}
            </button>
          </form>

          <p className="text-rp-mute text-sm mt-10">
            {t("login_new")}{" "}
            <Link to="/register" className="text-rp-lavender hover:underline" data-testid="login-go-register">{t("login_register")}</Link>
          </p>
          <p className="text-rp-mute2 text-[13px] mt-6 text-center" data-testid="login-support-email">
            {t("auth_support_hint")}{" "}
            <a href={SUPPORT_MAILTO} className="text-rp-lavender hover:underline">{SUPPORT_EMAIL}</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function Login() {
  if (isPwaStandalone()) return <PwaLoginScreen />;
  return <BrowserLogin />;
}
