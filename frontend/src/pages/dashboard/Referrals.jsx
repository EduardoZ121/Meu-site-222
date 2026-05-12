import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export default function Referrals() {
  const { user } = useAuth();
  if (!user) return null;
  const link = `${window.location.origin}/register?ref=${user.referral_code}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success("Copied");
  };

  return (
    <div className="max-w-[760px] mx-auto" data-testid="referrals-page">
      <p className="eyebrow mb-3">Referrals</p>
      <h1 className="heading-xl mb-6">Share the studio.</h1>
      <p className="body-text mb-12">When a friend joins through your link and buys a pack over €5, you earn <span className="text-rp-lavender">10 bonus credits</span>.</p>

      <div className="border border-rp-border p-8 mb-10" data-testid="referral-card">
        <p className="eyebrow mb-3">Your code</p>
        <p className="font-heading text-5xl text-rp-text mb-8 tracking-wider" data-testid="referral-code">{user.referral_code}</p>
        <p className="eyebrow mb-3">Your link</p>
        <div className="flex items-center gap-3 border border-rp-border p-3">
          <code className="flex-1 truncate text-rp-mute text-xs font-mono" data-testid="referral-link">{link}</code>
          <button onClick={copy} className="text-rp-mute hover:text-rp-text" data-testid="copy-referral"><Copy className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
