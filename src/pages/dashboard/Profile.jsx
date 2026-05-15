import { Link } from "react-router-dom";
import { Copy, CreditCard, Settings, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LOCALE = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR" };

function userInitials(user) {
  const n = (user.name || "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  const e = user.email || "";
  return e.slice(0, 2).toUpperCase() || "—";
}

function displayName(user) {
  const n = (user.name || "").trim();
  if (n) return n;
  return user.email?.split("@")[0] || "—";
}

function roleLabel(user, t) {
  if (user.role === "admin") return t("prof_role_admin");
  return t("prof_role_user");
}

export default function Profile() {
  const { t, lang } = useI18n();
  useTitle(t("sidebar_profile"));
  const { user } = useAuth();
  if (!user) return null;

  const locale = LOCALE[lang] || LOCALE.pt;
  const memberSince = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(user.created_at));

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      toast.success(t("prof_id_copied"));
    } catch {
      toast.error(t("prof_id_copy_failed"));
    }
  };

  const copyReferral = async () => {
    if (!user.referral_code) return;
    try {
      await navigator.clipboard.writeText(user.referral_code);
      toast.success(t("ref_copied"));
    } catch {
      toast.error(t("prof_id_copy_failed"));
    }
  };

  return (
    <div className="max-w-[960px] mx-auto space-y-10" data-testid="profile-page">
      <header className="space-y-2">
        <p className="eyebrow">{t("prof_eyebrow")}</p>
        <h1 className="text-[28px] md:text-[34px] font-light tracking-[-0.03em] text-rp-text leading-tight font-heading">
          {t("prof_title")}
        </h1>
        <p className="text-rp-mute text-[15px] max-w-[520px] leading-relaxed">{t("prof_subtitle")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
        <Card className="border-rp-border bg-rp-surface/40 shadow-none overflow-hidden">
          <CardHeader className="pb-4 border-b border-rp-border/80 bg-gradient-to-b from-rp-surfaceRaised/30 to-transparent">
            <div className="flex flex-col items-center text-center pt-2">
              <Avatar className="h-20 w-20 border border-rp-border shadow-md ring-2 ring-rp-purple/15">
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt="" className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-rp-surfaceRaised text-rp-text text-lg font-medium tracking-tight font-heading">
                  {userInitials(user)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-5 text-xl font-medium tracking-tight text-rp-text font-heading">
                {displayName(user)}
              </CardTitle>
              <CardDescription className="text-[13px] text-rp-mute mt-1.5 break-all max-w-full">
                {user.email}
              </CardDescription>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-mono uppercase tracking-[0.14em] border px-2.5 py-0.5",
                    user.role === "admin"
                      ? "border-rp-purple/40 text-rp-lavender bg-rp-purple/10"
                      : "border-rp-border text-rp-mute2 bg-rp-bg/60"
                  )}
                >
                  {roleLabel(user, t)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="rounded-lg border border-rp-border bg-rp-bg/50 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-1">{t("prof_balance")}</p>
              <p className="text-rp-text tabular-nums">
                <span className="text-2xl font-heading text-rp-lavender">{user.credits}</span>
                <span className="text-[13px] text-rp-mute ml-2">{t("credits")}</span>
              </p>
            </div>
            <p className="text-center text-[11px] text-rp-mute2 leading-relaxed">{t("prof_since")}</p>
            <p className="text-center text-[13px] text-rp-mute font-mono tabular-nums">{memberSince}</p>
          </CardContent>
        </Card>

        <div className="space-y-6 min-w-0">
          <Card className="border-rp-border bg-rp-surface/30 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-medium text-rp-text tracking-tight">{t("prof_detail_title")}</CardTitle>
              <CardDescription className="text-[13px]">{t("prof_detail_hint")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-rp-border/80">
              <DetailRow
                label={t("prof_name")}
                value={(user.name || "").trim() || t("prof_no_display_name")}
                muted={!(user.name || "").trim()}
              />
              <DetailRow label={t("prof_email")} value={user.email} mono />
              <DetailRow label={t("prof_language")} value={(user.lang || "pt").toUpperCase()} />
              <DetailRow label={t("prof_account_id")} value={user.id} mono small />
            </CardContent>
          </Card>

          {user.referral_code ? (
            <Card className="border-rp-border bg-rp-surface/30 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px] font-medium text-rp-text tracking-tight">{t("ref_code_label")}</CardTitle>
                <CardDescription className="text-[13px]">{t("prof_referral_hint")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-3 rounded-md border border-rp-border bg-rp-bg/60 px-3 py-2.5">
                  <code className="text-[13px] font-mono text-rp-lavender tracking-wide truncate">{user.referral_code}</code>
                  <Button type="button" variant="ghost" size="sm" className="shrink-0 h-8 text-rp-mute hover:text-rp-text" onClick={copyReferral}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-rp-mute2 px-0.5">{t("prof_actions")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <ShortcutLink to="/app/settings" icon={Settings} label={t("prof_open_settings")} testId="profile-link-settings" />
              <ShortcutLink to="/app/billing" icon={CreditCard} label={t("prof_open_billing")} testId="profile-link-billing" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="border-rp-border text-rp-mute hover:text-rp-text" onClick={copyId}>
              <Copy className="w-3.5 h-3.5" />
              {t("prof_copy_id")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, small, muted }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-4 first:pt-0 last:pb-0">
      <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-rp-mute2 sm:w-[140px] shrink-0 pt-0.5">{label}</p>
      <p
        className={cn(
          "text-[14px] text-rp-text leading-snug break-all min-w-0 flex-1",
          mono && "font-mono text-[13px]",
          small && "text-[12px]",
          muted && "text-rp-mute italic"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ShortcutLink({ to, icon: Icon, label, testId }) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className="group flex items-center justify-between gap-3 rounded-lg border border-rp-border bg-rp-bg/40 px-4 py-3.5 transition-colors hover:border-rp-purple/35 hover:bg-rp-surfaceRaised/20"
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-rp-border bg-rp-surface text-rp-mute group-hover:text-rp-lavender transition-colors">
          <Icon className="w-4 h-4" strokeWidth={1.5} />
        </span>
        <span className="text-[13px] text-rp-text font-medium truncate">{label}</span>
      </span>
      <ChevronRight className="w-4 h-4 text-rp-mute2 group-hover:text-rp-mute shrink-0" />
    </Link>
  );
}
