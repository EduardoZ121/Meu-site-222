import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Lock,
  User,
  CreditCard,
  Users,
  ChevronRight,
  Image as ImageIcon,
  Mail,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { LANG_LABELS, LANG_ORDER } from "../../i18n/languages";
import { readUserSettings, writeUserSettings } from "../../lib/userSettings";
import { setLanguageAndReload } from "../../lib/remakepixLanguage";
import useTitle from "../../lib/useTitle";
import { toast } from "sonner";

const ASPECTS = ["1:1", "4:5", "9:16", "16:9", "3:2"];

export default function Settings() {
  const { user, changePassword } = useAuth();
  const { t, lang } = useI18n();
  useTitle(t("sidebar_settings"));

  const [aspect, setAspect] = useState("4:5");
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const isGoogle = String(user?.id || "").startsWith("google_");

  useEffect(() => {
    const s = readUserSettings();
    if (s.aspect_ratio_default) setAspect(s.aspect_ratio_default);
  }, []);

  const pickLang = (code) => {
    if (code === lang) return;
    writeUserSettings({ lang: code });
    toast.success(t("set_lang_reload"));
    setLanguageAndReload(code);
  };

  const pickAspect = (value) => {
    setAspect(value);
    writeUserSettings({ aspect_ratio_default: value });
    toast.success(t("set_aspect_saved"));
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (pwNew.length < 6) {
      toast.error(t("set_pw_too_short"));
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.error(t("set_pw_mismatch"));
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(pwCurrent, pwNew);
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      toast.success(t("set_pw_success"));
    } catch (err) {
      toast.error(err?.message || t("set_pw_fail"));
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto pb-16" data-testid="settings-page">
      <header className="mb-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-2">
          {t("set_page_cap")}
        </p>
        <h1 className="text-[#F4F1EA] text-3xl font-light tracking-tight font-['Inter_Tight'] mb-2">
          {t("set_page_title")}
        </h1>
        <p className="text-[#8A8A8E] text-sm leading-relaxed">{t("set_page_desc")}</p>
      </header>

      <div className="space-y-4">
        <Section title={t("set_section_account")} icon={User}>
          <Row
            icon={Mail}
            label={t("set_email")}
            value={user?.email || "—"}
            testId="settings-email"
          />
          <LinkRow to="/app/profile" label={t("set_edit_profile")} testId="settings-link-profile" />
        </Section>

        <Section title={t("set_section_language")} icon={Globe}>
          <p className="text-xs text-[#8A8A8E] mb-3 leading-relaxed">{t("set_lang_hint")}</p>
          <div className="grid grid-cols-2 gap-2">
            {LANG_ORDER.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => pickLang(code)}
                data-testid={`lang-${code}`}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  lang === code
                    ? "border-[#A855F7] bg-[#7C3AED]/15 text-white shadow-[0_0_20px_-8px_rgba(168,85,247,0.45)]"
                    : "border-[#2E2E30] bg-[#13131A] text-[#8A8A8E] hover:border-[#7C3AED]/40 hover:text-white"
                }`}
              >
                <span className="block text-sm font-medium">{LANG_LABELS[code]}</span>
                <span className="block text-[10px] font-mono uppercase tracking-wider mt-0.5 opacity-70">
                  {code}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section title={t("set_section_security")} icon={Lock}>
          {isGoogle ? (
            <p className="text-sm text-[#8A8A8E] leading-relaxed" data-testid="settings-google-hint">
              {t("set_pw_google")}
            </p>
          ) : (
            <form onSubmit={submitPassword} className="space-y-3" data-testid="settings-password-form">
              <p className="text-xs text-[#8A8A8E] mb-1">{t("set_pw_hint")}</p>
              <Field
                label={t("set_pw_current")}
                type="password"
                value={pwCurrent}
                onChange={setPwCurrent}
                testId="settings-pw-current"
                autoComplete="current-password"
              />
              <Field
                label={t("set_pw_new")}
                type="password"
                value={pwNew}
                onChange={setPwNew}
                testId="settings-pw-new"
                autoComplete="new-password"
              />
              <Field
                label={t("set_pw_confirm")}
                type="password"
                value={pwConfirm}
                onChange={setPwConfirm}
                testId="settings-pw-confirm"
                autoComplete="new-password"
              />
              <button
                type="submit"
                disabled={pwSaving || !pwCurrent || !pwNew}
                className="w-full mt-1 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-sm font-medium py-2.5 disabled:opacity-45 transition-opacity"
                data-testid="settings-pw-submit"
              >
                {pwSaving ? t("saving") : t("set_pw_submit")}
              </button>
              <Link
                to="/forgot-password"
                className="inline-block text-xs text-[#A855F7] hover:underline"
                data-testid="settings-forgot-password"
              >
                {t("login_forgot")}
              </Link>
            </form>
          )}
        </Section>

        <Section title={t("set_section_studio")} icon={ImageIcon}>
          <p className="text-xs text-[#8A8A8E] mb-3">{t("set_aspect_hint")}</p>
          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => pickAspect(a)}
                data-testid={`ar-${a}`}
                className={`min-w-[3rem] h-10 px-3 rounded-lg text-sm font-medium transition-all ${
                  aspect === a
                    ? "bg-[#7C3AED] text-white border border-[#A855F7]/50"
                    : "bg-[#13131A] text-[#8A8A8E] border border-[#2E2E30] hover:text-white hover:border-[#7C3AED]/40"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t("set_section_links")} icon={CreditCard}>
          <LinkRow to="/app/billing" label={t("sidebar_billing")} testId="settings-link-billing" />
          <LinkRow to="/app/referrals" label={t("sidebar_referrals")} testId="settings-link-referrals" />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-[rgba(147,51,234,0.15)] bg-[#13131A]/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <Icon className="w-4 h-4 text-[#A855F7]" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, value, testId }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2" data-testid={testId}>
      <div className="flex items-center gap-2 text-[#8A8A8E] text-xs uppercase tracking-wider">
        {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />}
        {label}
      </div>
      <span className="text-sm text-[#F4F1EA] truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}

function LinkRow({ to, label, testId }) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className="flex items-center justify-between gap-3 py-3 border-t border-white/[0.06] first:border-t-0 first:pt-0 text-sm text-[#F4F1EA] hover:text-[#C4B5FD] transition-colors group"
    >
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 text-[#8A8A8E] group-hover:text-[#A855F7] transition-colors" strokeWidth={1.75} />
    </Link>
  );
}

function Field({ label, type, value, onChange, testId, autoComplete }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A8E] mb-1.5 block">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-[#2E2E30] bg-[#0B0B0C] px-3 py-2.5 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#7C3AED]/60"
      />
    </label>
  );
}
