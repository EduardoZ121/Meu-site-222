import Navbar from "../components/Navbar";
import Hero from "../sections/Hero";
import LandingHighlights from "../components/landing/LandingHighlights";
import LandingShowcaseStrip from "../components/landing/LandingShowcaseStrip";
import Footer from "../sections/Footer";
import SeoJsonLd from "../components/SeoJsonLd";
import { usePageSeo } from "../lib/usePageSeo";
import {
  SEO_HOME,
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from "../lib/seoEn";

/** Home — first impression only: hero + teaser. Full story lives on /discover. */
export default function Landing() {
  usePageSeo({
    title: SEO_HOME.title,
    documentTitle: SEO_HOME.documentTitle,
    description: SEO_HOME.description,
    keywords: SEO_HOME.keywords,
    path: SEO_HOME.path,
  });

  return (
    <div className="relative min-h-screen bg-[#0B0B0C]" data-testid="landing-page">
      <SeoJsonLd data={[organizationJsonLd(), webSiteJsonLd(), softwareApplicationJsonLd()]} />
      <div className="noise-overlay" />
      <Navbar />
      <Hero />
      <LandingShowcaseStrip />
      <LandingHighlights />
      <Footer />
    </div>
  );
}
