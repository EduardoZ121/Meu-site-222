import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import useTitle from "../../lib/useTitle";

export default function Referrals() {
  const { t } = useI18n();
  useTitle(t("sidebar_referrals"));
  const { user } = useAuth();
  if (!user) return null;
  const link = `${window.location.origin}/register?ref=${user.referral_code}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success(t("ref_copied"));
  };

  return (
    <div className="max-w-[760px] mx-auto" data-testid="referrals-page">
      <p className="eyebrow mb-3">{t("ref_eyebrow")}</p>
      <h1 className="heading-xl mb-6">{t("ref_title_a")} <span className="italic text-rp-lavender">{t("ref_title_b")}</span>{t("ref_title_dot")}</h1>
      <p className="body-text mb-12">{t("ref_intro")} <span className="text-rp-lavender">{t("ref_intro_2")}</span>.</p>

      <div className="border border-rp-border p-8 mb-10" data-testid="referral-card">
        <p className="eyebrow mb-3">{t("ref_code_label")}</p>
        <p className="font-heading text-5xl text-rp-text mb-8 tracking-wider" data-testid="referral-code">{user.referral_code}</p>
        <p className="eyebrow mb-3">{t("ref_link_label")}</p>
        <div className="flex items-center gap-3 border border-rp-border p-3">
          <code className="flex-1 truncate text-rp-mute text-xs font-mono" data-testid="referral-link">{link}</code>
          <button onClick={copy} className="text-rp-mute hover:text-rp-text" data-testid="copy-referral"><Copy className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
