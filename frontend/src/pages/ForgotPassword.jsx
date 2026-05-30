import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Copy, Mail } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import useTitle from "../lib/useTitle";
import Logo from "../components/Logo";
import PublicLanguageBar from "../components/PublicLanguageBar";

export default function ForgotPassword() {
  const { t } = useI18n();
  useTitle(t("auth_forgot_title"));
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResetLink("");
    setSent(false);
    try {
      const result = await requestPasswordReset(email);
      if (result.mode === "local" && result.token) {
        const link = `${window.location.origin}/reset-password?token=${encodeURIComponent(result.token)}`;
        setResetLink(link);
        toast.success(t("auth_forgot_local_ok"));
      } else if (result.mode === "email" || result.email_sent) {
        setSent(true);
        toast.success(t("auth_forgot_email_ok"));
      } else {
        setSent(true);
        toast.success(t("auth_forgot_generic_ok"));
      }
    } catch (err) {
      if (err?.response?.data?.code === "USE_GOOGLE") {
        toast.error(t("auth_email_google_hint"));
      } else {
        toast.error(err?.response?.data?.detail || err?.message || t("auth_forgot_fail"));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(resetLink);
    toast.success(t("common_copy_ok"));
  };

  return (
    <div className="min-h-screen bg-rp-bg flex flex-col" data-testid="forgot-page">
      <PublicLanguageBar testId="forgot-lang-bar" />
      <div className="film-grain" />
      <header className="container-rp h-[64px] flex items-center">
        <Logo to="/" size="lg" />
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px]">
          <p className="eyebrow mb-5">{t("auth_forgot_eyebrow")}</p>
          <h1 className="heading-lg mb-3">
            {t("auth_forgot_heading_a")}{" "}
            <span className="italic text-rp-lavender">{t("auth_forgot_heading_b")}</span>.
          </h1>
          <p className="text-rp-mute text-sm mb-10">{t("auth_forgot_body")}</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-3">
                {t("login_email")}
              </label>
              <input
                id="forgot-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
                className="field-input"
                placeholder="you@studio.com"
                data-testid="forgot-email"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50" data-testid="forgot-submit">
              <Mail className="w-4 h-4" /> {loading ? t("auth_forgot_loading") : t("auth_forgot_submit")}
            </button>
          </form>

          {sent && !resetLink && (
            <p className="mt-6 text-rp-mute text-sm leading-relaxed" data-testid="forgot-sent-msg">
              {t("auth_forgot_generic_ok")}
            </p>
          )}

          {resetLink && (
            <div className="mt-6 border border-rp-border bg-rp-surface p-4">
              <p className="text-rp-mute text-xs leading-relaxed mb-3">{t("auth_forgot_local_hint")}</p>
              <button type="button" onClick={copyLink} className="btn-secondary w-full !justify-center !text-[10px]">
                <Copy className="w-3.5 h-3.5" /> {t("auth_forgot_copy_link")}
              </button>
            </div>
          )}

          <p className="text-rp-mute text-sm mt-10">
            {t("auth_forgot_back")}{" "}
            <Link to="/login" className="text-rp-lavender hover:underline">{t("nav_login")} →</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
