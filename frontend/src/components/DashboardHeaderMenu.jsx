import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MoreVertical,
  Sparkles,
  Settings,
  HelpCircle,
  CreditCard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useI18n } from "../lib/i18n";
import SupportChat from "./SupportChat";

export default function DashboardHeaderMenu() {
  const { t } = useI18n();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#9333EA]/30 bg-white/[0.04] text-white/80 hover:text-white hover:border-[#A855F7]/50 hover:bg-[#7C3AED]/10 transition-all"
            data-testid="header-more-menu"
            aria-label={t("header_menu_label")}
          >
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#A855F7] shadow-[0_0_8px_2px_rgba(168,85,247,0.7)] animate-pulse" />
            <MoreVertical className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 p-2 bg-[#13131A] border border-[#9333EA]/25 text-[#F4F1EA] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.8)] z-[55]"
        >
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="w-full mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-left bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-[0_0_28px_-8px_rgba(168,85,247,0.55)] hover:brightness-110 transition-all"
            data-testid="header-menu-support-ai"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <Sparkles className="w-5 h-5" strokeWidth={1.75} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold leading-tight">{t("support_menu_title")}</span>
              <span className="block text-[10px] text-white/75 mt-0.5">{t("support_menu_sub")}</span>
            </span>
          </button>

          <DropdownMenuSeparator className="bg-white/[0.08]" />

          <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-white/[0.06] focus:text-white">
            <Link to="/app/settings" className="flex items-center gap-2" data-testid="header-menu-settings">
              <Settings className="w-4 h-4 text-[#A855F7]" />
              {t("sidebar_settings")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-white/[0.06] focus:text-white">
            <Link to="/app/billing" className="flex items-center gap-2" data-testid="header-menu-billing">
              <CreditCard className="w-4 h-4 text-[#A855F7]" />
              {t("sidebar_billing")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-white/[0.06] focus:text-white">
            <Link to="/app/wizard" className="flex items-center gap-2" data-testid="header-menu-wizard">
              <HelpCircle className="w-4 h-4 text-[#A855F7]" />
              {t("sidebar_wizard")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SupportChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
