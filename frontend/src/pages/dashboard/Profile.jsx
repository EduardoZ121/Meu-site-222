import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";
import { toast } from "sonner";
import { compressImage, looksLikeImageFile } from "../../lib/imageCompress";
import {
  Coins,
  Mail,
  Globe,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  ArrowUpRight,
  Pencil,
  Camera,
  CheckCircle2,
  AlertCircle,
  Copy,
  Settings,
  CreditCard,
  Images,
  ChevronRight,
  Hash,
  Sparkles,
} from "lucide-react";

export default function Profile() {
  const { t, lang } = useI18n();
  useTitle(t("sidebar_profile"));
  const { user, updateProfile, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name, user?.id]);

  useEffect(() => {
    if (editing && nameInputRef.current) nameInputRef.current.focus();
  }, [editing]);

  if (!user) return null;

  const joined = new Date(user.created_at).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const roleLabel = user.role === "admin" ? t("prof_role_admin") : t("prof_role_member");
  const emailVerified = !!user.email_verified;
  const avatarInitial = (user.name || user.email || "?").charAt(0).toUpperCase();
  const displayName = user.name || user.email.split("@")[0];
  const referral = (user.referral_code || "").trim();
  const shortId = String(user.id || "").length > 14
    ? `${String(user.id).slice(0, 10)}…${String(user.id).slice(-4)}`
    : String(user.id || "—");

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message || t("prof_copied"));
    } catch {
      toast.error(t("prof_copy_fail"));
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    if (!looksLikeImageFile(file)) {
      toast.error(t("prof_avatar_type"));
      return;
    }
    try {
      const small = await compressImage(file, { maxSize: 512, quality: 0.82 });
      const avatar_url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(small);
      });
      await updateProfile({ avatar_url });
      toast.success(t("prof_avatar_ok"));
    } catch (e) {
      toast.error(e?.message || t("prof_avatar_fail"));
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() || user.email.split("@")[0] });
      setEditing(false);
      toast.success(t("prof_name_ok"));
    } catch {
      toast.error(t("prof_save_fail"));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(user.name || user.email.split("@")[0]);
    setEditing(false);
  };

  const confirmEmail = async () => {
    await verifyEmail();
    toast.success(t("prof_email_confirmed"));
  };

  return (
    <div className="max-w-[1100px] mx-auto pb-24" data-testid="profile-page">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-rp-border pb-8">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-2">
            {t("prof_page_eyebrow")}
          </p>
          <h1 className="text-rp-text font-['Inter_Tight'] font-semibold tracking-[-0.03em] text-[32px] sm:text-[40px] leading-[1.08]">
            {t("prof_page_title")}
          </h1>
          <p className="text-rp-mute text-[14px] mt-2 max-w-[520px] leading-relaxed">
            {t("prof_page_desc")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            to="/app/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rp-border text-rp-text text-[12px] font-medium hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/5 transition-colors"
          >
            <Settings className="w-4 h-4 text-[#C4B5FD]" strokeWidth={1.5} />
            {t("prof_settings")}
          </Link>
          <button
            type="button"
            onClick={() => navigate("/app/billing")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7C3AED] text-white text-[12px] font-medium hover:bg-[#6D28D9] transition-colors shadow-lg shadow-[#7C3AED]/25"
            data-testid="profile-billing-btn"
          >
            <CreditCard className="w-4 h-4" strokeWidth={1.5} />
            {t("prof_billing")}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 space-y-6">
          <section
            className="rounded-2xl border border-rp-border bg-rp-surface overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]"
            data-testid="profile-hero"
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#7C3AED]/40 to-transparent" />
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start gap-8">
                <div className="flex flex-col items-center sm:items-start shrink-0">
                  <div className="relative group">
                    <div className="w-[112px] h-[112px] rounded-full ring-2 ring-rp-border ring-offset-4 ring-offset-rp-surface overflow-hidden bg-gradient-to-br from-rp-purple to-[#4C1D95] flex items-center justify-center text-white text-[42px] font-light">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-rp-border bg-[#13131A] text-rp-text shadow-md hover:border-[#7C3AED] hover:bg-[#1a1a22] transition-colors">
                      <Camera className="h-4 w-4" strokeWidth={1.5} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => uploadAvatar(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.14em] text-rp-mute2 text-center sm:text-left">
                    JPG / PNG · compressão automática
                  </p>
                </div>

                <div className="min-w-0 flex-1 space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#7C3AED]/35 bg-[#7C3AED]/10 text-[11px] font-mono uppercase tracking-[0.12em] text-[#C4B5FD]"
                        data-testid="profile-role"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {roleLabel}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono uppercase tracking-[0.1em] ${
                          emailVerified
                            ? "border-emerald-500/25 text-emerald-300/95 bg-emerald-500/10"
                            : "border-amber-500/25 text-amber-200/95 bg-amber-500/10"
                        }`}
                      >
                        {emailVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {emailVerified ? "Email verificado" : "Email por verificar"}
                      </span>
                    </div>

                    {editing ? (
                      <div className="space-y-3">
                        <label className="block text-[11px] font-mono uppercase tracking-[0.16em] text-rp-mute">
                          Nome público
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            ref={nameInputRef}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="field-input flex-1 !py-2.5"
                            placeholder="O teu nome ou marca"
                            maxLength={80}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={saveProfile}
                              disabled={saving}
                              className="btn-primary !py-2.5 !px-5 shrink-0"
                            >
                              {saving ? "…" : "Guardar"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={saving}
                              className="px-4 py-2.5 rounded-lg border border-rp-border text-rp-mute text-[13px] hover:text-rp-text hover:border-[#3f3f42] transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <h2
                        className="text-rp-text text-[26px] sm:text-[30px] font-light leading-tight tracking-tight font-['Inter_Tight']"
                        data-testid="profile-name"
                      >
                        {displayName}
                      </h2>
                    )}
                  </div>

                  <div
                    className="rounded-xl border border-rp-border bg-rp-bg/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    data-testid="info-email"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Mail className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-rp-mute2 mb-0.5">
                          Email de sessão
                        </p>
                        <p className="text-rp-text text-[14px] truncate" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyText(user.email, "Email copiado.")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rp-border text-[11px] font-mono uppercase tracking-[0.1em] text-[#C4B5FD] hover:border-[#7C3AED]/40 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </button>
                      {!emailVerified && (
                        <button
                          type="button"
                          onClick={confirmEmail}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 text-[11px] font-mono uppercase tracking-[0.1em] text-amber-200 hover:bg-amber-500/10 transition-colors"
                        >
                          Confirmar
                        </button>
                      )}
                    </div>
                  </div>

                  {!editing && (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.14em] text-[#C4B5FD] hover:text-[#E9D5FF] border-b border-transparent hover:border-[#C4B5FD]/50 pb-0.5 transition-colors"
                      data-testid="profile-edit-btn"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Editar nome público
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-rp-border bg-rp-surface p-6 sm:p-8">
            <h3 className="text-rp-text text-[15px] font-medium font-['Inter_Tight'] mb-1">
              Dados da conta
            </h3>
            <p className="text-rp-mute text-[13px] mb-6 leading-relaxed">
              Informação técnica e preferências. O ID é útil para suporte.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow
                icon={<Calendar className="w-4 h-4" strokeWidth={1.5} />}
                label="Membro desde"
                value={joined}
                testId="info-joined"
              />
              <DetailRow
                icon={<Globe className="w-4 h-4" strokeWidth={1.5} />}
                label={t("prof_interface_lang")}
                value={(lang || "en").toUpperCase()}
                testId="info-lang"
              />
              <DetailRow
                icon={<Hash className="w-4 h-4" strokeWidth={1.5} />}
                label="ID da conta"
                value={shortId}
                mono
                action={
                  <button
                    type="button"
                    onClick={() => copyText(String(user.id), t("prof_id_copied"))}
                    className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#7C3AED] hover:text-[#C4B5FD]"
                  >
                    {t("prof_copy_full_id")}
                  </button>
                }
                testId="info-account-id"
              />
              {referral ? (
                <DetailRow
                  icon={<UserIcon className="w-4 h-4" strokeWidth={1.5} />}
                  label={t("prof_referral_code")}
                  value={referral}
                  mono
                  action={
                    <button
                      type="button"
                      onClick={() => copyText(referral, t("prof_code_copied"))}
                      className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#7C3AED] hover:text-[#C4B5FD]"
                    >
                      {t("prof_copy")}
                    </button>
                  }
                />
              ) : (
                <DetailRow
                  icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />}
                  label={t("prof_referrals_label")}
                  value={t("prof_no_referral")}
                  action={
                    <Link
                      to="/app/referrals"
                      className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#7C3AED] hover:text-[#C4B5FD] inline-flex items-center gap-1"
                    >
                      {t("prof_view_referrals")}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  }
                />
              )}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <section
            className="rounded-2xl border border-rp-purple/30 bg-gradient-to-b from-[#161028] to-rp-bg p-6 shadow-[0_24px_48px_-24px_rgba(124,58,237,0.4)] backdrop-blur-sm"
            data-testid="profile-credits-card"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/35 flex items-center justify-center">
                <Coins className="w-5 h-5 text-[#C4B5FD]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#C4B5FD]/90">
                  {t("prof_balance")}
                </p>
                <p className="text-rp-mute text-[12px]">{t("prof_credits_gen")}</p>
              </div>
            </div>
            <p
              className="text-rp-text text-[44px] sm:text-[52px] font-light leading-none tracking-tight font-['Inter_Tight'] mb-6"
              data-testid="profile-balance"
            >
              {user.is_unlimited ? "∞" : user.credits?.toLocaleString("pt-PT")}
            </p>
            <Link
              to="/app/billing"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-[12px] font-mono uppercase tracking-[0.14em] text-white hover:bg-[#6D28D9] transition-colors"
              data-testid="profile-buy-credits"
            >
              {t("prof_buy_credits")}
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
            {user.is_unlimited && (
              <p className="mt-3 text-[11px] text-rp-mute leading-snug">
                {t("prof_unlimited_hint")}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-rp-border bg-rp-surface p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rp-mute2 mb-4">
              {t("prof_quick_links")}
            </p>
            <nav className="space-y-1">
              <QuickLink to="/app/gallery" icon={<Images className="w-4 h-4" strokeWidth={1.5} />} label={t("sidebar_gallery")} />
              <QuickLink to="/app/generate" icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />} label={t("prof_studio")} />
              <QuickLink to="/app/referrals" icon={<UserIcon className="w-4 h-4" strokeWidth={1.5} />} label={t("prof_invite_friends")} />
            </nav>
          </section>

          <section className="rounded-2xl border border-dashed border-rp-border bg-rp-bg/50 px-5 py-4">
            <p className="text-[12px] text-rp-mute leading-relaxed">
              Palavra-passe e preferências de geração estão em{" "}
              <Link to="/app/settings" className="text-[#C4B5FD] hover:underline">
                {t("prof_settings")}
              </Link>
              . Recuperação de acesso:{" "}
              <Link to="/forgot-password" className="text-[#C4B5FD] hover:underline">
                Esqueci a palavra-passe
              </Link>
              .
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, mono, action, testId }) {
  return (
    <div
      className="rounded-xl border border-rp-border bg-rp-bg/60 px-4 py-4 flex flex-col gap-2"
      data-testid={testId}
    >
      <div className="flex items-center gap-2 text-[#7C3AED]">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-rp-mute">
          {label}
        </span>
      </div>
      <p
        className={`text-rp-text text-[15px] font-light tracking-tight ${mono ? "font-mono text-[13px] break-all" : ""}`}
      >
        {value}
      </p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

function QuickLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-rp-text text-[13px] hover:bg-[#13131A] border border-transparent hover:border-rp-border transition-colors group"
    >
      <span className="flex items-center gap-3">
        <span className="text-[#7C3AED]">{icon}</span>
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-rp-mute2 group-hover:text-[#C4B5FD] transition-colors" strokeWidth={1.5} />
    </Link>
  );
}
