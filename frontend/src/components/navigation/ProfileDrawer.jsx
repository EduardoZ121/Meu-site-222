import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  Heart,
  ImagePlus,
  Images,
  InfinityIcon,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import Logo from "../Logo";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { useProfileDrawer } from "../../lib/ProfileDrawerContext";
import { useBackClose } from "../../lib/useBackClose";
import { LANG_LABELS, LANG_ORDER } from "../../lib/localeStrings";
import { api } from "../../lib/api";
import { prefetchGalleryHistory } from "../../lib/galleryCache";

const DRAWER_EASE = [0.22, 1, 0.36, 1];
const DRAWER_MS = 0.3;

const LANG_FLAGS = {
  en: "🇬🇧",
  pt: "🇵🇹",
  es: "🇪🇸",
  fr: "🇫🇷",
};

const PRIMARY_LINKS = [
  { to: "/app/profile", icon: User, labelKey: "sidebar.profile", testId: "profile-drawer-profile" },
  { to: "/app/gallery", icon: Images, labelKey: "sidebar.gallery", testId: "profile-drawer-gallery" },
  { to: "/app/favorites", icon: Heart, labelKey: "sidebar.favorites", testId: "profile-drawer-favorites" },
  { to: "/app/settings", icon: Settings, labelKey: "sidebar.settings", testId: "profile-drawer-settings" },
];

const ACCOUNT_LINKS = [
  { to: "/app/billing", icon: CreditCard, labelKey: "sidebar.billing", testId: "profile-drawer-billing" },
  { to: "/app/referrals", icon: ImagePlus, labelKey: "sidebar.referrals", testId: "profile-drawer-referrals" },
];

function DrawerNavItem({ to, icon: Icon, label, onNavigate, testId }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => `rp-drawer-item${isActive ? " rp-drawer-item--active" : ""}`}
      data-testid={testId}
    >
      {({ isActive }) => (
        <>
          <span className="rp-drawer-item__bar" aria-hidden />
          <Icon
            className={`rp-drawer-item__icon${isActive ? " rp-drawer-item__icon--active" : ""}`}
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="rp-drawer-item__label">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function DrawerDivider() {
  return <div className="rp-drawer-divider" role="separator" />;
}

function CreditsBadge({ unlimited, credits, label, onNavigate }) {
  return (
    <Link
      to="/app/billing"
      onClick={onNavigate}
      className="rp-drawer-credits"
      data-testid="profile-drawer-credits"
      title={label}
    >
      <span className="rp-drawer-credits__label">{label}</span>
      {unlimited ? (
        <InfinityIcon className="rp-drawer-credits__infinity" strokeWidth={2.25} aria-hidden />
      ) : (
        <span className="rp-drawer-credits__value">{credits}</span>
      )}
    </Link>
  );
}

function LangChips({ lang, switchLang }) {
  return (
    <div className="rp-drawer-langs" data-testid="profile-drawer-language" role="group">
      {LANG_ORDER.map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => { if (!active) switchLang(code); }}
            className={`rp-drawer-lang${active ? " rp-drawer-lang--active" : ""}`}
            aria-pressed={active}
            data-testid={`profile-drawer-lang-${code}`}
          >
            <span className="rp-drawer-lang__flag" aria-hidden>{LANG_FLAGS[code]}</span>
            <span className="rp-drawer-lang__name">{LANG_LABELS[code]}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function ProfileDrawer() {
  const { user, logout } = useAuth();
  const { t, lang, switchLang } = useI18n();
  const navigate = useNavigate();
  const { open, closeDrawer } = useProfileDrawer();
  const [confirmLogout, setConfirmLogout] = useState(false);
  useBackClose(open, closeDrawer);

  // Opening the menu often precedes Galeria — warm cache now.
  useEffect(() => {
    if (!open || !user?.id) return undefined;
    const timer = window.setTimeout(() => {
      prefetchGalleryHistory(api).catch(() => {});
    }, 100);
    return () => window.clearTimeout(timer);
  }, [open, user?.id]);

  const handleClose = useCallback(() => {
    setConfirmLogout(false);
    closeDrawer();
  }, [closeDrawer]);

  const doLogout = useCallback(() => {
    setConfirmLogout(false);
    closeDrawer();
    logout();
    navigate("/");
  }, [closeDrawer, logout, navigate]);

  if (!user) return null;

  const initial = (user.name || user.email || "?").slice(0, 1).toUpperCase();
  const displayName = user.name || user.email?.split("@")[0] || t("profile_menu_guest");
  const subtitle = user.email || t("profile_drawer_account_sub");
  const avatarUrl = user.avatar_url || null;
  const isPremium = !!(user.subscription?.active || user.is_unlimited || user.role === "admin");
  const creditsLabel = t("credits");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            key="profile-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DRAWER_MS, ease: DRAWER_EASE }}
            onClick={handleClose}
            className="rp-drawer-overlay md:hidden"
            aria-label={t("btn_close")}
            data-testid="profile-drawer-overlay"
          />
          <motion.aside
            key="profile-drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: DRAWER_MS, ease: DRAWER_EASE }}
            className="rp-drawer md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t("sidebar.profile")}
            data-testid="profile-drawer"
          >
            <header className="rp-drawer-header">
              <div className="rp-drawer-header__brand">
                <Link to="/app" onClick={handleClose} className="rp-drawer-logo-link" data-testid="profile-drawer-logo">
                  <Logo to={null} size="default" variant="header" className="rp-drawer-logo" />
                </Link>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rp-drawer-close"
                  aria-label={t("btn_close")}
                  data-testid="profile-drawer-close"
                >
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>

              <div className="rp-drawer-header__row">
                <CreditsBadge
                  unlimited={!!user.is_unlimited}
                  credits={user.credits ?? 0}
                  label={creditsLabel}
                  onNavigate={handleClose}
                />
              </div>

              <div className="rp-drawer-user">
                <span className="rp-drawer-avatar" aria-hidden>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="rp-drawer-avatar__img"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    initial
                  )}
                </span>
                <div className="rp-drawer-user__meta">
                  <div className="rp-drawer-user__name-row">
                    <p className="rp-drawer-user__name">{displayName}</p>
                    {isPremium && (
                      <span className="rp-drawer-premium" data-testid="profile-drawer-premium">
                        {t("profile_drawer_premium")}
                      </span>
                    )}
                  </div>
                  <p className="rp-drawer-user__sub">{subtitle}</p>
                </div>
              </div>
            </header>

            <div className="rp-drawer-body">
              <nav className="rp-drawer-nav" aria-label={t("sidebar.profile")}>
                {PRIMARY_LINKS.map((item) => (
                  <DrawerNavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={t(item.labelKey)}
                    onNavigate={handleClose}
                    testId={item.testId}
                  />
                ))}

                <DrawerDivider />

                {ACCOUNT_LINKS.map((item) => (
                  <DrawerNavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={t(item.labelKey)}
                    onNavigate={handleClose}
                    testId={item.testId}
                  />
                ))}

                {user.role === "admin" && (
                  <>
                    <DrawerDivider />
                    <DrawerNavItem
                      to="/app/admin"
                      icon={ShieldCheck}
                      label={t("nav_admin")}
                      onNavigate={handleClose}
                      testId="profile-drawer-admin"
                    />
                  </>
                )}
              </nav>

              <div className="rp-drawer-footer">
                <LangChips lang={lang} switchLang={switchLang} />

                <AnimatePresence mode="wait" initial={false}>
                  {confirmLogout ? (
                    <motion.div
                      key="logout-confirm"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.22, ease: DRAWER_EASE }}
                      className="rp-drawer-logout-confirm"
                      data-testid="profile-drawer-logout-confirm"
                    >
                      <p className="rp-drawer-logout-confirm__text">{t("profile_drawer_logout_confirm")}</p>
                      <div className="rp-drawer-logout-confirm__actions">
                        <button
                          type="button"
                          className="rp-drawer-logout-confirm__cancel"
                          onClick={() => setConfirmLogout(false)}
                          data-testid="profile-drawer-logout-cancel"
                        >
                          {t("cancel")}
                        </button>
                        <button
                          type="button"
                          className="rp-drawer-logout-confirm__yes"
                          onClick={doLogout}
                          data-testid="profile-drawer-logout-yes"
                        >
                          {t("btn_logout")}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="logout-btn"
                      type="button"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.22, ease: DRAWER_EASE }}
                      onClick={() => setConfirmLogout(true)}
                      className="rp-drawer-logout"
                      data-testid="profile-drawer-logout"
                    >
                      <LogOut className="rp-drawer-item__icon" strokeWidth={1.75} aria-hidden />
                      <span>{t("btn_logout")}</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
