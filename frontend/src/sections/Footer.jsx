import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { useI18n } from "../lib/i18n";

export default function Footer() {
  const { t } = useI18n();
  const footerLinks = [
    { label: t("nav_discover"), to: "/discover" },
    { label: t("nav_pricing"), to: "/discover#pricing" },
    { label: t("nav_gallery"), to: "/explore" },
    { label: t("faq_title"), to: "/discover#faq" },
    { label: t("footer_terms"), to: "/legal/terms" },
    { label: t("footer_privacy"), to: "/legal/privacy" },
    { label: t("footer_cookies"), to: "/legal/cookies" },
    { label: t("nav_login"), to: "/login" },
  ];
  return (
    <footer className="relative bg-[#0B0B0C] border-t border-[#2E2E30]" data-testid="footer-section">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 md:py-10">
        <div className="flex items-center justify-center mb-6">
          <Logo to="/" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-5 mb-5 md:mb-6">
          {footerLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.12em] hover:text-[#8A8A8E] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://instagram.com/remake_pix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5A5A5E] text-[10px] font-mono uppercase tracking-[0.12em] hover:text-[#7C3AED] transition-colors"
          >
            @remake_pix
          </a>
        </div>

        <p className="text-center text-[#5A5A5E] text-[10px] font-mono">&copy; 2026 Remake Pixel. {t("footer_rights")}</p>
      </div>
    </footer>
  );
}
