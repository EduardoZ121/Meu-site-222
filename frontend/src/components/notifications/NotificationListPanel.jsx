import { useEffect, useState } from "react";
import { Bell, CheckCheck, ImageIcon, Coins, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../lib/NotificationContext";
import { useI18n } from "../../lib/i18n";
import { activeBackgroundJobsCount, MAX_CONCURRENT_BG_JOBS } from "../../lib/bgGeneration";

function NotifIcon({ type }) {
  if (type === "generation") {
    return <ImageIcon className="w-4 h-4 text-[#A855F7] shrink-0" strokeWidth={1.75} />;
  }
  return <Coins className="w-4 h-4 text-[#A855F7] shrink-0" strokeWidth={1.75} />;
}

/** Lista de notificações (usada dentro do menu de perfil). */
export default function NotificationListPanel({ compact = false }) {
  const { t } = useI18n();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const navigate = useNavigate();
  const [bgJobs, setBgJobs] = useState(() => activeBackgroundJobsCount());

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

  const openNotification = (n) => {
    markRead(n.id);
    if (n.href) {
      const qs = n.creationId ? `?focus=${encodeURIComponent(n.creationId)}` : "";
      navigate(`${n.href}${qs}`);
      return;
    }
    if (n.creationId) {
      navigate(`/app/gallery?focus=${encodeURIComponent(n.creationId)}`);
    }
  };

  return (
    <div className={compact ? "" : "rounded-xl border border-[#7C3AED]/20 bg-gradient-to-b from-[#15131f] to-[#0f0f15] shadow-[0_0_30px_-18px_rgba(124,58,237,0.55)] overflow-hidden"}>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[#7C3AED]/15">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-4 h-4 text-[#A855F7] shrink-0" strokeWidth={1.75} />
          <p className="text-[13px] font-semibold truncate">{t("notif_panel_title")}</p>
          {bgJobs > 0 && (
            <span
              className="shrink-0 px-1.5 py-0.5 rounded-full bg-[#9333EA]/25 text-[10px] font-mono font-semibold text-[#C4B5FD]"
              title="Gerações em segundo plano"
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
              data-testid="notifications-mark-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="p-1.5 rounded-lg text-[#8A8A8E] hover:text-white hover:bg-white/[0.06]"
              title={t("notif_clear_all")}
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
                  <NotifIcon type={n.type} />
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

      <div className="px-3 py-2 border-t border-white/[0.06]">
        <Link
          to="/app/gallery"
          className="text-[11px] text-[#A855F7] hover:text-[#C4B5FD] font-medium"
          data-testid="notifications-gallery-link"
        >
          {t("notif_open_gallery")}
        </Link>
      </div>
    </div>
  );
}
