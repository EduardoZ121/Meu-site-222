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
import useTitle from "../lib/useTitle";
import { useSocialMeta } from "../lib/useSocialMeta";
import { useI18n } from "../lib/i18n";

export default function Discover() {
  const { t } = useI18n();
  useTitle(t("discover_page_title"));
  useSocialMeta({
    title: "Remake Pixel — How it works",
    description: t("discover_intro_body"),
    path: "/discover",
  });

  return (
    <div className="relative min-h-screen bg-[#0B0B0C]" data-testid="discover-page">
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
