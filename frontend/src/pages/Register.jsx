import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { useAuthEmailStatus } from "../lib/useAuthEmailStatus";
import { toast } from "sonner";
import useTitle from "../lib/useTitle";
import GoogleAuthButton from "../components/GoogleAuthButton";
import Logo from "../components/Logo";
import PasswordField from "../components/PasswordField";
import AuthModeTabs from "../components/AuthModeTabs";
import PublicLanguageBar from "../components/PublicLanguageBar";

export default function Register() {
  const { t } = useI18n();
  useTitle(t("auth_register_title"));
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: params.get("email") || "",
    password: "",
    confirm: "",
    referral_code: params.get("ref") || "",
  });
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { status: emailStatus, info: emailInfo } = useAuthEmailStatus(form.email);

  useEffect(() => {
    const q = params.get("email");
    if (q) setForm((f) => ({ ...f, email: q }));
  }, [params]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const emailTaken = emailStatus === "exists";
  const passwordsMismatch = form.confirm.length > 0 && form.password !== form.confirm;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (emailTaken) {
      toast.error(t("auth_email_exists_hint"));
      navigate(`/login?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
      return;
    }
    if (form.password !== form.confirm) {
      toast.error(t("auth_password_mismatch"));
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        referral_code: form.referral_code,
      });
      toast.success(t("auth_register_success"));
      navigate("/app/tools");
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message;
      const status = err?.response?.status;
      if (status === 409 || /já está registado|already registered/i.test(String(detail))) {
        toast.error(t("auth_email_exists_hint"));
        navigate(`/login?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
      } else {
        toast.error(detail || t("auth_register_fail"));
      }
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async (credential) => {
    setLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success(t("auth_register_success"));
      navigate("/app/tools");
    } catch (err) {
      toast.error(err?.message || t("auth_google_fail"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col" data-testid="register-page">
      <PublicLanguageBar testId="register-lang-bar" />
      <div className="film-grain" />
      <header className="container-rp h-[64px] flex items-center">
        <Logo to="/" size="lg" />
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-[440px]">
          <p className="eyebrow mb-5">{t("auth_register_eyebrow")}</p>
          <h1 className="heading-lg mb-3">
            {t("auth_register_heading_a")} <span className="italic text-rp-lavender">{t("auth_register_heading_b")}</span>.
          </h1>
          <p className="text-rp-mute text-sm mb-6">{t("auth_register_sub")}</p>

          <AuthModeTabs active="register" />

          <div className="mb-5">
            <GoogleAuthButton onCredential={onGoogle} label={t("auth_google_register")} />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-rp-mute2">{t("auth_or_email")}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {emailTaken && (
            <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100/95" data-testid="register-email-exists-banner">
              {emailInfo?.provider === "google" ? t("auth_email_google_hint") : t("auth_email_exists_hint")}{" "}
              <Link
                to={`/login?email=${encodeURIComponent(form.email.trim().toLowerCase())}`}
                className="text-rp-lavender underline font-medium"
              >
                {t("auth_go_login")}
              </Link>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5" data-testid="register-form">
            <div>
              <label htmlFor="register-name" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("auth_name")}</label>
              <input
                id="register-name"
                name="name"
                value={form.name}
                onChange={onChange}
                className="field-input"
                placeholder={t("auth_name_placeholder")}
                autoComplete="name"
                data-testid="register-name"
              />
            </div>
            <div>
              <label htmlFor="register-email" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("login_email")}</label>
              <input
                id="register-email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
                autoComplete="email"
                className="field-input"
                placeholder="you@studio.com"
                data-testid="register-email"
              />
              {emailStatus === "checking" && (
                <p className="mt-2 text-[12px] text-rp-mute2">{t("auth_email_checking")}</p>
              )}
            </div>
            <div>
              <label htmlFor="register-password" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("login_password")}</label>
              <PasswordField
                id="register-password"
                name="password"
                value={form.password}
                onChange={onChange}
                autoComplete="new-password"
                testId="register-password"
              />
              <p className="mt-2 text-[11px] text-rp-mute2">{t("auth_password_hint")}</p>
            </div>
            <div>
              <label htmlFor="register-confirm" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("auth_password_confirm")}</label>
              <PasswordField
                id="register-confirm"
                name="confirm"
                value={form.confirm}
                onChange={onChange}
                autoComplete="new-password"
                testId="register-confirm"
              />
              {passwordsMismatch && (
                <p className="mt-2 text-[12px] text-red-300/90">{t("auth_password_mismatch")}</p>
              )}
            </div>
            <div>
              <label htmlFor="register-referral" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">{t("auth_referral")}</label>
              <input
                id="register-referral"
                name="referral_code"
                value={form.referral_code}
                onChange={onChange}
                className="field-input"
                placeholder="—"
                data-testid="register-referral"
              />
            </div>
            <button
              type="submit"
              disabled={loading || emailTaken || passwordsMismatch || emailStatus === "checking"}
              className="btn-primary w-full disabled:opacity-50"
              data-testid="register-submit"
            >
              {loading ? t("auth_register_loading") : t("auth_register_submit")}
            </button>
          </form>

          <p className="text-rp-mute text-sm mt-10">
            {t("auth_have_account")}{" "}
            <Link to="/login" className="text-rp-lavender hover:underline" data-testid="register-go-login">{t("auth_go_login")}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
