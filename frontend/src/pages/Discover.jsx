import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../sections/Footer";
import DiscoverIntro from "../components/landing/DiscoverIntro";
import ShowcasePanel from "../components/landing/ShowcasePanel";
import InsideRemakePixel from "../sections/InsideRemakePixel";
import AvailableNow from "../sections/AvailableNow";
import Pricing from "../sections/Pricing";
import Reviews from "../sections/Reviews";
import FAQ from "../sections/FAQ";
import CTAFinal from "../sections/CTAFinal";
import { DISCOVER_SHOWCASE } from "../data/discoverShowcase";
import SeoJsonLd from "../components/SeoJsonLd";
import { usePageSeo } from "../lib/usePageSeo";
import { SEO_DISCOVER, faqPageJsonLd } from "../lib/seoEn";

export default function Discover() {
  usePageSeo({
    title: SEO_DISCOVER.title,
    documentTitle: SEO_DISCOVER.documentTitle,
    description: SEO_DISCOVER.description,
    keywords: SEO_DISCOVER.keywords,
    path: SEO_DISCOVER.path,
  });

  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (!hash) return;
    const scrollToHash = () => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const timer = window.setTimeout(scrollToHash, 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0B0B0C]" data-testid="discover-page">
      <SeoJsonLd data={faqPageJsonLd()} />
      <div className="noise-overlay" />
      <Navbar variant="discover" />
      <DiscoverIntro />

      <section id="showcase" className="relative scroll-mt-20" data-testid="discover-showcase">
        {DISCOVER_SHOWCASE.map((item, index) => (
          <ShowcasePanel key={item.id} item={item} index={index} />
        ))}
      </section>

      <InsideRemakePixel />
      <AvailableNow />
      <Pricing />
      <Reviews />
      <FAQ />
      <CTAFinal />
      <Footer />
    </div>
  );
}
