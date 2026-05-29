import { Link, useParams, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../sections/Footer";
import useTitle from "../lib/useTitle";
import { useI18n } from "../lib/i18n";

const SECTIONS = {
  terms: {
    titleKey: "legal_terms_title",
    bodyKeys: ["legal_terms_1", "legal_terms_2", "legal_terms_3", "legal_terms_4", "legal_terms_5"],
  },
  privacy: {
    titleKey: "legal_privacy_title",
    bodyKeys: ["legal_privacy_1", "legal_privacy_2", "legal_privacy_3"],
  },
  cookies: {
    titleKey: "legal_cookies_title",
    bodyKeys: ["legal_cookies_1", "legal_cookies_2"],
  },
};

export default function Legal() {
  const { section } = useParams();
  const { t } = useI18n();
  const meta = SECTIONS[section] || SECTIONS.terms;

  useTitle(t(meta.titleKey));

  if (!SECTIONS[section]) return <Navigate to="/legal/terms" replace />;

  const tabs = [
    { id: "terms", label: t("consent_terms"), to: "/legal/terms" },
    { id: "privacy", label: t("consent_privacy"), to: "/legal/privacy" },
    { id: "cookies", label: t("consent_cookies"), to: "/legal/cookies" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F4F1EA]" data-testid={`legal-page-${section}`}>
      <Navbar />
      <main className="max-w-[720px] mx-auto px-6 py-12 md:py-16">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7C3AED] mb-3">
          {t("legal_page_title")}
        </p>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight font-['Inter_Tight'] mb-2">
          {t(meta.titleKey)}
        </h1>
        <p className="text-[#5A5A5E] text-xs font-mono mb-8">{t("legal_updated")}</p>

        <nav className="flex flex-wrap gap-2 mb-10" aria-label={t("legal_page_title")}>
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.to}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                section === tab.id
                  ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white"
                  : "border-[#2E2E30] text-[#8A8A8E] hover:text-white hover:border-[#7C3AED]/40"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-4 text-[15px] text-[#C4C4C8] leading-relaxed">
          {meta.bodyKeys.map((key) => (
            <p key={key}>{t(key)}</p>
          ))}
        </div>

        <p className="mt-12">
          <Link to="/" className="text-[#A855F7] text-sm hover:underline">
            ← Remake Pixel
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
