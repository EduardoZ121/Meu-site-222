import { Bell, CheckCheck, ImageIcon, Coins, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNotifications } from "../lib/NotificationContext";
import { useI18n } from "../lib/i18n";

function NotifIcon({ type }) {
  if (type === "generation") {
    return <ImageIcon className="w-4 h-4 text-[#A855F7] shrink-0" strokeWidth={1.75} />;
  }
  return <Coins className="w-4 h-4 text-[#A855F7] shrink-0" strokeWidth={1.75} />;
}

export default function NotificationBell() {
  const { t } = useI18n();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#9333EA]/30 bg-white/[0.04] text-white/80 hover:text-white hover:border-[#A855F7]/50 hover:bg-[#7C3AED]/10 transition-all"
          data-testid="notifications-bell"
          aria-label={t("notif_bell_label")}
        >
          <Bell className="w-5 h-5" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-semibold text-white shadow-[0_0_10px_rgba(168,85,247,0.6)]"
              data-testid="notifications-unread-badge"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(100vw-2rem,360px)] p-0 bg-[#13131A] border border-[#9333EA]/25 text-[#F4F1EA] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.85)] z-[55] max-h-[min(70vh,480px)] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.08]">
          <p className="text-sm font-semibold">{t("notif_panel_title")}</p>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="p-2 rounded-lg text-[#8A8A8E] hover:text-white hover:bg-white/[0.06]"
                  title={t("notif_mark_all_read")}
                  data-testid="notifications-mark-all"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-2 rounded-lg text-[#8A8A8E] hover:text-white hover:bg-white/[0.06]"
                  title={t("notif_clear_all")}
                  data-testid="notifications-clear"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain">
          {notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-[#6b6b70] text-sm" data-testid="notifications-empty">
              {t("notif_empty")}
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-white/[0.04] transition-colors ${
                      n.read ? "opacity-70" : "bg-[#7C3AED]/5"
                    }`}
                    data-testid={`notification-item-${n.type}`}
                  >
                    <NotifIcon type={n.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-snug">{n.title}</span>
                      {n.body ? (
                        <span className="block text-[11px] text-[#8A8A8E] mt-0.5 leading-snug">{n.body}</span>
                      ) : null}
                      <span className="block text-[9px] text-[#5A5A5E] font-mono mt-1 uppercase tracking-wider">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </span>
                    {!n.read && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-[#A855F7] mt-1.5" aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-white/[0.08]">
          <Link
            to="/app/gallery"
            className="text-[11px] text-[#A855F7] hover:text-[#C4B5FD] font-medium"
            data-testid="notifications-gallery-link"
          >
            {t("notif_open_gallery")}
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
