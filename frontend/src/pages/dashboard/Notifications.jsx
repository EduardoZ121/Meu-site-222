import { useMemo, useState } from "react";
import { CheckCheck, Trash2, Bell } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import { useNotifications } from "../../lib/NotificationContext";
import NotificationListPanel from "../../components/notifications/NotificationListPanel";

const FILTERS = [
  { id: "all", types: null },
  { id: "generation", types: new Set(["generation", "generation_failed"]) },
  { id: "credits", types: new Set(["credits_refund", "credits_low", "credits_spent"]) },
];

export default function Notifications() {
  const { t } = useI18n();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [filter, setFilter] = useState("all");
  useTitle(t("notif_page_title"));

  const activeFilter = FILTERS.find((f) => f.id === filter) || FILTERS[0];

  const filtered = useMemo(() => {
    if (!activeFilter.types) return notifications;
    return notifications.filter((n) => activeFilter.types.has(n.type));
  }, [notifications, activeFilter]);

  const total = notifications.length;

  return (
    <div className="rp-notif-page" data-testid="notifications-page">
      <header className="rp-notif-header">
        <div className="rp-notif-header__copy">
          <p className="rp-notif-eyebrow">{t("notif_page_eyebrow")}</p>
          <div className="rp-notif-header__title-row">
            <h1 className="rp-notif-title">{t("notif_page_title")}</h1>
            {total > 0 && (
              <span className="rp-notif-count" data-testid="notifications-count">
                {unreadCount > 0
                  ? t("notif_count_unread", { n: unreadCount, total })
                  : t("notif_count_total", { n: total })}
              </span>
            )}
          </div>
          <p className="rp-notif-desc">{t("notif_page_desc")}</p>
        </div>

        {total > 0 && (
          <div className="rp-notif-header__actions">
            <button
              type="button"
              onClick={markAllRead}
              className="rp-notif-header-btn"
              title={t("notif_mark_all_read")}
              aria-label={t("notif_mark_all_read")}
              data-testid="notifications-page-mark-all"
            >
              <CheckCheck className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">{t("notif_mark_all_read")}</span>
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rp-notif-header-btn rp-notif-header-btn--danger"
              title={t("notif_clear_all")}
              aria-label={t("notif_clear_all")}
              data-testid="notifications-page-clear"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">{t("notif_clear_all")}</span>
            </button>
          </div>
        )}
      </header>

      <div className="rp-notif-filters" role="tablist" aria-label={t("notif_page_title")}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={`rp-notif-chip ${active ? "rp-notif-chip--active" : ""}`}
              data-testid={`notifications-filter-${f.id}`}
            >
              {f.id === "all" && <Bell className="w-3.5 h-3.5 opacity-80" strokeWidth={1.75} />}
              {t(`notif_filter_${f.id}`)}
              {f.id === "all" && unreadCount > 0 ? (
                <span className="rp-notif-chip__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <NotificationListPanel fullPage items={filtered} />
    </div>
  );
}
