import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../sections/Hero";
import QuoteBlock from "../sections/QuoteBlock";
import FeatureSection from "../sections/FeatureSection";
import Marquee from "../sections/Marquee";
import Pricing from "../sections/Pricing";
import FAQ from "../sections/FAQ";
import Founder from "../sections/Founder";
import CTAFinal from "../sections/CTAFinal";
import useTitle from "../lib/useTitle";

export default function Landing() {
  useTitle("Studio");
  return (
    <div className="relative min-h-screen bg-rp-bg" data-testid="landing-page">
      <div className="film-grain" aria-hidden="true" />
      <Navbar />
      <Hero />
      <QuoteBlock />
      <FeatureSection />
      <Marquee />
      <Pricing />
      <Founder />
      <FAQ />
      <CTAFinal />
      <Footer />
    </div>
  );
}
