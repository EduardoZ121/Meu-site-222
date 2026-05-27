import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Settings,
  HelpCircle,
  CreditCard,
  User,
  Images,
  Heart,
  Users,
  ShieldCheck,
  LogOut,
  Globe,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { useNotifications } from "../lib/NotificationContext";
import { LANG_LABELS, LANG_ORDER } from "../lib/localeStrings";
import { setLanguageAndReload } from "../lib/remakepixLanguage";
import SupportChat from "./SupportChat";
import NotificationListPanel from "./notifications/NotificationListPanel";
import { useAssistLoop } from "../lib/AssistLoopContext";

function MenuLink({ to, icon: Icon, label, onNavigate, testId }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-[#E9E4DC] hover:bg-white/[0.06] transition-colors"
      data-testid={testId}
    >
      <Icon className="w-4 h-4 text-[#A855F7] shrink-0" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function LanguageSection({ lang, onPick }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="px-2 py-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[13px] text-[#8A8A8E] hover:text-white hover:bg-white/[0.06] transition-colors"
        data-testid="profile-menu-language-toggle"
      >
        <span className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-[#A855F7]" strokeWidth={1.75} />
          {t("profile_menu_language")}
        </span>
        <span className="flex items-center gap-1 text-[#C4B5FD] font-mono text-[11px]">
          {(lang || "en").toUpperCase()}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="mt-1 mb-1 rounded-lg border border-white/[0.06] bg-black/20 overflow-hidden">
          {LANG_ORDER.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onPick(code)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
                lang === code
                  ? "text-white bg-[#7C3AED]/20"
                  : "text-[#8A8A8E] hover:text-white hover:bg-white/[0.04]"
              }`}
              data-testid={`profile-lang-${code}`}
            >
              <span>{LANG_LABELS[code]}</span>
              {lang === code ? <Check className="w-3.5 h-3.5 text-[#A855F7]" /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardProfileMenu() {
  const { user, logout } = useAuth();
  const { t, lang } = useI18n();
  const { unreadCount } = useNotifications();
  const { enabled: assistLoopEnabled, ready: assistLoopReady, openSofia } = useAssistLoop();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const useAssistLoopChat = assistLoopEnabled && assistLoopReady;

  if (!user) return null;

  const initial = (user.name || user.email || "?").slice(0, 1).toUpperCase();
  const displayName = user.name || user.email?.split("@")[0] || t("profile_menu_guest");

  const closeMenu = () => setMenuOpen(false);

  const pickLanguage = (code) => {
    closeMenu();
    if (code !== lang) setLanguageAndReload(code);
  };

  const accountLinks = [
    { to: "/app/profile", icon: User, label: t("sidebar.profile"), testId: "profile-menu-profile" },
    { to: "/app/gallery", icon: Images, label: t("sidebar.gallery"), testId: "profile-menu-gallery" },
    { to: "/app/favorites", icon: Heart, label: t("sidebar.favorites"), testId: "profile-menu-favorites" },
    { to: "/app/billing", icon: CreditCard, label: t("sidebar.billing"), testId: "profile-menu-billing" },
    { to: "/app/referrals", icon: Users, label: t("sidebar.referrals"), testId: "profile-menu-referrals" },
    { to: "/app/settings", icon: Settings, label: t("sidebar.settings"), testId: "profile-menu-settings" },
    { to: "/app/wizard", icon: HelpCircle, label: t("sidebar.wizard"), testId: "profile-menu-wizard" },
  ];

  if (user.role === "admin") {
    accountLinks.push({
      to: "/app/admin",
      icon: ShieldCheck,
      label: t("nav_admin"),
      testId: "profile-menu-admin",
    });
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#1a1a24] to-[#0B0B0C] border border-[#9333EA]/35 hover:border-[#A855F7]/70 flex items-center justify-center text-white text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_-6px_rgba(168,85,247,0.55)]"
            data-testid="header-avatar"
            aria-label={t("profile_menu_open")}
          >
            {initial}
            {(unreadCount > 0) && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.6)] ring-2 ring-[#0B0B0C]"
                data-testid="profile-menu-notif-badge"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-[min(100vw-1.5rem,380px)] p-0 bg-[#13131A] border border-[#9333EA]/25 text-[#F4F1EA] shadow-[0_20px_56px_-12px_rgba(0,0,0,0.9)] z-[55] max-h-[min(85vh,640px)] overflow-hidden flex flex-col"
        >
          {/* Conta */}
          <div className="px-4 py-4 border-b border-white/[0.08] bg-gradient-to-br from-[#7C3AED]/10 to-transparent">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7C3AED]/40 to-[#9333EA]/20 border border-[#A855F7]/40 flex items-center justify-center text-lg font-semibold shrink-0">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold truncate">{displayName}</p>
                <p className="text-[11px] text-[#8A8A8E] truncate">{user.email}</p>
                <Link
                  to="/app/billing"
                  onClick={closeMenu}
                  className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full border border-[#9333EA]/30 bg-black/30 text-[11px] font-mono hover:border-[#A855F7]/50 transition-colors"
                  data-testid="profile-menu-credits"
                >
                  <span className="text-[#8A8A8E] uppercase tracking-wider">{t("header.credits")}</span>
                  <span className="text-[#A855F7] font-semibold tabular-nums">
                    {user.is_unlimited ? "∞" : user.credits}
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 overscroll-contain">
            {/* Chat IA */}
            <div className="p-3">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  if (useAssistLoopChat && openSofia()) return;
                  setChatOpen(true);
                }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-[0_0_28px_-8px_rgba(168,85,247,0.55)] hover:brightness-110 transition-all"
                data-testid="profile-menu-support-ai"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 shrink-0">
                  <Sparkles className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight">{t("support_menu_title")}</span>
                  <span className="block text-[10px] text-white/75 mt-0.5">{t("support_menu_sub")}</span>
                </span>
              </button>
            </div>

            {/* Notificações */}
            <div className="px-3 pb-3">
              <NotificationListPanel compact />
            </div>

            {/* Atalhos */}
            <div className="px-2 pb-2">
              <p className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#6b6b70]">
                {t("profile_menu_account")}
              </p>
              <nav className="flex flex-col">
                {accountLinks.map((item) => (
                  <MenuLink
                    key={item.to}
                    {...item}
                    onNavigate={closeMenu}
                  />
                ))}
              </nav>
            </div>

            {/* Idioma */}
            <div className="border-t border-white/[0.08]">
              <LanguageSection lang={lang} onPick={pickLanguage} />
            </div>
          </div>

          {/* Sair */}
          <div className="p-2 border-t border-white/[0.08] bg-black/20">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                logout();
                navigate("/");
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-[#8A8A8E] hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-colors"
              data-testid="profile-menu-logout"
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              {t("btn_logout")}
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {!useAssistLoopChat ? (
        <SupportChat open={chatOpen} onClose={() => setChatOpen(false)} />
      ) : null}
    </>
  );
}
