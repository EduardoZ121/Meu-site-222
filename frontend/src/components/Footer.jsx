import { useI18n } from "../lib/i18n";
import { Link } from "react-router-dom";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative bg-rp-bg border-t border-rp-border">
      <div className="container-rp py-14">
        <div className="flex items-center justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="footer-logo">
            <span className="font-heading italic text-[22px] text-rp-text">Remake</span>
            <span className="w-[3px] h-[3px] bg-rp-purple rounded-full" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-rp-mute">Pixel</span>
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
          {[
            { label: "Studio", to: "/app/generate" },
            { label: "Pricing", to: "/#pricing" },
            { label: "FAQ", to: "/#faq" },
            { label: t("footer_terms"), to: "/legal/terms" },
            { label: t("footer_privacy"), to: "/legal/privacy" },
            { label: "Login", to: "/login" },
            { label: "Sign up", to: "/register" },
          ].map((l) => (
            <Link key={l.label} to={l.to} className="text-rp-mute2 hover:text-rp-lavender transition-colors text-[10px] font-mono uppercase tracking-[0.2em]">
              {l.label}
            </Link>
          ))}
          <a href="https://instagram.com/remake_pix" target="_blank" rel="noreferrer" className="text-rp-mute2 hover:text-rp-lavender text-[10px] font-mono uppercase tracking-[0.2em]">@remake_pix</a>
        </div>
        <p className="text-center text-rp-mute2 text-[10px] font-mono tracking-wider">© 2026 Remake Pixel. {t("footer_rights")}</p>
      </div>
    </footer>
  );
}
