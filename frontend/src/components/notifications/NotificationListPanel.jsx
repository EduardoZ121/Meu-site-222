import { useCallback, useEffect, useRef, useState, memo } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../../lib/NotificationContext";
import { useI18n } from "../../lib/i18n";
import { activeBackgroundJobsCount, MAX_CONCURRENT_BG_JOBS } from "../../lib/bgGeneration";
import { resolveNotificationVisual } from "../../lib/notificationVisual";
import { getCachedCreation, seedGalleryFocus } from "../../lib/galleryCache";

function formatNotifTime(iso, t) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return t("notif_time_now");
  if (mins < 60) return t("notif_time_mins", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("notif_time_hours", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("notif_time_days", { n: days });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function NotifIconBadge({ notification, large = false }) {
  const { Icon, tone } = resolveNotificationVisual(notification);
  return (
    <span
      className={`rp-notif-ico rp-notif-ico--${tone} ${large ? "rp-notif-ico--lg" : "rp-notif-ico--sm"}`}
      aria-hidden
    >
      <Icon className={large ? "w-5 h-5" : "w-4 h-4"} strokeWidth={1.75} />
    </span>
  );
}

const FullPageCard = memo(function FullPageCard({
  n,
  t,
  onOpen,
  onDismiss,
}) {
  return (
    <li className={`rp-notif-card ${n.read ? "is-read" : "is-unread"}`}>
      <div className="rp-notif-card__rail" aria-hidden />
      <NotifIconBadge notification={n} large />
      <div className="rp-notif-card__body">
        <button
          type="button"
          onClick={() => onOpen(n)}
          className="rp-notif-card__main"
          data-testid={`notification-item-${n.type}`}
        >
          <span className="rp-notif-card__title">{n.title}</span>
          {n.body ? <span className="rp-notif-card__msg">{n.body}</span> : null}
          <span className="rp-notif-card__time">{formatNotifTime(n.createdAt, t)}</span>
        </button>
        <button
          type="button"
          onClick={() => onDismiss(n.id)}
          className="rp-notif-dismiss"
          data-testid={`notification-dismiss-${n.id}`}
        >
          {t("notif_dismiss")}
        </button>
      </div>
    </li>
  );
});

const ITEM_ESTIMATE = 128;
const OVERSCAN = 6;

/** Lista virtual leve (sem dependências) para a página completa. */
function VirtualNotifList({ items, t, onOpen, onDismiss }) {
  const parentRef = useRef(null);
  const [range, setRange] = useState({ start: 0, end: 12 });

  const updateRange = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const viewH = el.clientHeight || 600;
    const start = Math.max(0, Math.floor(scrollTop / ITEM_ESTIMATE) - OVERSCAN);
    const end = Math.min(items.length, Math.ceil((scrollTop + viewH) / ITEM_ESTIMATE) + OVERSCAN);
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, [items.length]);

  useEffect(() => {
    updateRange();
  }, [updateRange, items.length]);

  const slice = items.slice(range.start, range.end);
  const padTop = range.start * ITEM_ESTIMATE;
  const padBottom = Math.max(0, (items.length - range.end) * ITEM_ESTIMATE);

  return (
    <div
      ref={parentRef}
      className="rp-notif-virtual"
      onScroll={updateRange}
      data-testid="notifications-list-full"
    >
      <ul className="rp-notif-timeline">
        <li style={{ height: padTop, listStyle: "none", pointerEvents: "none" }} aria-hidden />
        {slice.map((n) => (
          <FullPageCard key={n.id} n={n} t={t} onOpen={onOpen} onDismiss={onDismiss} />
        ))}
        <li style={{ height: padBottom, listStyle: "none", pointerEvents: "none" }} aria-hidden />
      </ul>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="rp-notif-skel-list" data-testid="notifications-skeleton" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rp-notif-skel" style={{ animationDelay: `${i * 70}ms` }}>
          <div className="rp-notif-skel__ico" />
          <div className="rp-notif-skel__lines">
            <div className="rp-notif-skel__line rp-notif-skel__line--title" />
            <div className="rp-notif-skel__line" />
            <div className="rp-notif-skel__line rp-notif-skel__line--short" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lista de notificações (dropdown, perfil ou página completa). */
export default function NotificationListPanel({
  compact = false,
  fullPage = false,
  items: itemsOverride,
  onClose,
  loading = false,
}) {
  const { t } = useI18n();
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    clearAll,
    dismiss,
  } = useNotifications();
  const navigate = useNavigate();
  const [bgJobs, setBgJobs] = useState(() => activeBackgroundJobsCount());
  const list = itemsOverride ?? notifications;

  useEffect(() => {
    const sync = () => setBgJobs(activeBackgroundJobsCount());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("rp:credits-sync", sync);
    const id = window.setInterval(sync, 2500);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("rp:credits-sync", sync);
      window.clearInterval(id);
    };
  }, []);

  const openNotification = useCallback((n) => {
    markRead(n.id);
    onClose?.();
    if (n.creationId) {
      const cached = getCachedCreation(n.creationId);
      if (cached) seedGalleryFocus(cached);
    }
    if (n.href) {
      const qs = n.creationId ? `?focus=${encodeURIComponent(n.creationId)}` : "";
      navigate(`${n.href}${qs}`);
      return;
    }
    if (n.creationId) {
      navigate(`/app/gallery?focus=${encodeURIComponent(n.creationId)}`);
    }
  }, [markRead, onClose, navigate]);

  if (fullPage) {
    if (loading) return <NotificationsSkeleton />;

    return (
      <div className="rp-notif-full" data-testid="notifications-list-full-wrap">
        {bgJobs > 0 && (
          <div className="rp-notif-bg-banner">
            <span className="text-[13px] text-[#E9D5FF]">{t("notif_bg_jobs_label")}</span>
            <span className="text-[12px] font-mono font-semibold text-[#C4B5FD]">
              {bgJobs}/{MAX_CONCURRENT_BG_JOBS}
            </span>
          </div>
        )}
        {list.length === 0 ? (
          <div className="rp-notif-empty" data-testid="notifications-empty">
            <div className="rp-notif-empty__ico">
              <Bell className="w-9 h-9" strokeWidth={1.25} />
            </div>
            <h2 className="rp-notif-empty__title">{t("notif_empty_title")}</h2>
            <p className="rp-notif-empty__desc">{t("notif_empty")}</p>
          </div>
        ) : list.length > 24 ? (
          <VirtualNotifList
            items={list}
            t={t}
            onOpen={openNotification}
            onDismiss={dismiss}
          />
        ) : (
          <ul className="rp-notif-timeline" data-testid="notifications-list-full">
            {list.map((n) => (
              <FullPageCard
                key={n.id}
                n={n}
                t={t}
                onOpen={openNotification}
                onDismiss={dismiss}
              />
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-white/[0.08] bg-black/25 overflow-hidden"
          : "rounded-xl border border-[#7C3AED]/20 bg-gradient-to-b from-[#15131f] to-[#0f0f15] shadow-[0_0_30px_-18px_rgba(124,58,237,0.55)] overflow-hidden"
      }
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[#7C3AED]/15">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-4 h-4 text-[#A855F7] shrink-0" strokeWidth={1.75} />
          <p className="text-[13px] font-semibold truncate">{t("notif_panel_title")}</p>
          {bgJobs > 0 && (
            <span
              className="shrink-0 px-1.5 py-0.5 rounded-full bg-[#9333EA]/25 text-[10px] font-mono font-semibold text-[#C4B5FD]"
              title={t("notif_bg_jobs", { current: bgJobs, max: MAX_CONCURRENT_BG_JOBS })}
              data-testid="bg-jobs-badge"
            >
              {bgJobs}/{MAX_CONCURRENT_BG_JOBS}
            </span>
          )}
          {unreadCount > 0 && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-[#7C3AED]/30 text-[10px] font-semibold text-[#C4B5FD]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={markAllRead}
              className="p-1.5 rounded-lg text-[#8A8A8E] hover:text-white hover:bg-white/[0.06]"
              title={t("notif_mark_all_read")}
              aria-label={t("notif_mark_all_read")}
              data-testid="notifications-mark-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="p-1.5 rounded-lg text-[#8A8A8E] hover:text-red-200 hover:bg-red-500/10"
              title={t("notif_clear_all")}
              aria-label={t("notif_clear_all")}
              data-testid="notifications-clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className={`overflow-y-auto overscroll-contain ${compact ? "max-h-[200px]" : "max-h-[260px]"}`}>
        {notifications.length === 0 ? (
          <p className="px-3 py-8 text-center text-[#6b6b70] text-[12px]" data-testid="notifications-empty">
            {t("notif_empty")}
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className={`w-full text-left px-3 py-2.5 flex gap-2.5 hover:bg-[#7C3AED]/10 transition-colors ${
                    n.read ? "opacity-80" : "bg-[#7C3AED]/8"
                  }`}
                  data-testid={`notification-item-${n.type}`}
                >
                  <NotifIconBadge notification={n} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-medium leading-snug">{n.title}</span>
                    {n.body ? (
                      <span className="block text-[10px] text-[#8A8A8E] mt-0.5 leading-snug line-clamp-2">{n.body}</span>
                    ) : null}
                  </span>
                  {!n.read && (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#A855F7] mt-1.5" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <Link
          to="/app/gallery"
          onClick={() => onClose?.()}
          className="text-[11px] text-[#A855F7] hover:text-[#C4B5FD] font-medium"
          data-testid="notifications-gallery-link"
        >
          {t("notif_open_gallery")}
        </Link>
        <Link
          to="/app/notifications"
          onClick={() => onClose?.()}
          className="text-[11px] text-[#8A8A8E] hover:text-white font-medium md:hidden"
          data-testid="notifications-see-all"
        >
          {t("notif_see_all")}
        </Link>
      </div>
    </div>
  );
}
