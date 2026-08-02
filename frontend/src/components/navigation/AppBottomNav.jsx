import { NavLink, useLocation } from "react-router-dom";
import { Bell, Home, PlusSquare, User } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { useNotifications } from "../../lib/NotificationContext";
import { useProfileDrawer } from "../../lib/ProfileDrawerContext";

function TabButton({ to, icon: Icon, label, active, badge, onClick, testId, avatarInitial }) {
  const inner = (
    <>
      <span className="rp-app-bottom-nav-icon-wrap">
        {avatarInitial ? (
          <span className="rp-app-bottom-nav-avatar">{avatarInitial}</span>
        ) : (
          <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.25 : 1.75} />
        )}
        {badge > 0 && (
          <span className="rp-app-bottom-nav-badge" data-testid={`${testId}-badge`}>
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="rp-app-bottom-nav-label">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rp-app-bottom-nav-btn ${active ? "rp-app-bottom-nav-btn--active" : ""}`}
        data-testid={testId}
        aria-label={label}
      >
        {inner}
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rp-app-bottom-nav-btn ${isActive || active ? "rp-app-bottom-nav-btn--active" : ""}`
      }
      data-testid={testId}
      aria-label={label}
    >
      {inner}
    </NavLink>
  );
}

export default function AppBottomNav() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { unreadCount } = useNotifications();
  const { pathname } = useLocation();
  const { open: profileDrawerOpen, openDrawer: openProfileDrawer } = useProfileDrawer();

  if (!user) return null;

  const initial = (user.name || user.email || "?").slice(0, 2).toUpperCase();
  const onNotifications = pathname.startsWith("/app/notifications");

  return (
    <nav className="rp-app-bottom-nav md:hidden" aria-label={t("bottom_nav_label")} data-testid="app-bottom-nav">
      <TabButton
        to="/app/tools"
        icon={Home}
        label={t("bottom_nav_home")}
        testId="bottom-nav-home"
      />
      <TabButton
        to="/app/notifications"
        icon={Bell}
        label={t("bottom_nav_notifications")}
        badge={unreadCount}
        active={onNotifications}
        testId="bottom-nav-notifications"
      />
      <TabButton
        to="/app/generate"
        icon={PlusSquare}
        label={t("bottom_nav_create")}
        testId="bottom-nav-create"
      />
      <TabButton
        icon={User}
        label={t("bottom_nav_profile")}
        avatarInitial={initial}
        active={profileDrawerOpen}
        onClick={openProfileDrawer}
        testId="bottom-nav-profile"
      />
    </nav>
  );
}
