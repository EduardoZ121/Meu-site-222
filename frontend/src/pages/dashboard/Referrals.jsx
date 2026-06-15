import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import {
  Copy, Check, Share2, Users, Gift, Sparkles, Send, ArrowRight, MessageCircle,
} from "lucide-react";
import useTitle from "../../lib/useTitle";
import { api } from "../../lib/api";

/** Premium referral / share page. Big code + link + WhatsApp/social CTAs +
 *  3-step "Como funciona" + earned-credits widget. */
export default function Referrals() {
  const { t } = useI18n();
  useTitle(t("sidebar_referrals"));
  const { user } = useAuth();
  const [stats, setStats] = useState({ referred_count: 0, credits_earned: 0, reward_per_referral: 0 });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    api.get("/me/referrals/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!user) return null;
  const link = `${window.location.origin}/register?ref=${user.referral_code}`;
  const shareMsg = t("ref_share_msg", { code: user.referral_code, link });

  const copy = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("ref_copied_toast"));
      const setter = which === "code" ? setCopiedCode : setCopiedLink;
      setter(true); setTimeout(() => setter(false), 1800);
    } catch {
      toast.error(t("ref_copy_fail"));
    }
  };

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, "_blank");
  const shareTelegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareMsg)}`, "_blank");
  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Remake Pixel", text: shareMsg, url: link }); } catch { /* user cancel */ }
    } else copy(shareMsg, "link");
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-20" data-testid="referrals-page">
      {/* === Header === */}
      <header className="mb-12">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-3">{t("ref_share_eyebrow")}</p>
        <h1 className="text-[#F4F1EA] font-light leading-[1.05] tracking-[-0.02em] text-[42px] md:text-[56px] mb-5">
          {t("ref_title")}
        </h1>
        <p className="text-[#8A8A8E] text-[15px] max-w-[620px] leading-relaxed">
          {stats.reward_per_referral > 0 ? (
            <>
              {t("ref_intro")}{" "}
              <span className="text-[#C4B5FD] font-medium">{stats.reward_per_referral} {t("credits")}</span>. {t("ref_intro_suffix")}
            </>
          ) : (
            t("ref_intro_paused")
          )}
        </p>
      </header>

      {/* === Stats row === */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-10">
        <StatCard icon={<Users className="w-5 h-5" />} label={t("ref_stat_invited")} value={stats.referred_count} suffix={t("ref_stat_invited_suffix")} testId="stat-referred" />
        <StatCard icon={<Gift className="w-5 h-5" />} label={t("ref_stat_earned")} value={stats.credits_earned} suffix={t("ref_stat_earned_suffix")} highlight testId="stat-earned" />
        <StatCard icon={<Sparkles className="w-5 h-5" />} label={t("ref_stat_per")} value={`+${stats.reward_per_referral}`} suffix={t("ref_stat_per_suffix")} testId="stat-reward" />
      </section>

      {/* === Code card === */}
      <section className="relative overflow-hidden rounded-2xl border border-[#7C3AED]/30 bg-gradient-to-br from-[#1B0D3A] via-[#13131A] to-[#0B0B0C] p-8 md:p-10 mb-6" data-testid="referral-card">
        <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-[#9333EA]/15 blur-3xl pointer-events-none" />

        <div className="relative">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C4B5FD] mb-4">{t("ref_code_title")}</p>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <div className="flex-1 px-6 py-5 rounded-xl bg-[#0B0B0C]/60 border border-[#7C3AED]/40 backdrop-blur-sm">
              <p className="font-heading text-[40px] md:text-[52px] text-[#F4F1EA] tracking-[0.12em] leading-none break-all" data-testid="referral-code">
                {user.referral_code}
              </p>
            </div>
            <button onClick={() => copy(user.referral_code, "code")} className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#8B5CF6] hover:to-[#A855F7] text-white text-[12px] font-mono uppercase tracking-[0.16em] shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50 hover:-translate-y-0.5 transition-all whitespace-nowrap" data-testid="copy-code">
              {copiedCode ? (<><Check className="w-4 h-4" /> {t("ref_copied_toast")}</>) : (<><Copy className="w-4 h-4" /> {t("ref_copy_code")}</>)}
            </button>
          </div>

          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C4B5FD] mb-3">{t("ref_link_title")}</p>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0B0B0C]/60 border border-[#2E2E30] mb-6">
            <code className="flex-1 truncate text-[#F4F1EA] text-[13px] font-mono" data-testid="referral-link">{link}</code>
            <button onClick={() => copy(link, "link")} className="shrink-0 p-2 rounded-md text-[#C4B5FD] hover:bg-[#7C3AED]/10 transition-colors" data-testid="copy-link" aria-label={t("ref_copy_link_aria")}>
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <ShareButton onClick={shareWhatsApp} icon={<MessageCircle className="w-4 h-4" />} testId="share-whatsapp">{t("ref_whatsapp")}</ShareButton>
            <ShareButton onClick={shareTelegram} icon={<Send className="w-4 h-4" />} testId="share-telegram">{t("ref_telegram")}</ShareButton>
            <ShareButton onClick={shareNative} icon={<Share2 className="w-4 h-4" />} testId="share-other">{t("ref_other_apps")}</ShareButton>
          </div>
        </div>
      </section>

      {/* === Como funciona === */}
      <section className="mt-12">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] mb-5">{t("ref_how")}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <StepCard n={1} title={t("ref_step1_title")} desc={t("ref_step1_desc")} />
          <StepCard n={2} title={t("ref_step2_title")} desc={t("ref_step2_desc")} />
          <StepCard n={3} title={t("ref_step3_title")} desc={t("ref_step3_desc", { n: stats.reward_per_referral })} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, suffix, highlight, testId }) {
  return (
    <div className={`rounded-xl border p-5 transition-colors ${highlight ? "border-[#7C3AED]/40 bg-[#7C3AED]/10" : "border-[#2E2E30] bg-[#0F0F12]"}`} data-testid={testId}>
      <div className={`flex items-center gap-2 mb-3 ${highlight ? "text-[#C4B5FD]" : "text-[#7C3AED]"}`}>
        {icon}
        <p className="text-[10px] font-mono uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="text-[#F4F1EA] text-[34px] font-light leading-none tracking-tight">{value}</p>
      <p className="text-[#8A8A8E] text-[11px] font-mono uppercase tracking-[0.12em] mt-1">{suffix}</p>
    </div>
  );
}

function ShareButton({ onClick, icon, children, testId }) {
  return (
    <button onClick={onClick} data-testid={testId}
      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#2E2E30] bg-[#0B0B0C]/40 hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] text-[#F4F1EA] text-[11px] font-mono uppercase tracking-[0.14em] transition-all">
      {icon}{children}
    </button>
  );
}

function StepCard({ n, title, desc }) {
  return (
    <div className="relative rounded-xl border border-[#2E2E30] bg-[#0F0F12] hover:bg-[#13131A] hover:border-[#5A5A5E] p-5 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex w-9 h-9 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 items-center justify-center text-[#C4B5FD] font-mono text-[14px]">
          {n}
        </span>
        <ArrowRight className="w-4 h-4 text-[#5A5A5E] group-hover:text-[#C4B5FD] transition-colors" />
      </div>
      <h3 className="text-[#F4F1EA] text-[16px] font-medium tracking-tight mb-1.5">{title}</h3>
      <p className="text-[#8A8A8E] text-[13px] leading-relaxed">{desc}</p>
    </div>
  );
}
