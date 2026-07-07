import { Bell } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useI18n } from "../../lib/i18n";
import { useNotifications } from "../../lib/NotificationContext";
import NotificationListPanel from "./NotificationListPanel";

export default function NotificationBell({ compact = false }) {
  const { t } = useI18n();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`relative inline-flex items-center justify-center rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 text-[#BAE6FD] hover:border-[#38BDF8]/60 hover:bg-[#38BDF8]/15 transition-colors ${
            compact ? "h-9 w-9" : "h-10 w-10"
          }`}
          aria-label={t("notif_panel_title")}
          title={t("notif_panel_title")}
          data-testid="notification-bell"
        >
          <Bell className={compact ? "w-4 h-4" : "w-4.5 h-4.5"} strokeWidth={1.85} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#F43F5E] text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.6)] ring-2 ring-[#0B0B0C]"
              data-testid="notification-bell-badge"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(100vw-1.5rem,380px)] p-0 bg-transparent border-0 shadow-none z-[70]"
      >
        <NotificationListPanel onClose={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
