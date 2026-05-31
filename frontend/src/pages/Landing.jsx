import Navbar from "../components/Navbar";
import Hero from "../sections/Hero";
import LandingHighlights from "../components/landing/LandingHighlights";
import LandingShowcaseStrip from "../components/landing/LandingShowcaseStrip";
import Footer from "../sections/Footer";
import useTitle from "../lib/useTitle";
import { useSocialMeta } from "../lib/useSocialMeta";
import { DEFAULT_OG } from "../lib/siteMeta";
import { useI18n } from "../lib/i18n";

/** Home — first impression only: hero + teaser. Full story lives on /discover. */
export default function Landing() {
  const { t } = useI18n();
  useTitle(t("landing_page_title"));
  useSocialMeta({
    title: DEFAULT_OG.title,
    description: DEFAULT_OG.description,
    path: "/",
  });

  return (
    <div className="relative min-h-screen bg-rp-bg" data-testid="landing-page">
      <div className="noise-overlay" />
      <Navbar />
      <Hero />
      <LandingShowcaseStrip />
      <LandingHighlights />
      <Footer />
    </div>
  );
}
