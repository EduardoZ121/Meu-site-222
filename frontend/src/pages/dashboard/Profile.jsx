import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import { toast } from "sonner";
import { CLIENT_BUILD_ID } from "../../lib/buildInfo";
import { compressImage, looksLikeImageFile } from "../../lib/imageCompress";
import {
  Coins,
  Mail,
  Globe,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  ArrowUpRight,
  Pencil,
  Camera,
  CheckCircle2,
  AlertCircle,
  Copy,
  Settings,
  CreditCard,
  Images,
  ChevronRight,
  Hash,
  Sparkles,
} from "lucide-react";

const ICON_PROPS = { className: "rp-prof-ico", strokeWidth: 1.5, "aria-hidden": true };

export default function Profile() {
  const { t, lang } = useI18n();
  useTitle(t("sidebar_profile"));
  const { user, updateProfile, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name, user?.id]);

  useEffect(() => {
    if (editing && nameInputRef.current) nameInputRef.current.focus();
  }, [editing]);

  if (!user) return null;

  const localeMap = { en: "en-US", pt: "pt-PT", es: "es-ES", fr: "fr-FR" };
  const dateLocale = localeMap[lang] || "en-US";
  const joined = new Date(user.created_at).toLocaleDateString(dateLocale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const roleLabel = user.role === "admin" ? t("prof_role_admin") : t("prof_role_member");
  const emailVerified = !!user.email_verified;
  const avatarInitial = (user.name || user.email || "?").charAt(0).toUpperCase();
  const displayName = user.name || user.email.split("@")[0];
  const referral = (user.referral_code || "").trim();
  const shortId = String(user.id || "").length > 14
    ? `${String(user.id).slice(0, 10)}…${String(user.id).slice(-4)}`
    : String(user.id || "—");
  const balanceLabel = user.is_unlimited
    ? "∞"
    : user.credits?.toLocaleString(dateLocale);

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("prof_copied"));
    } catch {
      toast.error(t("prof_copy_fail"));
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    if (!looksLikeImageFile(file)) {
      toast.error(t("prof_avatar_type"));
      return;
    }
    try {
      const small = await compressImage(file, { maxSize: 512, quality: 0.82 });
      const avatar_url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(small);
      });
      await updateProfile({ avatar_url });
      toast.success(t("prof_avatar_ok"));
    } catch (e) {
      toast.error(e?.message || t("prof_avatar_fail"));
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() || user.email.split("@")[0] });
      setEditing(false);
      toast.success(t("prof_name_ok"));
    } catch {
      toast.error(t("prof_save_fail"));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(user.name || user.email.split("@")[0]);
    setEditing(false);
  };

  const confirmEmail = async () => {
    await verifyEmail();
    toast.success(t("prof_email_confirmed"));
  };

  return (
    <div className="rp-prof-page" data-testid="profile-page">
      <header className="rp-prof-hero">
        <div className="rp-prof-hero__main">
          <nav className="rp-prof-breadcrumb" aria-label="breadcrumb">
            <span className="rp-prof-breadcrumb__root">{t("prof_page_eyebrow")}</span>
            <span className="rp-prof-breadcrumb__sep" aria-hidden>
              →
            </span>
            <span className="rp-prof-breadcrumb__current">{t("prof_page_title")}</span>
          </nav>
          <h1 className="rp-prof-hero__title">{t("prof_page_title")}</h1>
          <p className="rp-prof-hero__desc">{t("prof_page_desc")}</p>
        </div>
        <div className="rp-prof-hero__actions">
          <Link to="/app/settings" className="rp-prof-btn rp-prof-btn--ghost">
            <Settings {...ICON_PROPS} />
            {t("prof_settings")}
          </Link>
          <button
            type="button"
            onClick={() => navigate("/app/billing")}
            className="rp-prof-btn rp-prof-btn--primary"
            data-testid="profile-billing-btn"
          >
            <CreditCard {...ICON_PROPS} />
            {t("prof_billing")}
          </button>
        </div>
      </header>

      <div className="rp-prof-grid">
        <div className="rp-prof-col rp-prof-col--main">
          <section className="rp-prof-card rp-prof-card--identity" data-testid="profile-hero">
            <div className="rp-prof-card__accent" aria-hidden />
            <div className="rp-prof-identity">
              <div className="rp-prof-avatar-wrap">
                <div className="rp-prof-avatar">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={user.avatar_url || "initial"}
                      className="rp-prof-avatar__media"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="rp-prof-avatar__img" />
                      ) : (
                        <span className="rp-prof-avatar__initial">{avatarInitial}</span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <label className="rp-prof-avatar__edit">
                  <Camera {...ICON_PROPS} />
                  <span>{t("prof_edit_photo")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => uploadAvatar(e.target.files?.[0])}
                  />
                </label>
                <p className="rp-prof-avatar__hint">
                  JPG / PNG · {t("prof_avatar_hint").replace(/^JPG \/ PNG ·\s*/i, "")}
                </p>
              </div>

              <div className="rp-prof-identity__body">
                <div className="rp-prof-badges">
                  <span className="rp-prof-badge rp-prof-badge--role" data-testid="profile-role">
                    <ShieldCheck {...ICON_PROPS} />
                    {roleLabel}
                  </span>
                  <span
                    className={`rp-prof-badge ${
                      emailVerified ? "rp-prof-badge--ok" : "rp-prof-badge--warn"
                    }`}
                  >
                    {emailVerified ? (
                      <CheckCircle2 {...ICON_PROPS} />
                    ) : (
                      <AlertCircle {...ICON_PROPS} />
                    )}
                    {emailVerified ? t("prof_email_verified") : t("prof_email_unverified")}
                  </span>
                </div>

                {editing ? (
                  <div className="rp-prof-name-edit">
                    <label className="rp-prof-field-label">{t("prof_name_label")}</label>
                    <div className="rp-prof-name-edit__row">
                      <input
                        ref={nameInputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rp-prof-input"
                        placeholder={t("prof_name_placeholder")}
                        maxLength={80}
                      />
                      <div className="rp-prof-name-edit__actions">
                        <button
                          type="button"
                          onClick={saveProfile}
                          disabled={saving}
                          className="rp-prof-btn rp-prof-btn--primary rp-prof-btn--sm"
                        >
                          {saving ? "…" : t("prof_save")}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={saving}
                          className="rp-prof-btn rp-prof-btn--ghost rp-prof-btn--sm"
                        >
                          {t("prof_cancel")}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rp-prof-name-block">
                    <h2 className="rp-prof-name" data-testid="profile-name">
                      {displayName}
                    </h2>
                    <p className="rp-prof-email-line" title={user.email}>
                      {user.email}
                    </p>
                  </div>
                )}

                <div className="rp-prof-field" data-testid="info-email">
                  <div className="rp-prof-field__left">
                    <Mail {...ICON_PROPS} />
                    <div className="rp-prof-field__text">
                      <p className="rp-prof-field-label">{t("prof_session_email")}</p>
                      <p className="rp-prof-field__value" title={user.email}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="rp-prof-field__actions">
                    <button
                      type="button"
                      onClick={() => copyText(user.email)}
                      className="rp-prof-copy"
                    >
                      <Copy {...ICON_PROPS} />
                      {t("prof_copy")}
                    </button>
                    {!emailVerified && (
                      <button
                        type="button"
                        onClick={confirmEmail}
                        className="rp-prof-btn rp-prof-btn--warn rp-prof-btn--sm"
                      >
                        {t("prof_confirm")}
                      </button>
                    )}
                  </div>
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rp-prof-link-edit"
                    data-testid="profile-edit-btn"
                  >
                    <Pencil {...ICON_PROPS} />
                    {t("prof_edit_public_name")}
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="rp-prof-card rp-prof-card--data">
            <h3 className="rp-prof-section-title">{t("prof_data_title")}</h3>
            <p className="rp-prof-section-sub">{t("prof_data_subtitle")}</p>
            <div className="rp-prof-fields">
              <DetailRow
                icon={<Calendar {...ICON_PROPS} />}
                label={t("prof_member_since")}
                value={joined}
                testId="info-joined"
              />
              <DetailRow
                icon={<Globe {...ICON_PROPS} />}
                label={t("prof_interface_lang")}
                value={(lang || "en").toUpperCase()}
                testId="info-lang"
              />
              <DetailRow
                icon={<Hash {...ICON_PROPS} />}
                label={t("prof_account_id")}
                value={shortId}
                mono
                action={
                  <button
                    type="button"
                    onClick={() => copyText(String(user.id))}
                    className="rp-prof-copy rp-prof-copy--inline"
                  >
                    <Copy {...ICON_PROPS} />
                    {t("prof_copy_full_id")}
                  </button>
                }
                testId="info-account-id"
              />
              {referral ? (
                <DetailRow
                  icon={<UserIcon {...ICON_PROPS} />}
                  label={t("prof_referral_code")}
                  value={referral}
                  mono
                  action={
                    <button
                      type="button"
                      onClick={() => copyText(referral)}
                      className="rp-prof-copy rp-prof-copy--inline"
                    >
                      <Copy {...ICON_PROPS} />
                      {t("prof_copy")}
                    </button>
                  }
                />
              ) : (
                <DetailRow
                  icon={<Sparkles {...ICON_PROPS} />}
                  label={t("prof_referrals_label")}
                  value={t("prof_no_referral")}
                  action={
                    <Link to="/app/referrals" className="rp-prof-copy rp-prof-copy--inline">
                      {t("prof_view_referrals")}
                      <ChevronRight {...ICON_PROPS} />
                    </Link>
                  }
                />
              )}
            </div>
          </section>
        </div>

        <aside className="rp-prof-col rp-prof-col--side">
          <section className="rp-prof-card rp-prof-card--credits" data-testid="profile-credits-card">
            <div className="rp-prof-credits__shimmer" aria-hidden />
            <div className="rp-prof-credits__head">
              <div className="rp-prof-credits__ico">
                <Coins {...ICON_PROPS} />
              </div>
              <div>
                <p className="rp-prof-credits__label">{t("prof_balance")}</p>
                <p className="rp-prof-credits__sub">{t("prof_credits_available")}</p>
              </div>
            </div>
            <p className="rp-prof-credits__value" data-testid="profile-balance">
              {balanceLabel}
              <span className="rp-prof-credits__unit">
                {user.is_unlimited ? t("prof_credits_unlimited") : t("prof_credits_unit")}
              </span>
            </p>
            <Link
              to="/app/billing"
              className="rp-prof-btn rp-prof-btn--cta"
              data-testid="profile-buy-credits"
            >
              {t("prof_buy_credits")}
              <ArrowUpRight {...ICON_PROPS} />
            </Link>
            {user.is_unlimited && (
              <p className="rp-prof-credits__hint">{t("prof_unlimited_hint")}</p>
            )}
          </section>

          <section className="rp-prof-card rp-prof-card--links">
            <p className="rp-prof-field-label rp-prof-field-label--block">
              {t("prof_quick_links")}
            </p>
            <nav className="rp-prof-links">
              <QuickLink
                to="/app/gallery"
                icon={<Images {...ICON_PROPS} />}
                label={t("sidebar_gallery")}
              />
              <QuickLink
                to="/app/generate"
                icon={<Sparkles {...ICON_PROPS} />}
                label={t("prof_studio")}
              />
              <QuickLink
                to="/app/referrals"
                icon={<UserIcon {...ICON_PROPS} />}
                label={t("prof_invite_friends")}
              />
            </nav>
          </section>

          <section className="rp-prof-card rp-prof-card--note">
            <p className="rp-prof-note">
              {t("prof_recovery_text")}{" "}
              <Link to="/app/settings">{t("prof_settings")}</Link>. {t("prof_recovery_intro")}{" "}
              <Link to="/forgot-password">{t("prof_recovery_link")}</Link>.
            </p>
          </section>
        </aside>
      </div>

      <footer className="rp-prof-foot">
        <span>Remake</span>
        <span className="rp-prof-foot__dot" aria-hidden>
          ·
        </span>
        <span className="rp-prof-foot__ver">{CLIENT_BUILD_ID}</span>
      </footer>
    </div>
  );
}

function DetailRow({ icon, label, value, mono, action, testId }) {
  return (
    <div className="rp-prof-field rp-prof-field--stack" data-testid={testId}>
      <div className="rp-prof-field__left">
        {icon}
        <span className="rp-prof-field-label">{label}</span>
      </div>
      <p className={`rp-prof-field__value ${mono ? "rp-prof-field__value--mono" : ""}`}>
        {value}
      </p>
      {action && <div className="rp-prof-field__foot">{action}</div>}
    </div>
  );
}

function QuickLink({ to, icon, label }) {
  return (
    <Link to={to} className="rp-prof-quick">
      <span className="rp-prof-quick__left">
        <span className="rp-prof-quick__ico">{icon}</span>
        {label}
      </span>
      <ChevronRight {...ICON_PROPS} />
    </Link>
  );
}
