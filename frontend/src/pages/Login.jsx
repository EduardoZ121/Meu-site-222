import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { isPwaStandalone } from "../lib/pwaMode";
import { toast } from "sonner";
import useTitle from "../lib/useTitle";
import GoogleAuthButton from "../components/GoogleAuthButton";
import Logo from "../components/Logo";
import PwaLoginScreen from "../components/pwa/PwaLoginScreen";
import PublicLanguageBar from "../components/PublicLanguageBar";

function BrowserLogin() {
  const { t } = useI18n();
  useTitle(t("nav_login"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/app/tools";

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t("login_success"));
      navigate(from);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async (credential) => {
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success(t("login_success"));
      navigate(from);
    } catch (err) {
      toast.error(err?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="heading-lg mb-10">
            {t("login_title")} <span className="italic text-rp-lavender">{t("login_title_accent")}</span>.
          </h1>

          <div className="mb-5">
            <GoogleAuthButton onCredential={onGoogle} />
          </div>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="login-form">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("login_email")}</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@studio.com" className="field-input" data-testid="login-email" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2">{t("login_password")}</label>
                <Link to="/forgot-password" className="text-[11px] text-rp-lavender hover:underline">{t("login_forgot")}</Link>
              </div>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} className="field-input" data-testid="login-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50" data-testid="login-submit">
              {loading ? t("login_loading") : t("login_submit")}
            </button>
          </form>

          <p className="text-rp-mute text-sm mt-10">
            {t("login_new")}{" "}
            <Link to="/register" className="text-rp-lavender hover:underline" data-testid="login-go-register">{t("login_register")}</Link>
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
