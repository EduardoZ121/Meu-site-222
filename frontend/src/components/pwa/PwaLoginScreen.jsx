import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import useTitle from "../../lib/useTitle";
import GoogleAuthButton from "../GoogleAuthButton";

export default function PwaLoginScreen() {
  const { t } = useI18n();
  useTitle(t("nav_login"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
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
      navigate(from, { replace: true });
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
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pwa-login" data-testid="pwa-login-page">
      <div className="pwa-login__grain" aria-hidden />
      <div className="pwa-login__orb pwa-login__orb--violet" aria-hidden />
      <div className="pwa-login__orb pwa-login__orb--fuchsia" aria-hidden />

      <motion.div
        className="pwa-login__inner"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pwa-login__logo-wrap">
          <motion.div
            className="pwa-login__logo-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            aria-hidden
          />
          <div className="pwa-login__logo-mark" data-testid="pwa-login-logo">
            <span className="pwa-login__logo-r">R</span>
            <span className="pwa-login__logo-dot">.</span>
          </div>
        </div>

        <p className="pwa-login__brand">Remake Pixel</p>
        <p className="pwa-login__tagline">{t("pwa_login_tagline")}</p>

        <div className="pwa-login__actions">
          <div className="pwa-login__google">
            <GoogleAuthButton onCredential={onGoogle} />
          </div>

          {!showEmail ? (
            <button
              type="button"
              className="pwa-login__secondary-btn"
              onClick={() => setShowEmail(true)}
              data-testid="pwa-login-show-email"
            >
              {t("pwa_login_or_email")}
            </button>
          ) : (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={onSubmit}
              className="pwa-login__form"
              data-testid="pwa-login-form"
            >
              <label className="pwa-login__label">{t("login_email")}</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
                className="field-input pwa-login__input"
                data-testid="pwa-login-email"
              />
              <label className="pwa-login__label">{t("login_password")}</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                className="field-input pwa-login__input"
                data-testid="pwa-login-password"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full pwa-login__submit"
                data-testid="pwa-login-submit"
              >
                {loading ? t("login_loading") : t("pwa_login_enter_studio")}
              </button>
            </motion.form>
          )}
        </div>

        <p className="pwa-login__footer">
          <Sparkles className="w-3.5 h-3.5 inline-block mr-1 text-[#A855F7] -mt-0.5" />
          {t("login_new")}{" "}
          <Link to="/register" className="text-[#C4B5FD] hover:underline" data-testid="pwa-login-register">
            {t("login_register")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
